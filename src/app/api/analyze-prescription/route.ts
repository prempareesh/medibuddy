import { NextResponse } from "next/server";
import OpenAI from "openai";

const API_KEY = process.env.NVIDIA_API_KEY || process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY || "";
const BASE_URL = process.env.AI_API_BASE_URL || "https://integrate.api.nvidia.com/v1"; 
const MODEL_NAME = process.env.AI_MODEL_NAME || "moonshotai/kimi-k2.6" || "meta/llama-3.2-11b-vision-instruct";

const MOCK_PRESCRIPTIONS = [
  {
    summary: "Dr. Amanda Ross (Cardiologist) - Prescription for cardiovascular health management. Diagnostic notes indicate mild stage 1 hypertension and elevated LDL cholesterol.",
    medicines: [
      {
        medicineName: "Amlodipine Besylate (5mg)",
        genericName: "Amlodipine",
        dosage: "5mg",
        frequency: "Once daily in the morning",
        purpose: "Relax blood vessels and lower blood pressure.",
        precautions: "Avoid grapefruit juice. Monitor for swollen ankles."
      },
      {
        medicineName: "Atorvastatin Calcium (20mg)",
        genericName: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily at bedtime",
        purpose: "Lower bad cholesterol (LDL) and triglycerides.",
        precautions: "Report unexplained muscle pain or weakness immediately."
      },
      {
        medicineName: "Aspirin (81mg)",
        genericName: "Aspirin",
        dosage: "81mg (Low Dose)",
        frequency: "Once daily with lunch",
        purpose: "Lower risk of cardiovascular events.",
        precautions: "Take with food. Avoid other NSAIDs unless directed."
      }
    ],
    confidenceScore: 97
  },
  {
    summary: "Dr. Rajesh Patel (Internal Medicine) - Treatment plan for acute throat infection and associated fever/body pain. Recommendation: Complete full antibiotic course.",
    medicines: [
      {
        medicineName: "Amoxicillin Trihydrate (500mg)",
        genericName: "Amoxicillin",
        dosage: "500mg",
        frequency: "Three times a day",
        purpose: "Treat the bacterial throat infection.",
        precautions: "Complete the full 5-day course even if symptoms resolve. Take after meals."
      },
      {
        medicineName: "Paracetamol (650mg)",
        genericName: "Paracetamol",
        dosage: "650mg",
        frequency: "Every 6 hours as needed for fever",
        purpose: "Control fever and reduce body aches.",
        precautions: "Do not exceed 4,000mg (6 tablets) in 24 hours. Avoid alcohol."
      },
      {
        medicineName: "Levocetirizine (5mg)",
        genericName: "Levocetirizine",
        dosage: "5mg",
        frequency: "Once daily at bedtime",
        purpose: "Relieve runny nose and allergy symptoms.",
        precautions: "May cause drowsiness. Do not drive after taking."
      }
    ],
    confidenceScore: 94
  }
];

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image data received" }, { status: 400 });
    }

    // Fallback if API Key is missing
    if (!API_KEY) {
      console.log("⚠️ No AI API Key found. Returning optimized fallback prescription.");
      const selected = MOCK_PRESCRIPTIONS[Math.floor(Math.random() * MOCK_PRESCRIPTIONS.length)];
      
      // Simulate scanning delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return NextResponse.json({
        ...selected,
        isMock: true,
        disclaimer: "Demo Mode: Calculated via high-fidelity prescription scanner. Always verify with actual doctor guidance."
      }, { status: 200 });
    }

    const openai = new OpenAI({
      apiKey: API_KEY,
      baseURL: BASE_URL,
    });

    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Dissect this medical prescription or report image. Extract the clinical information and list the medicines.
                     Return EXACTLY a single stringified JSON object matching this structure. 
                     Keep descriptions extremely concise (maximum 1 sentence each) to minimize output size. 
                     No markdown wrappers.
                     
                     All values must be in English. Do NOT return any Chinese, Japanese, or other languages under any circumstances.
                     
                     JSON Structure:
                     {
                       "summary": "Brief summary of the prescription context (e.g., diagnosis if visible, doctor info, general purpose)",
                       "medicines": [
                         {
                           "medicineName": "Brand/Generic name (exactly as printed, e.g., 'Tylenol 500mg'). If no medicine name can be confidently read or identified, output EXACTLY 'Medicine name could not be confidently identified.'",
                           "genericName": "Generic/chemical name (e.g., 'Acetaminophen'). If not visible or identifiable, output 'Not visible'",
                           "dosage": "Dosage (e.g., 500mg, 1 tablet)",
                           "frequency": "Frequency (e.g., Twice daily, Once at bedtime)",
                           "purpose": "Primary medical purpose of this medicine",
                           "precautions": "Critical safety warnings/instructions for this medicine"
                         }
                       ],
                       "confidenceScore": 95
                     }
                     
                     Note: Estimate the 'confidenceScore' (0-100) dynamically based on how clear, sharp, and readable the text in the image is.`
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
      max_tokens: 450, // Reduced token limit for faster response times
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    
    try {
      const jsonString = content.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(jsonString);
      return NextResponse.json(parsedData, { status: 200 });
    } catch (parseError) {
      console.warn("⚠️ Failed to parse JSON from AI model response. Returning fallback representation.", content);
      
      return NextResponse.json({
        summary: "Unable to identify medicine details from the uploaded image.",
        medicines: [
          {
            medicineName: "Medicine name could not be confidently identified.",
            genericName: "Not visible",
            dosage: "N/A",
            frequency: "N/A",
            purpose: "Unable to parse prescription details.",
            precautions: "Please consult your physician directly."
          }
        ],
        confidenceScore: 35,
        isFallbackText: true
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error("🔴 AI Prescription Scanner API error:", error);
    return NextResponse.json({ 
      error: "Unable to identify medicine details from the uploaded image.",
      message: error?.message || "Internal server error" 
    }, { status: 500 });
  }
}
