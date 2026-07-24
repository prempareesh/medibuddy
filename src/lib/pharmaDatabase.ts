// Production-Grade Pharmaceutical Database & Fuzzy Match Engine

export interface DrugMonograph {
  id: string;
  brandName: string;
  genericName: string;
  aliases: string[];
  manufacturer: string;
  composition: string;
  strength: string;
  drugCategory: string;
  prescriptionRequired: boolean;
  medicalUses: string;
  mechanismOfAction: string;
  adultDosage: string;
  childDosage: string;
  missedDoseInstructions: string;
  overdoseInstructions: string;
  drugInteractions: string[];
  contraindications: string[];
  pregnancySafety: "Category A - Safe" | "Category B - Use with caution" | "Category C - Risk cannot be ruled out" | "Category D - Positive evidence of risk" | "Category X - Contraindicated";
  breastfeedingSafety: "Safe" | "Use with caution" | "Avoid / Consult physician";
  commonSideEffects: string[];
  seriousSideEffects: string[];
  storageInstructions: string;
  scheduleCategory: string;
}

export const PHARMA_DATABASE: DrugMonograph[] = [
  {
    id: "paracetamol_650",
    brandName: "Dolo 650 / Crocin / Calpol",
    genericName: "Paracetamol (Acetaminophen)",
    aliases: ["paracetamol", "dolo", "crocin", "calpol", "tylenol", "pcm", "paracetamol 650", "dolo 650"],
    manufacturer: "Micro Labs Ltd / GSK Healthcare",
    composition: "Paracetamol IP 650mg",
    strength: "650mg",
    drugCategory: "Analgesic & Antipyretic",
    prescriptionRequired: false,
    medicalUses: "Management of mild to moderate pain, fever reduction, body aches, and headaches.",
    mechanismOfAction: "Inhibits cyclooxygenase (COX) enzymes in the central nervous system, reducing prostaglandin synthesis.",
    adultDosage: "650mg every 4 to 6 hours as needed. Maximum 4,000mg (6 tablets) per 24 hours.",
    childDosage: "10 to 15mg/kg per dose every 4 to 6 hours under pediatric guidance.",
    missedDoseInstructions: "Take as soon as remembered if taken for scheduled treatment. Skip if close to next dose.",
    overdoseInstructions: "Emergency: High risk of severe liver damage (hepatotoxicity). Administer N-acetylcysteine immediately at nearest hospital.",
    drugInteractions: ["Warfarin (increased bleeding risk)", "Alcohol (increased liver toxicity risk)", "Cholestyramine"],
    contraindications: ["Severe active hepatic impairment", "Severe acute liver failure", "Hypersensitivity to paracetamol"],
    pregnancySafety: "Category B - Use with caution",
    breastfeedingSafety: "Safe",
    commonSideEffects: ["Mild nausea", "Mild epigastric discomfort"],
    seriousSideEffects: ["Jaundice (yellow eyes/skin)", "Dark urine", "Severe skin rash (Stevens-Johnson syndrome)"],
    storageInstructions: "Store below 30°C in a dry place away from direct sunlight.",
    scheduleCategory: "OTC / Schedule H (varies by region)"
  },
  {
    id: "amoxicillin_500",
    brandName: "Augmentin / Amoxil / Mox",
    genericName: "Amoxicillin Trihydrate",
    aliases: ["amoxicillin", "amoxil", "mox", "augmentin", "amoxicillin trihydrate", "amox 500"],
    manufacturer: "GlaxoSmithKline / Sun Pharma",
    composition: "Amoxicillin Trihydrate IP 500mg",
    strength: "500mg",
    drugCategory: "Aminopenicillin Antibiotic",
    prescriptionRequired: true,
    medicalUses: "Treatment of bacterial infections of the ear, nose, throat, skin, urinary tract, and respiratory tract.",
    mechanismOfAction: "Binds to penicillin-binding proteins (PBPs), inhibiting bacterial cell wall peptidoglycan synthesis.",
    adultDosage: "500mg every 8 hours (or 875mg every 12 hours) for 5 to 10 days.",
    childDosage: "20 to 45mg/kg/day divided every 8 to 12 hours as prescribed.",
    missedDoseInstructions: "Take as soon as remembered. Do not double doses to make up for a missed dose.",
    overdoseInstructions: "May cause gastrointestinal distress, nausea, vomiting, or acute renal impairment. Seek immediate emergency care.",
    drugInteractions: ["Allopurinol (increased rash risk)", "Oral contraceptives (reduced efficacy)", "Methotrexate"],
    contraindications: ["History of severe allergic reaction (anaphylaxis) to penicillins or cephalosporins"],
    pregnancySafety: "Category B - Use with caution",
    breastfeedingSafety: "Safe",
    commonSideEffects: ["Nausea", "Mild diarrhea", "Vomiting", "Skin rash"],
    seriousSideEffects: ["Severe allergic anaphylaxis", "Clostridium difficile colitis (severe bloody diarrhea)", "Shortness of breath"],
    storageInstructions: "Store below 25°C protected from moisture.",
    scheduleCategory: "Schedule H Prescription Drug"
  },
  {
    id: "ibuprofen_400",
    brandName: "Brufen / Advil / Motrin",
    genericName: "Ibuprofen",
    aliases: ["ibuprofen", "brufen", "advil", "motrin", "ibuprofen 400"],
    manufacturer: "Abbott Healthcare",
    composition: "Ibuprofen BP 400mg",
    strength: "400mg",
    drugCategory: "Non-Steroidal Anti-Inflammatory Drug (NSAID)",
    prescriptionRequired: false,
    medicalUses: "Relief of inflammatory pain, arthritis, dental pain, fever, and dysmenorrhea.",
    mechanismOfAction: "Non-selectively inhibits COX-1 and COX-2 enzymes, decreasing inflammatory prostaglandin synthesis.",
    adultDosage: "400mg every 4 to 6 hours with food. Maximum 1,200mg/day OTC (up to 2,400mg under supervision).",
    childDosage: "5 to 10mg/kg every 6 to 8 hours (pediatric formulation only).",
    missedDoseInstructions: "Take with food when remembered if pain persists.",
    overdoseInstructions: "Symptoms include stomach pain, lethargy, drowsiness, or gastrointestinal bleeding. Seek emergency treatment.",
    drugInteractions: ["Aspirin / other NSAIDs", "ACE inhibitors / Antihypertensives", "Anticoagulants (Warfarin)", "Lithium"],
    contraindications: ["Active peptic ulcer disease", "Severe heart failure", "History of GI hemorrhage from NSAIDs", "Third trimester of pregnancy"],
    pregnancySafety: "Category D - Positive evidence of risk",
    breastfeedingSafety: "Use with caution",
    commonSideEffects: ["Heartburn", "Stomach pain", "Nausea", "Dizziness"],
    seriousSideEffects: ["Gastrointestinal ulceration/bleeding", "Renal impairment", "Increased risk of stroke/heart attack"],
    storageInstructions: "Store in cool, dry environment away from heat.",
    scheduleCategory: "Schedule H / OTC"
  },
  {
    id: "metformin_500",
    brandName: "Glycomet / Glucophage",
    genericName: "Metformin Hydrochloride",
    aliases: ["metformin", "glycomet", "glucophage", "metformin 500", "metformin 850"],
    manufacturer: "USV Pvt Ltd / Merck",
    composition: "Metformin Hydrochloride IP 500mg (Sustained/Immediate Release)",
    strength: "500mg",
    drugCategory: "Biguanide Antidiabetic Agent",
    prescriptionRequired: true,
    medicalUses: "First-line oral treatment for Type 2 Diabetes Mellitus and management of PCOS.",
    mechanismOfAction: "Decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves insulin sensitivity.",
    adultDosage: "500mg once or twice daily with meals, gradually increased to a maximum of 2,000mg/day.",
    childDosage: "500mg daily in children aged 10+ under specialist guidance.",
    missedDoseInstructions: "Take with your next scheduled meal. Do not take an extra dose.",
    overdoseInstructions: "High risk of Lactic Acidosis. Symptoms include hypothermia, severe abdominal pain, and drowsiness. Emergency hemodialysis required.",
    drugInteractions: ["Iodinated Contrast Media (risk of renal failure)", "Alcohol (lactic acidosis risk)", "Cimetidine"],
    contraindications: ["Severe renal impairment (eGFR < 30 mL/min)", "Acute metabolic acidosis", "Severe dehydration"],
    pregnancySafety: "Category B - Use with caution",
    breastfeedingSafety: "Safe",
    commonSideEffects: ["Diarrhea", "Flatulence", "Abdominal discomfort", "Metallic taste"],
    seriousSideEffects: ["Lactic Acidosis", "Vitamin B12 deficiency with long-term use"],
    storageInstructions: "Store below 25°C.",
    scheduleCategory: "Schedule H Prescription Drug"
  },
  {
    id: "atorvastatin_20",
    brandName: "Atorva / Lipitor",
    genericName: "Atorvastatin Calcium",
    aliases: ["atorvastatin", "atorva", "lipitor", "atorvastatin 20", "atorvastatin 10"],
    manufacturer: "Zydus Cadila / Pfizer",
    composition: "Atorvastatin Calcium IP 20mg",
    strength: "20mg",
    drugCategory: "HMG-CoA Reductase Inhibitor (Statin)",
    prescriptionRequired: true,
    medicalUses: "Lowering total cholesterol, LDL-C, and triglycerides, and reducing cardiovascular event risk.",
    mechanismOfAction: "Competitively inhibits HMG-CoA reductase, the rate-limiting enzyme in hepatic cholesterol synthesis.",
    adultDosage: "10 to 80mg once daily, taken at any time of day with or without food (preferably bedtime).",
    childDosage: "10 to 20mg daily in pediatric patients with severe heterozygous familial hypercholesterolemia.",
    missedDoseInstructions: "Take if remembered within 12 hours. Skip if more than 12 hours have passed.",
    overdoseInstructions: "No specific antidote. Provide supportive care and monitor liver function.",
    drugInteractions: ["Grapefruit juice (inhibits metabolism)", "Clarithromycin", "Cyclosporine", "Gemfibrozil"],
    contraindications: ["Active liver disease", "Unexplained persistent elevations of serum transaminases", "Pregnancy and lactation"],
    pregnancySafety: "Category X - Contraindicated",
    breastfeedingSafety: "Avoid / Consult physician",
    commonSideEffects: ["Mild muscle discomfort", "Joint pain", "Headache", "Nausea"],
    seriousSideEffects: ["Rhabdomyolysis (severe muscle breakdown)", "Hepatotoxicity", "Elevated blood sugar levels"],
    storageInstructions: "Store at controlled room temperature 20°C to 25°C.",
    scheduleCategory: "Schedule H Prescription Drug"
  },
  {
    id: "amlodipine_5",
    brandName: "Amlokind / Norvasc / Stamlo",
    genericName: "Amlodipine Besylate",
    aliases: ["amlodipine", "amlokind", "norvasc", "stamlo", "amlodipine 5"],
    manufacturer: "Mankind Pharma / Pfizer",
    composition: "Amlodipine Besylate IP 5mg",
    strength: "5mg",
    drugCategory: "Dihydropyridine Calcium Channel Blocker",
    prescriptionRequired: true,
    medicalUses: "Management of hypertension, chronic stable angina, and vasospastic angina.",
    mechanismOfAction: "Inhibits transmembrane influx of calcium ions into vascular smooth muscle and cardiac muscle, inducing peripheral arterial vasodilation.",
    adultDosage: "5mg once daily, increased to maximum 10mg once daily if required.",
    childDosage: "2.5mg to 5mg once daily in children aged 6 to 17 years.",
    missedDoseInstructions: "Take when remembered. Skip if close to next scheduled dose.",
    overdoseInstructions: "May cause severe peripheral vasodilation and hypotension. Seek immediate emergency circulatory support.",
    drugInteractions: ["Simvastatin (limit simvastatin dose to 20mg)", "Diltiazem", "Strong CYP3A4 inhibitors"],
    contraindications: ["Severe hypotension", "Cardiogenic shock", "Aortic stenosis"],
    pregnancySafety: "Category C - Risk cannot be ruled out",
    breastfeedingSafety: "Use with caution",
    commonSideEffects: ["Peripheral edema (ankle swelling)", "Flushing", "Dizziness", "Palpitations"],
    seriousSideEffects: ["Severe hypotension", "Worsening angina upon initiation"],
    storageInstructions: "Store below 30°C protected from light.",
    scheduleCategory: "Schedule H Prescription Drug"
  },
  {
    id: "pantoprazole_40",
    brandName: "Pan 40 / Pantocid / Pantodac",
    genericName: "Pantoprazole Sodium",
    aliases: ["pantoprazole", "pan 40", "pantocid", "pantodac", "panto 40"],
    manufacturer: "Alkem Laboratories / Sun Pharma",
    composition: "Pantoprazole Sodium Gastro-resistant IP 40mg",
    strength: "40mg",
    drugCategory: "Proton Pump Inhibitor (PPI)",
    prescriptionRequired: true,
    medicalUses: "Treatment of GERD, erosive esophagitis, peptic ulcers, and Zollinger-Ellison syndrome.",
    mechanismOfAction: "Suppresses gastric acid secretion by inhibiting the H+/K+-ATPase enzyme system at the secretory surface of gastric parietal cells.",
    adultDosage: "40mg once daily taken 30 minutes before breakfast for 4 to 8 weeks.",
    childDosage: "20mg to 40mg once daily for children aged 5+ under specialist recommendation.",
    missedDoseInstructions: "Take before your next meal if remembered.",
    overdoseInstructions: "Low acute toxicity. Seek medical guidance if excessive ingestion occurs.",
    drugInteractions: ["Atazanavir / Nelfinavir", "Methotrexate", "Clopidogrel", "Ketoconazole"],
    contraindications: ["Hypersensitivity to substituted benzimidazoles"],
    pregnancySafety: "Category B - Use with caution",
    breastfeedingSafety: "Use with caution",
    commonSideEffects: ["Headache", "Mild diarrhea", "Nausea", "Flatulence"],
    seriousSideEffects: ["Clostridium difficile infection", "Bone fractures with long-term high dose", "Hypomagnesemia"],
    storageInstructions: "Swallow tablet whole. Store below 25°C.",
    scheduleCategory: "Schedule H Prescription Drug"
  },
  {
    id: "salbutamol_4",
    brandName: "Asthalin / Ventolin",
    genericName: "Salbutamol (Albuterol) Sulphate",
    aliases: ["salbutamol", "asthalin", "ventolin", "albuterol", "salbutamol 4mg", "salbutamol sulphate"],
    manufacturer: "Cipla Ltd / GSK",
    composition: "Salbutamol Sulphate IP 4mg",
    strength: "4mg",
    drugCategory: "Beta-2 Adrenergic Agonist (Bronchodilator)",
    prescriptionRequired: true,
    medicalUses: "Relief and prevention of bronchospasm in asthma, chronic bronchitis, and COPD.",
    mechanismOfAction: "Selectively stimulates beta-2 adrenergic receptors in bronchial smooth muscle, causing bronchodilation.",
    adultDosage: "2mg to 4mg three to four times daily orally (or via metered dose inhaler as prescribed).",
    childDosage: "1mg to 2mg three times daily for children under pediatric supervision.",
    missedDoseInstructions: "Take as soon as remembered if bronchospasm occurs.",
    overdoseInstructions: "Causes severe tachycardia, tremors, hypokalemia, and hyperglycemia. Seek emergency medical care immediately.",
    drugInteractions: ["Non-selective beta blockers (Propranolol)", "Diuretics (increased hypokalemia risk)", "Digoxin"],
    contraindications: ["Hypersensitivity to salbutamol", "Uncontrolled tachyarrhythmias"],
    pregnancySafety: "Category C - Risk cannot be ruled out",
    breastfeedingSafety: "Use with caution",
    commonSideEffects: ["Tremors (hand shaking)", "Palpitations / Rapid heart rate", "Headache", "Muscle cramps"],
    seriousSideEffects: ["Paradoxical bronchospasm", "Hypokalemia", "Arrhythmias"],
    storageInstructions: "Store below 30°C protected from light.",
    scheduleCategory: "Schedule H Prescription Drug"
  }
];

