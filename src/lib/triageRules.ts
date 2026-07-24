import { CDSSPayload, TriageLevel, PatientIntakeData } from "./clinicalTypes";

// 20+ Red-Flag Emergency Keywords Engine
export const RED_FLAG_RULES = [
  { keywords: ["chest pain", "pressure in chest", "crushing pain", "cardiac pain"], reason: "Potential Acute Coronary Syndrome / Myocardial Infarction" },
  { keywords: ["difficulty breathing", "shortness of breath", "can't breathe", "suffocating"], reason: "Acute Respiratory Distress / Pulmonary Compromise" },
  { keywords: ["stroke", "face drooping", "arm weakness", "speech difficulty", "slurred speech"], reason: "Acute Ischemic / Hemorrhagic Stroke (FAST Alert)" },
  { keywords: ["seizure", "convulsions", "epileptic fit"], reason: "Acute Neurological Seizure / Status Epilepticus" },
  { keywords: ["loss of consciousness", "passed out", "unresponsive", "fainted"], reason: "Syncope / Loss of Cerebral Perfusion" },
  { keywords: ["stiff neck with high fever", "fever with confusion", "hallucinations"], reason: "Suspected Acute Bacterial Meningitis" },
  { keywords: ["vomiting blood", "hematemesis"], reason: "Upper Gastrointestinal Hemorrhage" },
  { keywords: ["blood in stool", "black stool", "melena", "hematochezia"], reason: "Gastrointestinal Bleeding" },
  { keywords: ["severe allergic reaction", "anaphylaxis", "swollen tongue", "throat closing"], reason: "Anaphylaxis / Severe Systemic Hypersensitivity" },
  { keywords: ["heavy bleeding", "uncontrollable bleeding", "hemorrhage"], reason: "Acute Hemorrhagic Shock Risk" },
  { keywords: ["severe abdominal pain", "rigid abdomen", "acute abdomen"], reason: "Possible Visceral Perforation / Acute Appendicitis" },
  { keywords: ["sudden vision loss", "blindness in one eye"], reason: "Retinal Artery Occlusion / Ophthalmic Emergency" },
  { keywords: ["poison ingestion", "swallowed chemical", "overdose"], reason: "Acute Toxic Ingestion / Poisoning" },
  { keywords: ["suicidal", "want to end life", "harm myself"], reason: "Acute Mental Health Crisis / Suicidal Ideation" }
];

export function evaluateRedFlags(userText: string, intake?: PatientIntakeData): { isEmergency: boolean; reason?: string } {
  const query = `${userText} ${intake?.associatedSymptoms || ""} ${intake?.painType || ""}`.toLowerCase();

  for (const rule of RED_FLAG_RULES) {
    if (rule.keywords.some((kw) => query.includes(kw))) {
      return { isEmergency: true, reason: rule.reason };
    }
  }

  // Evaluate vitals if present
  if (intake?.oxygenSaturation) {
    const spo2 = parseFloat(intake.oxygenSaturation);
    if (!isNaN(spo2) && spo2 < 92) {
      return { isEmergency: true, reason: `Critically low oxygen saturation (${spo2}% SpO2)` };
    }
  }

  if (intake?.severity && intake.severity >= 9) {
    return { isEmergency: true, reason: `Extreme unbearable pain severity (${intake.severity}/10)` };
  }

  return { isEmergency: false };
}

