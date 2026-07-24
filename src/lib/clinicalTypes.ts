// Production Clinical Decision Support System (CDSS) Types

export type TriageLevel = "EMERGENCY" | "URGENT" | "SEMI-URGENT" | "ROUTINE" | "SELF-CARE";

export interface PatientIntakeData {
  age: string;
  gender: string;
  height: string;
  weight: string;
  pregnancyStatus: string;
  existingDiseases: string;
  currentMedications: string;
  allergies: string;
  smokingHistory: string;
  alcoholHistory: string;
  duration: string;
  severity: number; // 1-10
  painLocation: string;
  painType: string;
  associatedSymptoms: string;
  recentTravel: string;
  recentSurgery: string;
  familyHistory: string;
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  oxygenSaturation: string;
}

export interface DifferentialItem {
  conditionName: string;
  icd10Code: string;
  likelihood: "High" | "Moderate" | "Low";
  confidenceRange: string;
  rationale: string;
  supportingEvidence: string[];
  opposingEvidence: string[];
  missingInfoNeeded: string[];
}

export interface ClinicalQualityScores {
  evidenceStrength: number; // 0-100%
  clinicalConfidence: number; // 0-100%
  missingInformation: string[];
  diagnosticCompleteness: number; // 0-100%
}

export interface CDSSPayload {
  riskLevel: TriageLevel;
  emergencyTriggered: boolean;
  emergencyNotice?: string;
  patientSummary: string;
  primarySymptoms: string[];
  clinicalAssessment: string;
  rankedDifferential: DifferentialItem[];
  followUpQuestions: string[];
  recommendations: string[];
  warningSigns: string[];
  recommendedTests: string[];
  immediateAdvice: string;
  qualityScores: ClinicalQualityScores;
  disclaimer: string;
}
