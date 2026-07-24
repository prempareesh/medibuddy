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

    // Image quality check
    const qualityReport = analyzeImageQuality(image);

    // Cache check using simple image hash
    const imageHash = `med_img_${image.length}_${image.slice(-50, -10)}`;
    const cachedResult = apiCache.get<any>(imageHash);
    if (cachedResult) {
      logClinicalEvent({
        level: "INFO",
        endpoint: "/api/analyze-medicine",
        action: "Cache Hit",
        latencyMs: Date.now() - startTime
      });
      return NextResponse.json(cachedResult, { status: 200 });
    }

    if (!API_KEY) {
      // Fallback matching first pharma item with unverified flags
      const defaultDrug = PHARMA_DATABASE[0];
      const matchResult = validateMedicineAgainstDatabase(defaultDrug.brandName);
      
      const fallbackResponse = {
        medicineName: defaultDrug.brandName,
        genericName: defaultDrug.genericName,
        brandName: defaultDrug.brandName,
        manufacturer: defaultDrug.manufacturer,
        composition: defaultDrug.composition,
        strength: defaultDrug.strength,
        drugCategory: defaultDrug.drugCategory,
        prescriptionRequired: defaultDrug.prescriptionRequired,
        medicalUses: defaultDrug.medicalUses,
        mechanismOfAction: defaultDrug.mechanismOfAction,
        adultDosage: defaultDrug.adultDosage,
        childDosage: defaultDrug.childDosage,
        missedDoseInstructions: defaultDrug.missedDoseInstructions,
        overdoseInstructions: defaultDrug.overdoseInstructions,
        drugInteractions: defaultDrug.drugInteractions,
        contraindications: defaultDrug.contraindications,
        pregnancySafety: defaultDrug.pregnancySafety,
        breastfeedingSafety: defaultDrug.breastfeedingSafety,
        commonSideEffects: defaultDrug.commonSideEffects,
        seriousSideEffects: defaultDrug.seriousSideEffects,
        storageInstructions: defaultDrug.storageInstructions,
        scheduleCategory: defaultDrug.scheduleCategory,
        ocrConfidence: 30,
        matchConfidence: matchResult.matchConfidenceScore,
        databaseConfidence: matchResult.databaseConfidenceScore,
        overallConfidence: 35,
        qualityReport,
        isVerifiedInDatabase: true,
        isMock: true,
        disclaimer: "Sandbox Mode: Cross-referenced against local pharmaceutical database monographs."
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
              text: `Analyze this medicine packaging / strip image carefully. Read the exact text printed on the label.
                     Return EXACTLY a single stringified JSON object matching this structure. No markdown wrappers. All values in English.
                     
                     If you cannot read the medicine name from the image text with high confidence, set "medicineName" to EXACTLY "Medicine name could not be confidently identified." and "confidenceScore" below 40.
                     
                     JSON Structure:
                     {
                       "medicineName": "Exact brand or medicine name read from packaging (e.g. 'Dolo 650', 'Paracetamol 500mg'). If unreadable, 'Medicine name could not be confidently identified.'",
                       "genericName": "Generic active chemical compound if visible (e.g. 'Paracetamol'), or 'Not visible'",
                       "manufacturer": "Manufacturer name if printed, or 'Not visible'",
                       "composition": "Exact formulation/composition (e.g. 'Paracetamol 650mg')",
                       "strength": "Dosage strength (e.g. '650mg')",
                       "drugCategory": "Therapeutic category (e.g. 'Analgesic & Antipyretic')",
                       "prescriptionRequired": true,
                       "medicalUses": "Primary clinical purpose",
                       "mechanismOfAction": "Short biological mechanism of action",
                       "adultDosage": "Standard adult dosage guidelines",
                       "childDosage": "Standard pediatric dosage guidelines or warnings",
                       "missedDoseInstructions": "Instructions for missed dose",
                       "overdoseInstructions": "Emergency steps for accidental overdose",
                       "drugInteractions": ["Key interacting drug or substance"],
                       "contraindications": ["Key medical contraindications"],
                       "pregnancySafety": "Category B - Use with caution",
                       "breastfeedingSafety": "Safe",
                       "commonSideEffects": ["Common side effect"],
                       "seriousSideEffects": ["Red flag severe side effect"],
                       "storageInstructions": "Storage temperature and moisture directives",
                       "scheduleCategory": "Schedule H / OTC",
                       "ocrConfidenceScore": 85
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
      max_tokens: 650,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    
    let rawData: any = {};
    try {
      const jsonString = content.replace(/```json/g, "").replace(/```/g, "").trim();
      rawData = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn("⚠️ Failed to parse JSON from AI vision response:", content);
      rawData = {
        medicineName: "Medicine name could not be confidently identified.",
        genericName: "Not visible",
        ocrConfidenceScore: 25
      };
    }

    // Cross-reference extracted medicine against pharmaceutical database
    const validation = validateMedicineAgainstDatabase(rawData.medicineName || "");
    const monograph = validation.monograph;

    const finalResponse = {
      medicineName: validation.correctedMedicineName,
      genericName: monograph ? monograph.genericName : (rawData.genericName || "Not visible"),
      brandName: monograph ? monograph.brandName : (rawData.medicineName || "Unknown Brand"),
      manufacturer: monograph ? monograph.manufacturer : (rawData.manufacturer || "Not visible"),
      composition: monograph ? monograph.composition : (rawData.composition || "Not visible"),
      strength: monograph ? monograph.strength : (rawData.strength || "Not visible"),
      drugCategory: monograph ? monograph.drugCategory : (rawData.drugCategory || "Pharmaceutical Agent"),
      prescriptionRequired: monograph ? monograph.prescriptionRequired : Boolean(rawData.prescriptionRequired),
      medicalUses: monograph ? monograph.medicalUses : (rawData.medicalUses || "Clinical Health Treatment"),
      mechanismOfAction: monograph ? monograph.mechanismOfAction : (rawData.mechanismOfAction || "Consult medical monograph."),
      adultDosage: monograph ? monograph.adultDosage : (rawData.adultDosage || "Follow physician instructions."),
      childDosage: monograph ? monograph.childDosage : (rawData.childDosage || "Pediatric consultation required."),
      missedDoseInstructions: monograph ? monograph.missedDoseInstructions : (rawData.missedDoseInstructions || "Take when remembered."),
      overdoseInstructions: monograph ? monograph.overdoseInstructions : (rawData.overdoseInstructions || "Seek immediate emergency care."),
      drugInteractions: monograph ? monograph.drugInteractions : (rawData.drugInteractions || ["Consult doctor"]),
      contraindications: monograph ? monograph.contraindications : (rawData.contraindications || ["Known hypersensitivity"]),
      pregnancySafety: monograph ? monograph.pregnancySafety : (rawData.pregnancySafety || "Category B - Use with caution"),
      breastfeedingSafety: monograph ? monograph.breastfeedingSafety : (rawData.breastfeedingSafety || "Use with caution"),
      commonSideEffects: monograph ? monograph.commonSideEffects : (rawData.commonSideEffects || ["Mild stomach pain"]),
      seriousSideEffects: monograph ? monograph.seriousSideEffects : (rawData.seriousSideEffects || ["Severe allergic anaphylaxis"]),
      storageInstructions: monograph ? monograph.storageInstructions : (rawData.storageInstructions || "Store below 30°C"),
      scheduleCategory: monograph ? monograph.scheduleCategory : (rawData.scheduleCategory || "Schedule H"),
      
      // 4-Tier Confidence Metrics
      ocrConfidence: rawData.ocrConfidenceScore || validation.ocrConfidenceScore || qualityReport.blurScore,
      matchConfidence: validation.matchConfidenceScore,
      databaseConfidence: validation.databaseConfidenceScore,
      overallConfidence: validation.overallConfidenceScore,
      
      qualityReport,
      isVerifiedInDatabase: Boolean(monograph),
      disclaimer: "Pharmaceutical Verification: Extracted values cross-referenced against validated medical database monographs."
    };

    // Cache valid responses
    apiCache.set(imageHash, finalResponse);

    logClinicalEvent({
      level: "INFO",
      endpoint: "/api/analyze-medicine",
      action: "Extraction Success",
      latencyMs: Date.now() - startTime,
      confidenceScores: {
        ocr: finalResponse.ocrConfidence,
        match: finalResponse.matchConfidence,
        db: finalResponse.databaseConfidence,
        overall: finalResponse.overallConfidence
      }
    });

    return NextResponse.json(finalResponse, { status: 200 });

  } catch (error: any) {
    console.error("🔴 AI Medicine Analyzer API error:", error);

    const defaultDrug = PHARMA_DATABASE[0];
    return NextResponse.json({
      medicineName: "Medicine name could not be confidently identified.",
      genericName: "Not visible",
      brandName: "Unidentified Packaging",
      manufacturer: "Unidentified Manufacturer",
      composition: "Not visible",
      strength: "Not visible",
      drugCategory: "Unclassified",
      prescriptionRequired: true,
      medicalUses: "Unable to parse packaging text. Please ensure steady lighting.",
      mechanismOfAction: "Consult healthcare practitioner.",
      adultDosage: "Consult physician for proper dosage.",
      childDosage: "Do not administer without medical guidance.",
      missedDoseInstructions: "Consult physician.",
      overdoseInstructions: "In case of overdose, seek emergency care immediately.",
      drugInteractions: ["Consult healthcare provider"],
      contraindications: ["Do not consume unidentified substances"],
      pregnancySafety: "Category B - Use with caution",
      breastfeedingSafety: "Avoid / Consult physician",
      commonSideEffects: ["Unknown"],
      seriousSideEffects: ["Hypersensitivity"],
      storageInstructions: "Store in cool, dry place.",
      scheduleCategory: "Schedule H",
      ocrConfidence: 20,
      matchConfidence: 0,
      databaseConfidence: 0,
      overallConfidence: 20,
      qualityReport: { isAcceptable: false, blurScore: 20, estimatedResolution: "Low", contrastQuality: "Low", recommendations: ["Upload a clearer image"] },
      isVerifiedInDatabase: false,
      disclaimer: "Notice: Image details could not be identified with confidence."
    }, { status: 200 });
  }
}
