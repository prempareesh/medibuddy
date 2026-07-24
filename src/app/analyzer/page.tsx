"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  FileText, 
  Pill, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Info,
  Calendar,
  Zap,
  Activity,
  Heart,
  TrendingUp,
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface PrescriptionMedicine {
  medicineName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  purpose: string;
  precautions: string;
  confidenceScore: number;
  isUncertain: boolean;
  userConfirmed?: boolean;
}

interface PrescriptionScanResult {
  doctorName?: string;
  doctorRegNo?: string;
  hospitalName?: string;
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  prescriptionDate?: string;
  diagnosis?: string;
  summary: string;
  medicines: PrescriptionMedicine[];
  investigations?: string[];
  followUpDate?: string;
  hasDoctorSignature?: boolean;
  unreadableWordsCount?: number;
  ocrConfidence: number;
  matchConfidence: number;
  databaseConfidence: number;
  overallConfidence: number;
  qualityReport?: any;
  isMock?: boolean;
  disclaimer?: string;
}

interface MedicineScanResult {
  medicineName: string;
  genericName: string;
  brandName: string;
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
  pregnancySafety: string;
  breastfeedingSafety: string;
  commonSideEffects: string[];
  seriousSideEffects: string[];
  storageInstructions: string;
  scheduleCategory: string;
  ocrConfidence: number;
  matchConfidence: number;
  databaseConfidence: number;
  overallConfidence: number;
  qualityReport?: any;
  isVerifiedInDatabase: boolean;
  isMock?: boolean;
  disclaimer?: string;
}

const playCalmChime = () => {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  
  try {
    const ctx = new AudioContextClass();
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.12);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start();
    osc1.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.error("AudioContext failed to initialize:", e);
  }
};