export function buildEmergencyPayload(reason: string, language: string = "english"): CDSSPayload {
  const normLang = language.toLowerCase();
  const isHindi = normLang === "hindi" || normLang === "hi" || normLang === "hi-in";
  const isTelugu = normLang === "telugu" || normLang === "te" || normLang === "te-in";

  if (isHindi) {
    return {
      riskLevel: "EMERGENCY",
      emergencyTriggered: true,
      emergencyNotice: `🚨 आपातकालीन चेतावनी: (${reason})। तुरंत 108 पर कॉल करें या निकटतम अस्पताल ER जाएं।`,
      patientSummary: `आपातकालीन स्थिति: ${reason}`,
      primarySymptoms: ["गंभीर आपातकालीन लक्षण"],
      clinicalAssessment: "तत्काल आपातकालीन पुनर्जीवन और चिकित्सा मूल्यांकन आवश्यक है।",
      rankedDifferential: [
        {
          conditionName: reason,
          icd10Code: "R99 / Emergency",
          likelihood: "High",
          confidenceRange: "90-98%",
          rationale: "गंभीर आपातकालीन लक्षणों के आधार पर स्थिति।",
          supportingEvidence: [reason],
          opposingEvidence: [],
          missingInfoNeeded: ["आपातकालीन ईसीजी", "वाइटल्स मॉनिटर"]
        }
      ],
      followUpQuestions: [
        "क्या आप अभी अकेले हैं या आपके साथ कोई मदद के लिए मौजूद है?",
        "क्या आपको अभी सांस लेने में भारी तकलीफ या सीने में दबाव है?",
        "क्या 108 आपातकालीन सेवा को कॉल कर दिया गया है?"
      ],
      recommendations: [
        "खुद गाड़ी चलाकर अस्पताल न जाएं।",
        "तुरंत 108 पर आपातकालीन सेवा को कॉल करें।",
        "आराम से बैठें और शांत रहें।"
      ],
      warningSigns: [
        "बेहोशी की स्थिति",
        "चेहरे या होंठों का नीला पड़ना",
        "अचेत होना"
      ],
      recommendedTests: ["आपातकालीन ईसीजी", "ट्रोपोनिन टेस्ट", "रक्त गैस विश्लेषण"],
      immediateAdvice: "सभी शारीरिक गतिविधियों को तुरंत रोकें और आपातकालीन एम्बुलेंस की प्रतीक्षा करें।",
      qualityScores: {
        evidenceStrength: 95,
        clinicalConfidence: 96,
        missingInformation: ["तत्काल प्रयोगशाला जांच"],
        diagnosticCompleteness: 92
      },
      disclaimer: "⚠️ आपातकालीन अस्वीकरण: मेडीबडी एआई सीडीएसएस एक सूचनात्मक निर्णय सहायता उपकरण है और आपातकालीन चिकित्सा सेवाओं का स्थान नहीं लेता है।"
    };
  }

  if (isTelugu) {
    return {
      riskLevel: "EMERGENCY",
      emergencyTriggered: true,
      emergencyNotice: `🚨 అత్యవసర హెచ్చరిక: (${reason}). దయచేసి వెంటనే 108 కి కాల్ చేయండి లేదా అత్యవసర ఆసుపత్రికి వెళ్లండి.`,
      patientSummary: `అత్యవసర మూల్యాంకనం: ${reason}`,
      primarySymptoms: ["తీవ్రమైన అత్యవసర ప్రమాద సంకేతాలు"],
      clinicalAssessment: "వెంటనే అత్యవసర వైద్య చికిత్స మరియు స్థిరీకరణ అవసరం.",
      rankedDifferential: [
        {
          conditionName: reason,
          icd10Code: "R99 / Emergency",
          likelihood: "High",
          confidenceRange: "90-98%",
          rationale: "తీవ్రమైన అత్యవసర ప్రమాద సంకేతాల వలన గుర్తించబడింది.",
          supportingEvidence: [reason],
          opposingEvidence: [],
          missingInfoNeeded: ["ఎమర్జెన్సీ ECG", "వైటల్స్ మానిటర్"]
        }
      ],
      followUpQuestions: [
        "మీరు ప్రస్తుతం ఒంటరిగా ఉన్నారా లేదా మీకు సహాయం చేయడానికి ఎవరైనా ఉన్నారా?",
        "మీకు ప్రస్తుతం తీవ్రమైన శ్వాసకోశ ఇబ్బంది లేదా ఛాతీపై ఒత్తిడి ఉందా?",
        "అత్యవసర సేవలకు (108) సమాచారం అందించారా?"
      ],
      recommendations: [
        "సొంతంగా వాహనం నడుపుతూ ఆసుపత్రికి వెళ్లవద్దు.",
        "వెంటనే 108 అత్యవసర సేవలకు కాల్ చేయండి.",
        "ప్రశాంతంగా కూర్చుని విశ్రాంతి తీసుకోండి."
      ],
      warningSigns: [
        "స్పృహ తప్పడం",
        "పెదవులు/గోళ్లు నీలం రంగులోకి మారడం",
        "స్పందించని స్థితి"
      ],
      recommendedTests: ["ఎమర్జెన్సీ ECG", "ట్రోపోనిన్ పరీక్ష", "బ్లడ్ గ్యాస్ అనాలిసిస్"],
      immediateAdvice: "వెంటనే అన్ని శారీరక శ్రమలను నిలిపివేసి ఎమర్జెన్సీ అంబులెన్స్ కోసం నిరీక్షించండి.",
      qualityScores: {
        evidenceStrength: 95,
        clinicalConfidence: 96,
        missingInformation: ["ల్యాబ్ పరీక్షలు"],
        diagnosticCompleteness: 92
      },
      disclaimer: "⚠️ అత్యవసర నిరాకరణ: మెడిబడ్డీ AI CDSS అనేది ఒక సమాచార మద్దతు సాధనం మరియు అత్యవసర వైద్య సేవల స్థానాన్ని భర్తీ చేయదు."
    };
  }

  return {
    riskLevel: "EMERGENCY",
    emergencyTriggered: true,
    emergencyNotice: `🚨 EMERGENCY RED-FLAG ALERT: (${reason}). Please call 108 / 911 or proceed immediately to the nearest Emergency Room.`,
    patientSummary: `Emergency evaluation triggered due to: ${reason}`,
    primarySymptoms: ["Critical Red-Flag Symptoms Present"],
    clinicalAssessment: "Immediate emergency resuscitation and clinical stabilization required.",
    rankedDifferential: [
      {
        conditionName: reason,
        icd10Code: "R99 / Emergency",
        likelihood: "High",
        confidenceRange: "90-98%",
        rationale: "Triggered by acute emergency red-flag criteria.",
        supportingEvidence: [reason],
        opposingEvidence: [],
        missingInfoNeeded: ["Emergency ECG", "Vitals Monitor", "Blood Gas Analysis"]
      }
    ],
    followUpQuestions: [
      "Are you currently alone or with someone who can assist you?",
      "Do you have severe shortness of breath or crushing chest pressure right now?",
      "Have emergency services (108 / 911) been dispatched?"
    ],
    recommendations: [
      "DO NOT DRIVE YOURSELF to the hospital.",
      "Call emergency services (108 / 911) immediately.",
      "Rest in a comfortable, seated position."
    ],
    warningSigns: [
      "Loss of consciousness",
      "Cyanosis (bluish lips/fingernails)",
      "Unresponsive state"
    ],
    recommendedTests: ["Emergency ECG", "Troponin I/T", "Arterial Blood Gas (ABG)", "STAT CT Scan"],
    immediateAdvice: "Cease all physical activity immediately and request emergency transport.",
    qualityScores: {
      evidenceStrength: 95,
      clinicalConfidence: 96,
      missingInformation: ["STAT Laboratory Workup"],
      diagnosticCompleteness: 92
    },
    disclaimer: "⚠️ EMERGENCY DISCLAIMER: MediBuddy AI CDSS is an informational triage decision tool and does not replace emergency medical services."
  };
}