// Levenshtein distance algorithm for string similarity matching
function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate string similarity ratio between 0.0 and 1.0
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.85;
  }

  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1.0;

  const distance = calculateLevenshteinDistance(s1, s2);
  return Math.max(0, (maxLength - distance) / maxLength);
}

export interface MatchResult {
  monograph: DrugMonograph | null;
  matchScore: number;
  isExactMatch: boolean;
  ocrConfidenceScore: number;
  matchConfidenceScore: number;
  databaseConfidenceScore: number;
  overallConfidenceScore: number;
  correctedMedicineName: string;
}

// Search & validate extracted medicine text against authentic database
export function validateMedicineAgainstDatabase(rawExtractedName: string, rawOcrText?: string): MatchResult {
  const query = (rawExtractedName || "").toLowerCase().trim();

  if (!query || query.includes("could not be confidently identified")) {
    return {
      monograph: null,
      matchScore: 0,
      isExactMatch: false,
      ocrConfidenceScore: 20,
      matchConfidenceScore: 0,
      databaseConfidenceScore: 0,
      overallConfidenceScore: 20,
      correctedMedicineName: "Medicine name could not be confidently identified."
    };
  }

  let bestMatch: DrugMonograph | null = null;
  let highestScore = 0;

  for (const drug of PHARMA_DATABASE) {
    for (const alias of drug.aliases) {
      const sim = calculateStringSimilarity(query, alias);
      if (sim > highestScore) {
        highestScore = sim;
        bestMatch = drug;
      }
    }
  }

  // Base OCR confidence derived from string length & clear character patterns
  const hasDigits = /\d/.test(query);
  const baseOcrScore = Math.min(98, Math.max(40, 60 + (query.length > 5 ? 15 : 5) + (hasDigits ? 10 : 0)));
  
  const matchConfidenceScore = Math.round(highestScore * 100);
  const isMatchValid = highestScore >= 0.55;

  const databaseConfidenceScore = isMatchValid ? 96 : 30;

  const overallConfidenceScore = Math.round(
    baseOcrScore * 0.3 + matchConfidenceScore * 0.4 + databaseConfidenceScore * 0.3
  );

  return {
    monograph: isMatchValid ? bestMatch : null,
    matchScore: highestScore,
    isExactMatch: highestScore >= 0.9,
    ocrConfidenceScore: Math.round(baseOcrScore),
    matchConfidenceScore,
    databaseConfidenceScore,
    overallConfidenceScore: isMatchValid ? overallConfidenceScore : Math.min(overallConfidenceScore, 45),
    correctedMedicineName: isMatchValid && bestMatch ? bestMatch.brandName : rawExtractedName
  };
}