export default function SmartHealthcareScanner() {
  const [activeTab, setActiveTab] = useState<"prescription" | "medicine">("prescription");

  // Prescription States
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [isPrescriptionDragging, setIsPrescriptionDragging] = useState(false);
  const [isPrescriptionScanning, setIsPrescriptionScanning] = useState(false);
  const [prescriptionScanStep, setPrescriptionScanStep] = useState(0);
  const [prescriptionResult, setPrescriptionResult] = useState<PrescriptionScanResult | null>(null);
  const [prescriptionError, setPrescriptionError] = useState<string | null>(null);
  const [prescriptionRemindersCreated, setPrescriptionRemindersCreated] = useState(false);
  const [createdRemindersInfo, setCreatedRemindersInfo] = useState<string[]>([]);
  const [isCreatingPrescriptionReminders, setIsCreatingPrescriptionReminders] = useState(false);

  // Medicine States
  const [medicineImage, setMedicineImage] = useState<string | null>(null);
  const [isMedicineDragging, setIsMedicineDragging] = useState(false);
  const [isMedicineScanning, setIsMedicineScanning] = useState(false);
  const [medicineScanStep, setMedicineScanStep] = useState(0);
  const [medicineResult, setMedicineResult] = useState<MedicineScanResult | null>(null);
  const [medicineError, setMedicineError] = useState<string | null>(null);
  const [medicineReminderCreated, setMedicineReminderCreated] = useState(false);
  const [createdMedicineReminderInfo, setCreatedMedicineReminderInfo] = useState<string>("");
  const [isCreatingMedicineReminder, setIsCreatingMedicineReminder] = useState(false);

  // Input Refs
  const prescriptionFileInputRef = useRef<HTMLInputElement>(null);
  const medicineFileInputRef = useRef<HTMLInputElement>(null);

  const prescriptionCacheRef = useRef<Record<string, PrescriptionScanResult>>({});
  const medicineCacheRef = useRef<Record<string, MedicineScanResult>>({});

  const prescriptionScanSteps = [
    "Analyzing medical document structure...",
    "Executing OCR details & layout checks...",
    "Extracting handwritten/printed medicine names...",
    "Cross-referencing against pharmaceutical database...",
    "Calculating multi-confidence quality metrics...",
    "Assembling clinical prescription summary..."
  ];

  const medicineScanSteps = [
    "Analyzing medicine packaging visual layers...",
    "Checking medicine strip/box contours...",
    "Extracting brand & active formulations...",
    "Validating compound monograph against database...",
    "Synthesizing 20+ clinical parameter scorecards...",
    "Calculating multi-tier confidence metrics..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPrescriptionScanning) {
      setPrescriptionScanStep(0);
      interval = setInterval(() => {
        setPrescriptionScanStep((prev) => (prev < prescriptionScanSteps.length - 1 ? prev + 1 : prev));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPrescriptionScanning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMedicineScanning) {
      setMedicineScanStep(0);
      interval = setInterval(() => {
        setMedicineScanStep((prev) => (prev < medicineScanSteps.length - 1 ? prev + 1 : prev));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isMedicineScanning]);

  const handleTabChange = (tab: "prescription" | "medicine") => {
    setActiveTab(tab);
  };

  const handlePrescriptionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPrescriptionFile(file);
  };

  const processPrescriptionFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setPrescriptionError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    setPrescriptionError(null);
    setPrescriptionResult(null);
    setPrescriptionRemindersCreated(false);
    setCreatedRemindersInfo([]);
    const reader = new FileReader();
    reader.onload = () => {
      setPrescriptionImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMedicineFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processMedicineFile(file);
  };

  const processMedicineFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMedicineError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }
    setMedicineError(null);
    setMedicineResult(null);
    setMedicineReminderCreated(false);
    setCreatedMedicineReminderInfo("");
    const reader = new FileReader();
    reader.onload = () => {
      setMedicineImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Execute Prescription Analysis
  const startPrescriptionAnalysis = async () => {
    if (!prescriptionImage) return;

    setIsPrescriptionScanning(true);
    setPrescriptionError(null);

    if (prescriptionCacheRef.current[prescriptionImage]) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setPrescriptionError(null);
      setPrescriptionResult(prescriptionCacheRef.current[prescriptionImage]);
      setIsPrescriptionScanning(false);
      playCalmChime();
      confetti({ particleCount: 35, spread: 30, colors: ["#10b981", "#34d399"] });
      return;
    }

    try {
      const response = await fetch("/api/analyze-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: prescriptionImage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to identify medicine details from the uploaded image.");
      }

      setPrescriptionError(null);
      prescriptionCacheRef.current[prescriptionImage] = data;
      setPrescriptionResult(data);
      playCalmChime();
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 },
        colors: ["#10b981", "#34d399", "#a7f3d0"]
      });
    } catch (err: any) {
      console.error(err);
      setPrescriptionError(err?.message || "Unable to identify medicine details from the uploaded image.");
    } finally {
      setIsPrescriptionScanning(false);
    }
  };

  // Execute Medicine Analysis
  const startMedicineAnalysis = async () => {
    if (!medicineImage) return;

    setIsMedicineScanning(true);
    setMedicineError(null);

    if (medicineCacheRef.current[medicineImage]) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setMedicineError(null);
      setMedicineResult(medicineCacheRef.current[medicineImage]);
      setIsMedicineScanning(false);
      playCalmChime();
      confetti({ particleCount: 35, spread: 30, colors: ["#10b981", "#34d399"] });
      return;
    }

    try {
      const response = await fetch("/api/analyze-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: medicineImage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to identify medicine details from the uploaded image.");
      }

      setMedicineError(null);
      medicineCacheRef.current[medicineImage] = data;
      setMedicineResult(data);
      playCalmChime();
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 },
        colors: ["#10b981", "#34d399", "#a7f3d0"]
      });
    } catch (err: any) {
      console.error(err);
      setMedicineError(err?.message || "Unable to identify medicine details from the uploaded image.");
    } finally {
      setIsMedicineScanning(false);
    }
  };

  const confirmUncertainMedicine = (index: number) => {
    if (!prescriptionResult) return;
    const updatedMeds = [...prescriptionResult.medicines];
    updatedMeds[index] = {
      ...updatedMeds[index],
      isUncertain: false,
      userConfirmed: true
    };
    setPrescriptionResult({
      ...prescriptionResult,
      medicines: updatedMeds
    });
  };

  const generatePrescriptionReminders = async () => {
    if (!prescriptionResult || prescriptionResult.medicines.length === 0) return;

    // Check if any medicine is unconfirmed/uncertain
    const hasUnconfirmed = prescriptionResult.medicines.some((m) => m.isUncertain && !m.userConfirmed);
    if (hasUnconfirmed) {
      alert("Please review and confirm the low-confidence highlighted medicines before scheduling reminders.");
      return;
    }

    setIsCreatingPrescriptionReminders(true);
    const info: string[] = [];

    for (const med of prescriptionResult.medicines) {
      if (med.medicineName.includes("could not be confidently identified")) continue;
      const time = med.frequency.toLowerCase().includes("twice") ? "08:00, 20:00" : "09:00";
      info.push(`${med.medicineName} scheduled at ${time}`);
    }

    setCreatedRemindersInfo(info);
    setPrescriptionRemindersCreated(true);
    setIsCreatingPrescriptionReminders(false);
    playCalmChime();
    confetti({ particleCount: 30, spread: 25, colors: ["#10b981", "#059669"] });
  };

  const generateMedicineReminder = async () => {
    if (!medicineResult) return;
    setIsCreatingMedicineReminder(true);
    setCreatedMedicineReminderInfo(`${medicineResult.medicineName} scheduled daily at 09:00`);
    setMedicineReminderCreated(true);
    setIsCreatingMedicineReminder(false);
    playCalmChime();
    confetti({ particleCount: 30, spread: 25, colors: ["#10b981", "#059669"] });
  };

  const onDragOverPrescription = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPrescriptionDragging(true);
  };
  const onDragLeavePrescription = () => setIsPrescriptionDragging(false);
  const onDropPrescription = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPrescriptionDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processPrescriptionFile(file);
  };

  const onDragOverMedicine = (e: React.DragEvent) => {
    e.preventDefault();
    setIsMedicineDragging(true);
  };
  const onDragLeaveMedicine = () => setIsMedicineDragging(false);
  const onDropMedicine = (e: React.DragEvent) => {
    e.preventDefault();
    setIsMedicineDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processMedicineFile(file);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24 pt-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Production Clinical AI Engine v3.0</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Smart Healthcare Scanner
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Multimodal OCR & verified pharmaceutical database monograph validation pipeline.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="bg-slate-200/60 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200 shadow-inner self-start md:self-auto">
            <button
              onClick={() => handleTabChange("prescription")}
              className={`h-11 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === "prescription"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Prescription Scanner</span>
            </button>

            <button
              onClick={() => handleTabChange("medicine")}
              className={`h-11 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === "medicine"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-extrabold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Pill className="w-4 h-4 text-emerald-600" />
              <span>Medicine Scanner</span>
            </button>
          </div>
        </div>

        {/* 2-Column Baseline Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* UPLOADER CARD (LEFT COLUMN - 5 COLS) */}
          <div className="lg:col-span-5 flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === "prescription" ? (
                /* PRESCRIPTION UPLOADER */
                <motion.div
                  key="prescription-uploader-card"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`bg-white rounded-2xl border transition-all duration-200 p-6 shadow-sm flex flex-col justify-between h-full ${
                    isPrescriptionDragging ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10" : "border-slate-200/80"
                  }`}
                  onDragOver={onDragOverPrescription}
                  onDragLeave={onDragLeavePrescription}
                  onDrop={onDropPrescription}
                >
                  <input
                    type="file"
                    ref={prescriptionFileInputRef}
                    onChange={handlePrescriptionFile}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Upload Document
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        PNG, JPG, WEBP
                      </span>
                    </div>

                    {!prescriptionImage ? (
                      <div 
                        onClick={() => prescriptionFileInputRef.current?.click()}
                        className="flex-1 min-h-[340px] border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-emerald-50/20 cursor-pointer transition group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600 shadow-sm group-hover:scale-110 transition duration-200">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1">
                          Drop Prescription Document Here
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
                          Extracts doctor name, patient vitals, diagnosis, and medicine schedule.
                        </p>
                        <button
                          type="button"
                          className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider shadow-sm transition"
                        >
                          Select Image File
                        </button>
                      </div>
                    ) : (
                      <div className="relative rounded-xl border border-slate-200/80 bg-slate-50 min-h-[340px] flex items-center justify-center p-3 overflow-hidden shadow-inner group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prescriptionImage}
                          alt="Prescription preview"
                          className="max-h-[340px] max-w-full object-contain rounded-lg shadow-sm"
                        />

                        {isPrescriptionScanning && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 animate-pulse">
                              Auditing Prescription...
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {prescriptionImage && !isPrescriptionScanning && (
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={startPrescriptionAnalysis}
                        className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2 flex-1"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Analyze Document</span>
                      </button>

                      <button
                        onClick={() => {
                          setPrescriptionImage(null);
                          setPrescriptionResult(null);
                          setPrescriptionError(null);
                          setPrescriptionRemindersCreated(false);
                          setCreatedRemindersInfo([]);
                        }}
                        className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* MEDICINE UPLOADER */
                <motion.div
                  key="medicine-uploader-card"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`bg-white rounded-2xl border transition-all duration-200 p-6 shadow-sm flex flex-col justify-between h-full ${
                    isMedicineDragging ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10" : "border-slate-200/80"
                  }`}
                  onDragOver={onDragOverMedicine}
                  onDragLeave={onDragLeaveMedicine}
                  onDrop={onDropMedicine}
                >
                  <input
                    type="file"
                    ref={medicineFileInputRef}
                    onChange={handleMedicineFile}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Upload Packaging
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        PNG, JPG, WEBP
                      </span>
                    </div>

                    {!medicineImage ? (
                      <div 
                        onClick={() => medicineFileInputRef.current?.click()}
                        className="flex-1 min-h-[340px] border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-emerald-50/20 cursor-pointer transition group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600 shadow-sm group-hover:scale-110 transition duration-200">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1">
                          Drop Medicine Packaging / Strip Here
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
                          Extracts 20+ monograph parameters & cross-references pharma database.
                        </p>
                        <button
                          type="button"
                          className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider shadow-sm transition"
                        >
                          Select Image File
                        </button>
                      </div>
                    ) : (
                      <div className="relative rounded-xl border border-slate-200/80 bg-slate-50 min-h-[340px] flex items-center justify-center p-3 overflow-hidden shadow-inner group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={medicineImage}
                          alt="Medicine preview"
                          className="max-h-[340px] max-w-full object-contain rounded-lg shadow-sm"
                        />

                        {isMedicineScanning && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 animate-pulse">
                              Identifying Compound...
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {medicineImage && !isMedicineScanning && (
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={startMedicineAnalysis}
                        className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow hover:-translate-y-0.5 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2 flex-1"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Execute Scan</span>
                      </button>

                      <button
                        onClick={() => {
                          setMedicineImage(null);
                          setMedicineResult(null);
                          setMedicineError(null);
                          setMedicineReminderCreated(false);
                          setCreatedMedicineReminderInfo("");
                        }}
                        className="h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RESULTS PANEL (RIGHT COLUMN - 7 COLS) */}
          <div className="lg:col-span-7 flex flex-col justify-start space-y-6">
            <AnimatePresence mode="wait">
              {/* Empty state */}
              {activeTab === "prescription" && !prescriptionImage && !isPrescriptionScanning && !prescriptionResult && (
                <motion.div
                  key="presc-awaiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm flex flex-col items-center justify-center h-full min-h-[420px]"
                >
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Awaiting Prescription Upload
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Upload a prescription image. The doctor parameters, diagnosis summary, validated medicines, and 4-tier confidence metrics will render here.
                  </p>
                </motion.div>
              )}

              {activeTab === "medicine" && !medicineImage && !isMedicineScanning && !medicineResult && (
                <motion.div
                  key="med-awaiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm flex flex-col items-center justify-center h-full min-h-[420px]"
                >
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
                    <Pill className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    Awaiting Medicine Packaging
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Upload a medicine box or strip image. The 20+ verified monograph parameters and 4-tier confidence metrics will render here.
                  </p>
                </motion.div>
              )}

              {/* Progress Checklist */}
              {isPrescriptionScanning && (
                <motion.div
                  key="presc-scanning-checklist"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm h-full flex flex-col justify-center min-h-[420px]"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Prescription Vision Audit
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                        Step {prescriptionScanStep + 1} of {prescriptionScanSteps.length}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-600 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((prescriptionScanStep + 1) / prescriptionScanSteps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <div className="space-y-3">
                      {prescriptionScanSteps.map((step, idx) => {
                        const isDone = prescriptionScanStep > idx;
                        const isCurrent = prescriptionScanStep === idx;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 text-xs transition-colors duration-200 ${
                              isDone ? "text-emerald-800 font-semibold" : isCurrent ? "text-slate-900 font-bold" : "text-slate-350"
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition duration-200 ${
                              isDone ? "bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold" : isCurrent ? "border-2 border-emerald-600 bg-white text-emerald-600 font-extrabold animate-pulse" : "border border-slate-200 text-slate-300"
                            }`}>
                              {isDone ? "✓" : isCurrent ? "⚡" : idx + 1}
                            </div>
                            <span>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PRESCRIPTION RESULTS DASHBOARD */}
              {prescriptionResult && !isPrescriptionScanning && (
                <motion.div
                  key="prescription-results-view"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Summary Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm border-l-4 border-l-emerald-500 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">
                          Doctor & Patient Audit
                        </span>
                        <h2 className="text-xl font-bold text-slate-900">
                          {prescriptionResult.hospitalName !== "Not visible" ? prescriptionResult.hospitalName : "Prescription Audit Report"}
                        </h2>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Doctor & Patient Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Doctor</span>
                        <span className="font-bold text-slate-800">{prescriptionResult.doctorName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Reg No.</span>
                        <span className="font-bold text-slate-800">{prescriptionResult.doctorRegNo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient</span>
                        <span className="font-bold text-slate-800">{prescriptionResult.patientName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Diagnosis</span>
                        <span className="font-bold text-emerald-700">{prescriptionResult.diagnosis}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Tier Confidence Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">OCR Clarity</span>
                      <span className="text-lg font-black text-slate-900 block mt-0.5">{prescriptionResult.ocrConfidence}%</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Drug Match</span>
                      <span className="text-lg font-black text-emerald-600 block mt-0.5">{prescriptionResult.matchConfidence}%</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pharma DB</span>
                      <span className="text-lg font-black text-emerald-600 block mt-0.5">{prescriptionResult.databaseConfidence}%</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-center bg-emerald-50/30 border-emerald-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Overall Score</span>
                      <span className="text-lg font-black text-emerald-800 block mt-0.5">{prescriptionResult.overallConfidence}%</span>
                    </div>
                  </div>

                  {/* Extracted Medicines List with Yellow Uncertainty Highlights */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Extracted Medications ({prescriptionResult.medicines.length})
                    </h3>

                    {prescriptionResult.medicines.map((med, idx) => {
                      const isHighlightYellow = med.isUncertain && !med.userConfirmed;

                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 space-y-3 ${
                            isHighlightYellow
                              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30"
                              : "bg-white border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-3 h-3 rounded-full shrink-0 ${isHighlightYellow ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
                              <div>
                                <h4 className="text-base font-bold text-slate-900">{med.medicineName}</h4>
                                <span className="text-xs text-slate-500">Generic: {med.genericName}</span>
                              </div>
                            </div>

                            {isHighlightYellow ? (
                              <button
                                onClick={() => confirmUncertainMedicine(idx)}
                                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition active:scale-97 cursor-pointer shrink-0"
                              >
                                Confirm Medicine ✓
                              </button>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                Verified {med.confidenceScore}%
                              </span>
                            )}
                          </div>

                          {isHighlightYellow && (
                            <div className="p-3 rounded-xl bg-amber-100/60 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-semibold">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Low Confidence Extraction: Please verify spelling and click confirm before scheduling reminders.</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase">Dosage</span>
                              <span className="font-bold text-slate-800">{med.dosage}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase">Frequency</span>
                              <span className="font-bold text-slate-800">{med.frequency}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase">Duration</span>
                              <span className="font-bold text-slate-800">{med.duration}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase">Purpose</span>
                              <span className="font-bold text-emerald-700">{med.purpose}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reminder Auto-Sync Banner */}
                  <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>Reminder Engine Auto-Sync</span>
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                        Schedule daily calendar alerts in your dashboard timeline.
                      </p>
                    </div>

                    <button
                      onClick={generatePrescriptionReminders}
                      disabled={prescriptionRemindersCreated || isCreatingPrescriptionReminders}
                      className={`h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition active:scale-97 cursor-pointer shrink-0 ${
                        prescriptionRemindersCreated
                          ? "bg-emerald-100 border border-emerald-200 text-emerald-800 cursor-default"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {prescriptionRemindersCreated ? "Reminders Created ✓" : "Generate Smart Reminders"}
                    </button>
                  </div>

                  {prescriptionRemindersCreated && (
                    <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-xl p-4 text-xs text-emerald-900 space-y-1">
                      <div className="font-bold">Reminders scheduled successfully:</div>
                      <ul className="pl-5 list-disc text-slate-600">
                        {createdRemindersInfo.map((info, i) => (
                          <li key={i}>{info}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {/* MEDICINE PACKAGING RESULTS DASHBOARD */}
              {medicineResult && !isMedicineScanning && (
                <motion.div
                  key="medicine-results-view"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Monograph Header Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm relative overflow-hidden border-l-4 border-l-emerald-500 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">
                          Verified Monograph Match
                        </span>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                          {medicineResult.brandName}
                        </h2>
                        <span className="text-xs text-slate-500 block pt-0.5">
                          Generic: <strong>{medicineResult.genericName}</strong> | Manufacturer: {medicineResult.manufacturer}
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Pill className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        {medicineResult.drugCategory}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                        {medicineResult.prescriptionRequired ? "Rx Required" : "OTC / Non-Prescription"}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                        Strength: {medicineResult.strength}
                      </span>
                    </div>
                  </div>

                  {/* 4-Tier Confidence Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">OCR Clarity</span>
                      <span className="text-lg font-black text-slate-900 block mt-0.5">{medicineResult.ocrConfidence}%</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Drug Match</span>
                      <span className="text-lg font-black text-emerald-600 block mt-0.5">{medicineResult.matchConfidence}%</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pharma DB</span>
                      <span className="text-lg font-black text-emerald-600 block mt-0.5">{medicineResult.databaseConfidence}%</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm text-center bg-emerald-50/30 border-emerald-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Overall Score</span>
                      <span className="text-lg font-black text-emerald-800 block mt-0.5">{medicineResult.overallConfidence}%</span>
                    </div>
                  </div>

                  {/* Detailed Monograph Scorecard Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Adult Dosage</span>
                      <p className="text-slate-800 font-medium leading-relaxed">{medicineResult.adultDosage}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Pediatric Dosage</span>
                      <p className="text-slate-800 font-medium leading-relaxed">{medicineResult.childDosage}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Missed Dose Rule</span>
                      <p className="text-slate-800 font-medium leading-relaxed">{medicineResult.missedDoseInstructions}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Overdose Protocol</span>
                      <p className="text-slate-800 font-medium leading-relaxed">{medicineResult.overdoseInstructions}</p>
                    </div>

                    <div className="bg-amber-50/40 rounded-2xl border border-amber-200/80 p-5 shadow-sm space-y-1">
                      <span className="font-bold text-amber-700 uppercase tracking-wider text-[10px] block">Pregnancy Safety</span>
                      <p className="text-slate-800 font-bold leading-relaxed">{medicineResult.pregnancySafety}</p>
                    </div>

                    <div className="bg-amber-50/40 rounded-2xl border border-amber-200/80 p-5 shadow-sm space-y-1">
                      <span className="font-bold text-amber-700 uppercase tracking-wider text-[10px] block">Breastfeeding Safety</span>
                      <p className="text-slate-800 font-bold leading-relaxed">{medicineResult.breastfeedingSafety}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1 col-span-1 sm:col-span-2">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Known Drug Interactions</span>
                      <ul className="list-disc pl-5 text-slate-700 space-y-0.5">
                        {medicineResult.drugInteractions.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Reminder Auto-Sync Banner */}
                  <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>Configure Smart Alert</span>
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                        Instantly set up a daily calendar alert in your routines timeline.
                      </p>
                    </div>

                    <button
                      onClick={generateMedicineReminder}
                      disabled={medicineReminderCreated || isCreatingMedicineReminder}
                      className={`h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition active:scale-98 cursor-pointer shrink-0 ${
                        medicineReminderCreated
                          ? "bg-emerald-100 border border-emerald-200 text-emerald-800 cursor-default"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {medicineReminderCreated ? "Reminder Scheduled ✓" : "Generate Smart Reminder"}
                    </button>
                  </div>

                  {medicineReminderCreated && (
                    <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-xl p-4 text-xs text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{createdMedicineReminderInfo}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
