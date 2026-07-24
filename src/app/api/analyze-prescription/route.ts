import { NextResponse } from "next/server";
import OpenAI from "openai";
import { validateMedicineAgainstDatabase, PHARMA_DATABASE } from "@/lib/pharmaDatabase";
import { analyzeImageQuality } from "@/lib/imagePreprocessing";
import { apiCache } from "@/lib/cache";
import { logClinicalEvent } from "@/lib/logger";

const API_KEY = process.env.NVIDIA_API_KEY || process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY || "";
const BASE_URL = process.env.AI_API_BASE_URL || "https://integrate.api.nvidia.com/v1"; 
const VISION_MODEL_NAME = process.env.AI_VISION_MODEL_NAME || "meta/llama-3.2-11b-vision-instruct";

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image data received" }, { status: 400 });
    }

    const qualityReport = analyzeImageQuality(image);
    const imageHash = `presc_img_${image.length}_${image.slice(-50, -10)}`;

    const cachedResult = apiCache.get<any>(imageHash);
    if (cachedResult) {
      logClinicalEvent({
        level: "INFO",
        endpoint: "/api/analyze-prescription",
        action: "Cache Hit",
        latencyMs: Date.now() - startTime
      });
      return NextResponse.json(cachedResult, { status: 200 });
    }

    if (!API_KEY) {
      // Fallback matching verified monograph medicines
      const med1 = PHARMA_DATABASE[0]; // Dolo 650
      const med2 = PHARMA_DATABASE[1]; // Augmentin

      const fallbackResponse = {
        doctorName: "Dr. Amanda Ross, M.D.",
        doctorRegNo: "MCI-784920",
        hospitalName: "City Heart & General Hospital",
        patientName: "John Doe",
        patientAge: "42",
        patientGender: "Male",
        prescriptionDate: new Date().toLocaleDateString(),
        diagnosis: "Acute Upper Respiratory Infection & Mild Fever",
        summary: "Prescription for respiratory infection and fever control.",
        medicines: [
          {
            medicineName: med1.brandName,
            genericName: med1.genericName,
            dosage: "650mg",
            frequency: "Three times a day after meals",
            duration: "5 days",
            purpose: med1.medicalUses,
            precautions: med1.missedDoseInstructions,
            confidenceScore: 95,
            isUncertain: false
          },
          {
            medicineName: med2.brandName,
            genericName: med2.genericName,
            dosage: "500mg",
            frequency: "Twice daily",
            duration: "5 days",
            purpose: med2.medicalUses,
            precautions: med2.missedDoseInstructions,
            confidenceScore: 92,
            isUncertain: false
          }
        ],
        investigations: ["Complete Blood Count (CBC)", "Chest X-Ray if fever persists"],
        followUpDate: "In 5 days",
        hasDoctorSignature: true,
        unreadableWordsCount: 0,
        ocrConfidence: 94,
        matchConfidence: 96,
        databaseConfidence: 96,
        overallConfidence: 95,
        qualityReport,
        isMock: true,
        disclaimer: "Sandbox Mode: Simulated prescription layout verified against pharmaceutical database."
      };
      return NextResponse.json(fallbackResponse, { status: 200 });
    }

    const openai = new OpenAI({
      apiKey: API_KEY,
      baseURL: BASE_URL,
    });

    const response = await openai.chat.completions.create({
      model: VISION_MODEL_NAME,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Dissect this medical prescription or report image thoroughly. Read all printed and handwritten text.
                     Return EXACTLY a single stringified JSON object matching this structure. No markdown wrappers. All values in English.
                     
                     JSON Structure:
                     {
                       "doctorName": "Doctor name if visible (e.g. 'Dr. A. Ross'), or 'Not visible'",
                       "doctorRegNo": "Registration number if visible, or 'Not visible'",
                       "hospitalName": "Hospital/Clinic name if visible, or 'Not visible'",
                       "patientName": "Patient name if visible, or 'Not visible'",
                       "patientAge": "Age if visible, or 'Not visible'",
                       "patientGender": "Gender if visible, or 'Not visible'",
                       "prescriptionDate": "Date if printed, or 'Not visible'",
                       "diagnosis": "Clinical diagnosis or symptoms noted",
                       "summary": "Brief overall clinical context of prescription",
                       "medicines": [
                         {
                           "medicineName": "Brand or generic drug name (e.g. 'Amlodipine 5mg'). If unreadable, 'Medicine name could not be confidently identified.'",
                           "genericName": "Generic active compound if visible, or 'Not visible'",
                           "dosage": "Dosage (e.g., 500mg, 1 tablet)",
                           "frequency": "Frequency (e.g., Twice daily, Once at bedtime)",
                           "duration": "Duration (e.g. 5 days)",
                           "purpose": "Primary clinical purpose of medicine",
                           "precautions": "Safety warnings or special administration notes",
                           "confidenceScore": 90
                         }
                       ],
                       "investigations": ["Recommended blood tests, X-rays, or lab reports"],
                       "followUpDate": "Follow-up schedule date if specified",
                       "hasDoctorSignature": true,
                       "unreadableWordsCount": 0,
                       "ocrConfidenceScore": 88
                     }`
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      max_tokens: 750,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    
    let rawData: any = {};
    try {
      const jsonString = content.replace(/```json/g, "").replace(/```/g, "").trim();
      rawData = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn("⚠️ Failed to parse JSON from AI prescription vision response:", content);
      rawData = {
        summary: "Unable to parse prescription details from uploaded image.",
        medicines: []
      };
    }

    // Validate extracted medicines against authentic drug monographs
    const validatedMedicines = (rawData.medicines || []).map((med: any) => {
      const val = validateMedicineAgainstDatabase(med.medicineName || "");
      const isUncertain = val.overallConfidenceScore < 60 || !val.monograph;

      return {
        medicineName: val.correctedMedicineName,
        genericName: val.monograph ? val.monograph.genericName : (med.genericName || "Not visible"),
        dosage: med.dosage || "As directed",
        frequency: med.frequency || "Once daily",
        duration: med.duration || "As advised",
        purpose: val.monograph ? val.monograph.medicalUses : (med.purpose || "Clinical treatment"),
        precautions: val.monograph ? val.monograph.missedDoseInstructions : (med.precautions || "Take after food"),
        confidenceScore: Math.round(val.overallConfidenceScore),
        isUncertain
      };
    });

    // Compute average confidence scores across extracted items
    const avgOcr = rawData.ocrConfidenceScore || qualityReport.blurScore;
    const avgMatch = validatedMedicines.length > 0
      ? Math.round(validatedMedicines.reduce((acc: number, m: any) => acc + m.confidenceScore, 0) / validatedMedicines.length)
      : 40;

    const finalResponse = {
      doctorName: rawData.doctorName || "Not visible",
      doctorRegNo: rawData.doctorRegNo || "Not visible",
      hospitalName: rawData.hospitalName || "Not visible",
      patientName: rawData.patientName || "Not visible",
      patientAge: rawData.patientAge || "Not visible",
      patientGender: rawData.patientGender || "Not visible",
      prescriptionDate: rawData.prescriptionDate || new Date().toLocaleDateString(),
      diagnosis: rawData.diagnosis || "General Clinical Consultation",
      summary: rawData.summary || "Prescription report audit completed.",
      medicines: validatedMedicines,
      investigations: rawData.investigations || ["Follow up as recommended by consulting physician"],
      followUpDate: rawData.followUpDate || "As needed",
      hasDoctorSignature: Boolean(rawData.hasDoctorSignature),
      unreadableWordsCount: rawData.unreadableWordsCount || 0,
      
      ocrConfidence: avgOcr,
      matchConfidence: avgMatch,
      databaseConfidence: avgMatch > 60 ? 95 : 35,
      overallConfidence: Math.round((avgOcr * 0.3) + (avgMatch * 0.7)),
      
      qualityReport,
      disclaimer: "Prescription Audit: Extracted medicines cross-referenced against pharmaceutical database. Review highlighted items before scheduling."
    };

    apiCache.set(imageHash, finalResponse);

    logClinicalEvent({
      level: "INFO",
      endpoint: "/api/analyze-prescription",
      action: "Prescription Extraction Success",
      latencyMs: Date.now() - startTime,
      confidenceScores: {
        ocr: finalResponse.ocrConfidence,
        match: finalResponse.matchConfidence,
        overall: finalResponse.overallConfidence
      }
    });

    return NextResponse.json(finalResponse, { status: 200 });

  } catch (error: any) {
    console.error("🔴 AI Prescription Scanner API error:", error);
    return NextResponse.json({
      doctorName: "Not visible",
      doctorRegNo: "Not visible",
      hospitalName: "Not visible",
      patientName: "Not visible",
      patientAge: "Not visible",
      patientGender: "Not visible",
      prescriptionDate: new Date().toLocaleDateString(),
      diagnosis: "Prescription Audit Failed",
      summary: "Unable to parse prescription details. Please upload a clearer photograph.",
      medicines: [
        {
          medicineName: "Medicine name could not be confidently identified.",
          genericName: "Not visible",
          dosage: "N/A",
          frequency: "N/A",
          duration: "N/A",
          purpose: "Please try uploading a clearer, higher-resolution photograph.",
          precautions: "Ensure handwriting is well lit and not blurred.",
          confidenceScore: 25,
          isUncertain: true
        }
      ],
      investigations: ["N/A"],
      followUpDate: "N/A",
      hasDoctorSignature: false,
      unreadableWordsCount: 3,
      ocrConfidence: 25,
      matchConfidence: 0,
      databaseConfidence: 0,
      overallConfidence: 25,
      qualityReport: { isAcceptable: false, blurScore: 25, estimatedResolution: "Low", contrastQuality: "Low", recommendations: ["Upload a clearer photo"] },
      disclaimer: "Notice: Image details could not be parsed with confidence."
    }, { status: 200 });
  }
}
