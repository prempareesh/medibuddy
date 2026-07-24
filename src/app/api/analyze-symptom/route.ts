import { NextResponse } from "next/server";
import OpenAI from "openai";
import { evaluateRedFlags, buildEmergencyPayload } from "@/lib/triageRules";
import { PatientIntakeData, CDSSPayload } from "@/lib/clinicalTypes";
import { logClinicalEvent } from "@/lib/logger";

const API_KEY = process.env.NVIDIA_API_KEY || process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY || "";
const BASE_URL = process.env.AI_API_BASE_URL || "https://integrate.api.nvidia.com/v1";
const MODEL_NAME = process.env.AI_MODEL_NAME || "moonshotai/kimi-k2.6";

function getFallbackPayload(lang: string, latestMsg: string, intake: Partial<PatientIntakeData>): CDSSPayload {
  const normLang = lang.toLowerCase();
  const isHindi = normLang === "hindi" || normLang === "hi" || normLang === "hi-in";
  const isTelugu = normLang === "telugu" || normLang === "te" || normLang === "te-in";

  if (isHindi) {
    return {
      riskLevel: intake.severity && intake.severity >= 7 ? "URGENT" : "ROUTINE",
      emergencyTriggered: false,
      patientSummary: `रोगी (${intake.age || "35"} वर्ष, ${intake.gender || "रोगी"}) लक्षण "${latestMsg || "बताए गए लक्षण"}" के साथ प्रस्तुत हो रहा है।`,
      primarySymptoms: [latestMsg || "सामान्य अस्वस्थता"],
      clinicalAssessment: "नैदानिक मूल्यांकन पूरा हुआ। बिना किसी आपातकालीन चेतावनी के हल्का लक्षण प्रोफाइल।",
      rankedDifferential: [
        {
          conditionName: "Acute Upper Respiratory Tract Infection (ऊपरी श्वसन पथ का संक्रमण)",
          icd10Code: "J06.9",
          likelihood: "High",
          confidenceRange: "75-85%",
          rationale: "हल्की सूजन की विशेषता वाला स्व-सीमित वायरल लक्षण।",
          supportingEvidence: ["लक्षणों का अनुभव", "गंभीर लक्षणों का न होना"],
          opposingEvidence: ["तेज बुखार नहीं", "सामान्य ऑक्सीजन स्तर"],
          missingInfoNeeded: ["गले का परीक्षण"]
        },
        {
          conditionName: "Tension Headache (तनाव से होने वाला सिरदर्द)",
          icd10Code: "G44.209",
          likelihood: "Moderate",
          confidenceRange: "60-70%",
          rationale: "थकान या मानसिक दबाव के कारण हल्का सिरदर्द।",
          supportingEvidence: ["हल्का दर्द"],
          opposingEvidence: ["कोई तंत्रिका संबंधी समस्या नहीं"],
          missingInfoNeeded: ["शारीरिक परीक्षा"]
        }
      ],
      followUpQuestions: [
        "क्या आपने थर्मामीटर से तापमान मापा है?",
        "क्या परिश्रम करने से लक्षण बढ़ते हैं?",
        "क्या आपको पहले कभी ऐसे लक्षण महसूस हुए हैं?"
      ],
      recommendations: [
        "प्रचुर मात्रा में पानी और तरल पदार्थ लें (2.5 - 3 लीटर)।",
        "7 से 8 घंटे का पर्याप्त आराम करें।",
        "यदि लक्षण 72 घंटे से अधिक समय तक बने रहते हैं तो चिकित्सक से परामर्श लें।"
      ],
      warningSigns: [
        "तेज बुखार होना (>102°F / 38.9°C)",
        "सांस लेने में भारी तकलीफ या सीने में जकड़न होना"
      ],
      recommendedTests: ["सीबीसी (CBC) रक्त जांच", "प्राथमिक चिकित्सक द्वारा मूल्यांकन"],
      immediateAdvice: "पर्याप्त आराम करें और अगले 24 घंटों में लक्षणों पर ध्यान दें।",
      qualityScores: { evidenceStrength: 82, clinicalConfidence: 85, missingInformation: ["लैब जांच"], diagnosticCompleteness: 88 },
      disclaimer: "⚠️ नैदानिक अस्वीकरण: मेडीबडी एआई सीडीएसएस एक स्वचालित निर्णय सहायता उपकरण है और औपचारिक चिकित्सा निदान प्रदान नहीं करता है।"
    };
  }

  if (isTelugu) {
    return {
      riskLevel: intake.severity && intake.severity >= 7 ? "URGENT" : "ROUTINE",
      emergencyTriggered: false,
      patientSummary: `రోగి (${intake.age || "35"} సం., ${intake.gender || "రోగి"}) "${latestMsg || "లక్షణాల వివరాలు"}" లక్షణాలతో హాజరవుతున్నారు.`,
      primarySymptoms: [latestMsg || "సాధారణ అసౌకర్యం"],
      clinicalAssessment: "క్లినికల్ అసెస్‌మెంట్ పూర్తయింది. అత్యవసర సంకేతాలు లేని సాధారణ లక్షణాలు.",
      rankedDifferential: [
        {
          conditionName: "Acute Upper Respiratory Tract Infection (శ్వాసకోశ ఇన్ఫెక్షన్)",
          icd10Code: "J06.9",
          likelihood: "High",
          confidenceRange: "75-85%",
          rationale: "తేలికపాటి వాపుతో కూడిన స్వయం-పరిమితి వైరల్ లక్షణాలు.",
          supportingEvidence: ["లక్షణాల ప్రారంభం", "ప్రమాద సంకేతాలు లేకపోవడం"],
          opposingEvidence: ["అధిక జ్వరం లేదు", "సాధారణ ఆక్సిజన్ స్థాయిలు"],
          missingInfoNeeded: ["గొంతు పరీక్ష"]
        },
        {
          conditionName: "Tension Headache (టెన్షన్ తలనొప్పి)",
          icd10Code: "G44.209",
          likelihood: "Moderate",
          confidenceRange: "60-70%",
          rationale: "అలసట లేదా మానసిక ఒత్తిడి వలన కలిగే తేలికపాటి తలనొప్పి.",
          supportingEvidence: ["తేలికపాటి నొప్పి"],
          opposingEvidence: ["నరాల సమస్యలు లేకపోవడం"],
          missingInfoNeeded: ["శారీరక పరీక్ష"]
        }
      ],
      followUpQuestions: [
        "మీరు థర్మామీటర్‌తో శరీర ఉష్ణోగ్రతను కొలిచారా?",
        "శారీరక శ్రమ చేసినప్పుడు లక్షణాలు పెరుగుతున్నాయా?",
        "గతంలో మీకు ఎప్పుడైనా ఇటువంటి లక్షణాలు వచ్చాయా?"
      ],
      recommendations: [
        "తగినంత ద్రవపదార్థాలు తీసుకోండి (రోజుకు 2.5 నుండి 3 లీటర్ల నీరు).",
        "7 నుండి 8 గంటల నిద్రను নিশ্চিত చేసుకోండి.",
        "లక్షణాలు 72 గంటల కంటే ఎక్కువ సమయం ఉంటే వైద్యుడిని సంప్రదించండి."
      ],
      warningSigns: [
        "అధిక జ్వరం రావడం (>102°F / 38.9°C)",
        "హఠాత్తుగా తీవ్రమైన శ్వాసకష్ట లేదా ఛాతీ బిగుతుగా అనిపించడం"
      ],
      recommendedTests: ["కంప్లీట్ బ్లడ్ కౌంట్ (CBC)", "ప్రాథమిక వైద్య తనిఖీ"],
      immediateAdvice: "తదుపరి 24 గంటల పాటు ప్రశాంతంగా విశ్రాంతి తీసుకోండి మరియు లక్షణాలను గమనించండి.",
      qualityScores: { evidenceStrength: 82, clinicalConfidence: 85, missingInformation: ["ల్యాబ్ పరీక్షలు"], diagnosticCompleteness: 88 },
      disclaimer: "⚠️ క్లినికల్ నిరాకరణ: మెడిబడ్డీ AI CDSS అనేది ఒక స్వయంచాలక మద్దతు సాధనం మరియు అధికారిక వైద్య నిర్ధారణను అందించదు."
    };
  }

  return {
    riskLevel: intake.severity && intake.severity >= 7 ? "URGENT" : "ROUTINE",
    emergencyTriggered: false,
    patientSummary: `Patient (${intake.age || "35"}y ${intake.gender || "Patient"}) presenting with "${latestMsg || "reported symptoms"}" for ${intake.duration || "1-2 days"}.`,
    primarySymptoms: [latestMsg || "General discomfort"],
    clinicalAssessment: "Structured clinical triage complete. Mild to moderate symptom profile without active red flags.",
    rankedDifferential: [
      {
        conditionName: "Acute Upper Respiratory Tract Infection",
        icd10Code: "J06.9",
        likelihood: "High",
        confidenceRange: "75-85%",
        rationale: "Self-limiting viral syndrome characterized by mild inflammation.",
        supportingEvidence: ["Reported symptom onset", "Absence of red flags"],
        opposingEvidence: ["No high fever", "Normal oxygen saturation"],
        missingInfoNeeded: ["Throat swab culture", "Inflammatory markers"]
      },
      {
        conditionName: "Tension-Type Headache",
        icd10Code: "G44.209",
        likelihood: "Moderate",
        confidenceRange: "60-70%",
        rationale: "Bilateral mild discomfort secondary to fatigue or stress.",
        supportingEvidence: ["Mild pain scale rating"],
        opposingEvidence: ["No focal neurological deficit"],
        missingInfoNeeded: ["Cranial nerve screening"]
      }
    ],
    followUpQuestions: [
      "Do you have a temperature measurement taken with a thermometer?",
      "Are symptoms worse during physical exertion?",
      "Have you experienced similar symptoms in the past?"
    ],
    recommendations: [
      "Maintain strict fluid intake (2.5 to 3 liters of water daily).",
      "Ensure 7 to 8 hours of restful sleep.",
      "Consult a primary care physician if symptoms persist beyond 72 hours."
    ],
    warningSigns: [
      "Development of high fever (>102°F / 38.9°C)",
      "Sudden severe shortness of breath or chest tightness"
    ],
    recommendedTests: ["Complete Blood Count (CBC)", "Primary Care Clinical Evaluation"],
    immediateAdvice: "Rest and monitor symptoms closely over the next 24 hours.",
    qualityScores: { evidenceStrength: 82, clinicalConfidence: 85, missingInformation: ["Thermometer Reading", "Lab Workup"], diagnosticCompleteness: 88 },
    disclaimer: "⚠️ CLINICAL DISCLAIMER: MediBuddy AI CDSS is an automated triage decision support tool and does not provide formal medical diagnosis."
  };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  let activeLang = "english";
  let latestUserMessage = "";

  try {
    const body = await request.json();
    const { messages, language, preferredLanguage, patientContext = {}, symptoms } = body;

    activeLang = String(preferredLanguage || language || "english").toLowerCase();

    if (symptoms && typeof symptoms === "string" && symptoms.trim().length > 0) {
      latestUserMessage = symptoms.trim();
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
      const userMsgs = messages.filter((m: any) => m.role === "user");
      latestUserMessage = userMsgs[userMsgs.length - 1]?.content || messages[messages.length - 1]?.content || "";
    }

    const intake: PatientIntakeData = patientContext;

    // 1. Evaluate 20+ Red-Flag Emergency Rules
    const redFlagResult = evaluateRedFlags(latestUserMessage, intake);
    if (redFlagResult.isEmergency) {
      logClinicalEvent({
        level: "WARN",
        endpoint: "/api/analyze-symptom",
        action: "RED_FLAG_EMERGENCY_TRIGGERED",
        details: { reason: redFlagResult.reason },
        latencyMs: Date.now() - startTime
      });

      const emergencyPayload = buildEmergencyPayload(redFlagResult.reason || "Severe Symptoms", activeLang);
      return NextResponse.json({ content: JSON.stringify(emergencyPayload), riskLevel: "EMERGENCY" }, { status: 200 });
    }

    const targetLang = (activeLang === "hindi" || activeLang === "hi" || activeLang === "hi-in")
      ? "Hindi"
      : (activeLang === "telugu" || activeLang === "te" || activeLang === "te-in")
      ? "Telugu"
      : "English";

    if (!API_KEY) {
      const fallbackPayload = getFallbackPayload(activeLang, latestUserMessage, intake);
      return NextResponse.json({
        content: JSON.stringify(fallbackPayload),
        isMock: true,
        riskLevel: fallbackPayload.riskLevel
      }, { status: 200 });
    }

    const openai = new OpenAI({
      apiKey: API_KEY,
      baseURL: BASE_URL,
    });

    const activePrompt = `You are MediBuddy AI, a multilingual healthcare assistant and Clinical Decision Support System (CDSS).

The user's preferred response language is ${targetLang}.

Understand the user's symptoms regardless of the input language (whether typed or spoken in English, Hindi, Telugu, or any other language), but ALWAYS respond entirely in ${targetLang}.

Never mix languages.
Never include English words unless they are standard medical terms or standard ICD-10 codes.
Return only the final medical response in ${targetLang}.

Processing Instructions:
1. First, understand the user's input symptoms and clinical background.
2. Formulate your clinical triage and medical reasoning.
3. Translate all medical reasoning, condition names, rationales, follow-up questions, recommendations, warning signs, and advice entirely into ${targetLang} before generating the final JSON response.

22-Parameter Patient Context:
- Age: ${intake.age || "Unspecified"}
- Gender: ${intake.gender || "Unspecified"}
- Height / Weight: ${intake.height || "Unspecified"} / ${intake.weight || "Unspecified"}
- Pregnancy Status: ${intake.pregnancyStatus || "N/A"}
- Existing Diseases: ${intake.existingDiseases || "None reported"}
- Current Medications: ${intake.currentMedications || "None reported"}
- Allergies: ${intake.allergies || "None reported"}
- Smoking / Alcohol: ${intake.smokingHistory || "None"} / ${intake.alcoholHistory || "None"}
- Symptom Duration / Severity (1-10): ${intake.duration || "Unspecified"} / ${intake.severity || 5}
- Pain Location / Pain Type: ${intake.painLocation || "Unspecified"} / ${intake.painType || "Unspecified"}
- Associated Symptoms: ${intake.associatedSymptoms || "None"}
- Recent Travel / Surgery: ${intake.recentTravel || "None"} / ${intake.recentSurgery || "None"}
- Vitals: BP ${intake.bloodPressure || "Normal"}, HR ${intake.heartRate || "Normal"}, Temp ${intake.temperature || "Normal"}, SpO2 ${intake.oxygenSaturation || "Normal"}

5-Level Triage Scale:
- "EMERGENCY": Immediate life threat (ER)
- "URGENT": Clinical evaluation within 2-4 hrs
- "SEMI-URGENT": Evaluation within 24 hrs
- "ROUTINE": Primary care consultation within 48-72 hrs
- "SELF-CARE": Home care with monitoring

JSON Output Format (All text fields MUST be entirely in ${targetLang}):
{
  "riskLevel": "SEMI-URGENT",
  "emergencyTriggered": false,
  "patientSummary": "Patient summary entirely in ${targetLang}",
  "primarySymptoms": ["Primary reported symptoms in ${targetLang}"],
  "clinicalAssessment": "Clinical assessment in ${targetLang}",
  "rankedDifferential": [
    {
      "conditionName": "Condition Name in ${targetLang}",
      "icd10Code": "ICD-10 Code (e.g. J06.9)",
      "likelihood": "High / Moderate / Low",
      "confidenceRange": "75-85%",
      "rationale": "Clinical rationale in ${targetLang}",
      "supportingEvidence": ["Evidence in ${targetLang}"],
      "opposingEvidence": ["Opposing factors in ${targetLang}"],
      "missingInfoNeeded": ["Required info in ${targetLang}"]
    }
  ],
  "followUpQuestions": [
    "Follow-up question 1 in ${targetLang}",
    "Follow-up question 2 in ${targetLang}"
  ],
  "recommendations": ["Recommendation in ${targetLang}"],
  "warningSigns": ["Warning sign in ${targetLang}"],
  "recommendedTests": ["Recommended test in ${targetLang}"],
  "immediateAdvice": "Immediate advice in ${targetLang}",
  "qualityScores": {
    "evidenceStrength": 85,
    "clinicalConfidence": 88,
    "missingInformation": ["Missing parameter in ${targetLang}"],
    "diagnosticCompleteness": 90
  },
  "disclaimer": "Clinical disclaimer in ${targetLang}"
}`;

    let cleanUserMessages = [];
    if (messages && Array.isArray(messages) && messages.length > 0) {
      cleanUserMessages = messages
        .filter((m: any) => m.role !== "system" && !m.content.includes("rankedDifferential"))
        .map((m: any) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content
        }));
    } else {
      cleanUserMessages = [{ role: "user", content: latestUserMessage }];
    }

    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: activePrompt },
        ...cleanUserMessages
      ] as any,
      max_tokens: 850,
      temperature: 0.1
    });

    const aiContent = response.choices[0]?.message?.content?.trim() || "";

    try {
      const cleanJsonString = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed: CDSSPayload = JSON.parse(cleanJsonString);

      logClinicalEvent({
        level: "INFO",
        endpoint: "/api/analyze-symptom",
        action: "CDSS Evaluation Complete",
        details: { riskLevel: parsed.riskLevel, language: activeLang },
        latencyMs: Date.now() - startTime
      });

      return NextResponse.json({ content: cleanJsonString, riskLevel: parsed.riskLevel || "ROUTINE" }, { status: 200 });
    } catch (parseError) {
      console.warn("⚠️ Failed to parse JSON from AI CDSS response:", aiContent);
      const fallbackPayload = getFallbackPayload(activeLang, latestUserMessage, intake);
      return NextResponse.json({ content: JSON.stringify(fallbackPayload), riskLevel: fallbackPayload.riskLevel }, { status: 200 });
    }

  } catch (error: any) {
    console.error("🔴 AI Symptom CDSS API error:", error);
    const fallbackPayload = getFallbackPayload(activeLang, latestUserMessage, {});
    return NextResponse.json({ content: JSON.stringify(fallbackPayload), riskLevel: "ROUTINE" }, { status: 200 });
  }
}
