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
  const isHindi = language === "hindi";
  const isTelugu = language === "telugu";

  return {
    riskLevel: "EMERGENCY",
    emergencyTriggered: true,
    emergencyNotice: isHindi
      ? `🚨 आपातकालीन चेतावनी: (${reason})। तुरंत 108 पर कॉल करें या निकटतम अस्पताल ER जाएं।`
      : isTelugu
      ? `🚨 అత్యవసర హెచ్చరిక: (${reason}). దయచేసి వెంటనే 108 కి కాల్ చేయండి.`
      : `🚨 EMERGENCY RED-FLAG ALERT: (${reason}). Please call 108 / 911 or proceed immediately to the nearest Emergency Room.`,
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
