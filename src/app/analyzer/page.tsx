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
  ArrowRight,
  Plus,
  Info,
  Calendar,
  Zap,
  Activity,
  Heart,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface PrescriptionMedicine {
  medicineName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  purpose: string;
  precautions: string;
}

interface PrescriptionScanResult {
  summary: string;
  medicines: PrescriptionMedicine[];
  confidenceScore: number;
  isMock?: boolean;
  disclaimer?: string;
}

interface MedicineScanResult {
  medicineName: string;
  genericName: string;
  purpose: string;
  dosageGuidance: string;
  sideEffects: string;
  precautions: string;
  usageRecommendations: string;
  confidenceScore: number;
  isMock?: boolean;
  disclaimer?: string;
}

const playCalmChime = () => {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  
  try {
    const ctx = new AudioContextClass();
    
    // Primary Tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.12); // A5
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Harmony Tone (Major Third above E5 => G#5 to C#6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(830.61, ctx.currentTime); // G#5
    osc2.frequency.exponentialRampToValueAtTime(1109.73, ctx.currentTime + 0.12); // C#6
    gain2.gain.setValueAtTime(0.06, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    
    osc1.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.8);
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

  // Refs for inputs
  const prescriptionFileInputRef = useRef<HTMLInputElement>(null);
  const medicineFileInputRef = useRef<HTMLInputElement>(null);

  const prescriptionCacheRef = useRef<Record<string, PrescriptionScanResult>>({});
  const medicineCacheRef = useRef<Record<string, MedicineScanResult>>({});

  const prescriptionScanSteps = [
    "Analyzing medical document structure...",
    "Executing OCR details & layout checks...",
    "Extracting handwritten/printed medicine names...",
    "Identifying dosage & frequency parameters...",
    "Evaluating drug purpose & safety profiles...",
    "Assembling clinical prescription summary..."
  ];

  const medicineScanSteps = [
    "Analyzing medicine packaging visual layers...",
    "Checking medicine strip/box contours...",
    "Extracting brand & active formulations...",
    "Cross-referencing safety precautions database...",
    "Synthesizing dosage guidance scorecard...",
    "Calculating scan clarity confidence score..."
  ];

  // Optimized Image compressor helper: downscales to 600x600 and quality 0.65 for much faster processing
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.65)); // 65% quality JPEG for fast payload size
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  // Progressive loading states while scanning
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPrescriptionScanning) {
      setPrescriptionScanStep(0);
      interval = setInterval(() => {
        setPrescriptionScanStep((prev) => (prev < prescriptionScanSteps.length - 1 ? prev + 1 : prev));
      }, 550);
    }
    return () => clearInterval(interval);
  }, [isPrescriptionScanning]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMedicineScanning) {
      setMedicineScanStep(0);
      interval = setInterval(() => {
        setMedicineScanStep((prev) => (prev < medicineScanSteps.length - 1 ? prev + 1 : prev));
      }, 550);
    }
    return () => clearInterval(interval);
  }, [isMedicineScanning]);

  // Tab switching reset/helpers
  const handleTabChange = (tab: "prescription" | "medicine") => {
    setActiveTab(tab);
  };

  // Uploader Handlers
  const handlePrescriptionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPrescriptionFile(file);
  };

  const processPrescriptionFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setPrescriptionError("Unable to identify medicine details from the uploaded image.");
      return;
    }
    setPrescriptionError(null);
    setPrescriptionResult(null);
    setPrescriptionRemindersCreated(false);
    setCreatedRemindersInfo([]);
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string);
      setPrescriptionImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleMedicineFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processMedicineFile(file);
  };

  const processMedicineFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setMedicineError("Unable to identify medicine details from the uploaded image.");
      return;
    }
    setMedicineError(null);
    setMedicineResult(null);
    setMedicineReminderCreated(false);
    setCreatedMedicineReminderInfo("");
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImage(reader.result as string);
      setMedicineImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  // Execute Prescription Scan
  const startPrescriptionAnalysis = async () => {
    if (!prescriptionImage) return;

    setIsPrescriptionScanning(true);
    setPrescriptionError(null);

    if (prescriptionCacheRef.current[prescriptionImage]) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setPrescriptionResult(prescriptionCacheRef.current[prescriptionImage]);
      setIsPrescriptionScanning(false);
      playCalmChime();
      confetti({
        particleCount: 35,
        spread: 30,
        colors: ["#10b981", "#34d399"]
      });
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

      // Safeguard: Check if AI failed to detect anything
      if (data.medicines && data.medicines.some((m: any) => m.medicineName.includes("could not be confidently identified") && data.confidenceScore < 40)) {
        throw new Error("Unable to identify medicine details from the uploaded image.");
      }

      prescriptionCacheRef.current[prescriptionImage] = data;
      setPrescriptionResult(data);
      playCalmChime();
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 },
        colors: ["#10b981", "#34d399", "#a7f3d0"]
      });

      // Save extracted medicines to clinical scan history logs
      if (data.medicines && data.medicines.length > 0) {
        for (const med of data.medicines) {
          if (med.medicineName === "Medicine name could not be confidently identified.") continue;
          try {
            await fetch("/api/history", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                medicineName: med.medicineName,
                purpose: med.purpose,
                usage: `Generic: ${med.genericName} | Dosage: ${med.dosage} | Frequency: ${med.frequency}`,
                precautions: med.precautions,
                sideEffects: "Prescription Analysis",
                imageUrl: prescriptionImage
              })
            });
          } catch (historyErr) {
            console.warn("Failed to sync prescription medicine to history log:", historyErr);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setPrescriptionError(err?.message || "Unable to identify medicine details from the uploaded image.");
    } finally {
      setIsPrescriptionScanning(false);
    }
  };

  // Execute Medicine Scan
  const startMedicineAnalysis = async () => {
    if (!medicineImage) return;

    setIsMedicineScanning(true);
    setMedicineError(null);

    if (medicineCacheRef.current[medicineImage]) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMedicineResult(medicineCacheRef.current[medicineImage]);
      setIsMedicineScanning(false);
      playCalmChime();
      confetti({
        particleCount: 35,
        spread: 30,
        colors: ["#10b981", "#34d399"]
      });
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

      // Safeguard: Check if AI failed to detect the compound
      if (data.medicineName === "Medicine name could not be confidently identified." && data.confidenceScore < 40) {
        throw new Error("Unable to identify medicine details from the uploaded image.");
      }

      medicineCacheRef.current[medicineImage] = data;
      setMedicineResult(data);
      playCalmChime();
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 },
        colors: ["#10b981", "#34d399", "#a7f3d0"]
      });

      // Sync to history log if identifiable
      if (data.medicineName !== "Medicine name could not be confidently identified.") {
        try {
          await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              medicineName: data.medicineName,
              purpose: data.purpose,
              usage: `Generic: ${data.genericName} | Dosage: ${data.dosageGuidance} | Recommendations: ${data.usageRecommendations}`,
              precautions: data.precautions,
              sideEffects: data.sideEffects,
              imageUrl: medicineImage
            })
          });
        } catch (historyErr) {
          console.warn("Failed to sync medicine packaging to history log:", historyErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setMedicineError(err?.message || "Unable to identify medicine details from the uploaded image.");
    } finally {
      setIsMedicineScanning(false);
    }
  };

  // Helper to parse reminder times from frequency text
  const parseTimesFromFrequency = (frequency: string, dosage: string): { times: string[], note: string } => {
    const f = (frequency || "").toLowerCase();
    const d = (dosage || "").toLowerCase();
    
    let times: string[] = ["09:00"]; 
    let note = d ? `Dose: ${dosage}` : "";

    if (f.includes("three times") || f.includes("thrice") || f.includes("tid") || f.includes("3 times") || f.includes("3x")) {
      times = ["08:00", "13:00", "20:00"];
      note = `${note ? note + " | " : ""}Breakfast, Lunch, Dinner`;
    } else if (f.includes("twice") || f.includes("bid") || f.includes("2 times") || f.includes("2x")) {
      times = ["08:00", "20:00"];
      note = `${note ? note + " | " : ""}Morning and Night`;
    } else if (f.includes("four times") || f.includes("qid") || f.includes("4 times") || f.includes("4x")) {
      times = ["08:00", "12:00", "16:00", "20:00"];
      note = `${note ? note + " | " : ""}Every 4 hours`;
    } else if (f.includes("bedtime") || f.includes("night") || f.includes("evening") || f.includes("pm") || f.includes("hs")) {
      times = ["21:00"];
      note = `${note ? note + " | " : ""}Bedtime`;
    } else if (f.includes("morning") || f.includes("am") || f.includes("once daily") || f.includes("once a day") || f.includes("qd")) {
      times = ["08:00"];
      note = `${note ? note + " | " : ""}Morning`;
    } else if (f.includes("every 6 hours")) {
      times = ["06:00", "12:00", "18:00", "00:00"];
      note = `${note ? note + " | " : ""}Every 6 hours`;
    } else if (f.includes("every 8 hours")) {
      times = ["08:00", "16:00", "00:00"];
      note = `${note ? note + " | " : ""}Every 8 hours`;
    } else if (f.includes("every 12 hours")) {
      times = ["08:00", "20:00"];
      note = `${note ? note + " | " : ""}Every 12 hours`;
    }

    return { times, note };
  };

  // Helper to save a single reminder
  const saveReminder = async (medicineName: string, time: string, note: string) => {
    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicineName, time, note }),
      });
      const data = await response.json();
      if (!response.ok || data.isMock) {
        saveReminderLocally(medicineName, time, note);
      }
    } catch (err) {
      console.warn("API reminder save failed. Emulating locally:", err);
      saveReminderLocally(medicineName, time, note);
    }
  };

  const saveReminderLocally = (medicineName: string, time: string, note: string) => {
    const local = localStorage.getItem("medibuddy_reminders");
    let currentList = [];
    if (local) {
      try {
        currentList = JSON.parse(local);
      } catch (e) {
        currentList = [];
      }
    }
    const newItem = {
      _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      medicineName,
      time,
      note,
      active: true,
      takenDates: [],
      createdAt: new Date().toISOString()
    };
    currentList = [newItem, ...currentList];
    localStorage.setItem("medibuddy_reminders", JSON.stringify(currentList));
  };

  // Create Reminders for all Prescription medicines
  const generatePrescriptionReminders = async () => {
    if (!prescriptionResult || prescriptionResult.medicines.length === 0) return;
    setIsCreatingPrescriptionReminders(true);

    const info: string[] = [];

    for (const med of prescriptionResult.medicines) {
      // Do not schedule reminders if the name is unidentified
      if (med.medicineName === "Medicine name could not be confidently identified.") continue;
      const { times, note } = parseTimesFromFrequency(med.frequency, med.dosage);
      const timesFormatted = times.join(", ");
      info.push(`${med.medicineName} scheduled at ${timesFormatted}`);

      for (const time of times) {
        await saveReminder(med.medicineName, time, note);
      }
    }

    setCreatedRemindersInfo(info);
    setPrescriptionRemindersCreated(true);
    setIsCreatingPrescriptionReminders(false);
    playCalmChime();

    confetti({
      particleCount: 30,
      spread: 25,
      colors: ["#10b981", "#059669"]
    });
  };

  // Create Reminder for Medicine Packaging
  const generateMedicineReminder = async () => {
    if (!medicineResult) return;
    setIsCreatingMedicineReminder(true);

    const { times, note } = parseTimesFromFrequency(medicineResult.dosageGuidance, "");
    const timesFormatted = times.join(", ");

    for (const time of times) {
      await saveReminder(medicineResult.medicineName, time, `Generic: ${medicineResult.genericName} | Recommendations: ${medicineResult.usageRecommendations}`);
    }

    setCreatedMedicineReminderInfo(`${medicineResult.medicineName} scheduled at ${timesFormatted}`);
    setMedicineReminderCreated(true);
    setIsCreatingMedicineReminder(false);
    playCalmChime();

    confetti({
      particleCount: 30,
      spread: 25,
      colors: ["#10b981", "#059669"]
    });
  };

  // Drag and drop events
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
    <div className="relative min-h-screen bg-dots py-20 px-4 sm:px-8">
      {/* Glow Effects */}
      <div className="absolute top-10 right-10 w-[26rem] h-[26rem] bg-emerald-500/[0.012] rounded-full filter blur-[100px] -z-10 pulse-airy" />
      <div className="absolute bottom-10 left-10 w-[26rem] h-[26rem] bg-teal-500/[0.012] rounded-full filter blur-[100px] -z-10 pulse-airy" style={{ animationDelay: "2s" }} />

      <div className="max-w-6xl mx-auto">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 mb-4 text-emerald-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Clinical Analyzer Core v2.1</span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3"
          >
            Smart Healthcare Scanner
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-slate-500 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed"
          >
            Upload doctor prescriptions, reports, or medicine boxes. MediBuddy AI instantly extracts clinical schedules, dosages, safety precautions, and syncs reminders.
          </motion.p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center mb-10">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 relative border border-slate-200/40 shadow-inner">
            <button
              onClick={() => handleTabChange("prescription")}
              className={`relative px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors duration-200 z-10 flex items-center gap-2 cursor-pointer ${
                activeTab === "prescription" ? "text-emerald-850" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {activeTab === "prescription" && (
                <motion.div
                  layoutId="active-scan-tab"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm border border-emerald-100 -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <FileText className="w-3.5 h-3.5" />
              Prescription Scanner
            </button>
            <button
              onClick={() => handleTabChange("medicine")}
              className={`relative px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors duration-200 z-10 flex items-center gap-2 cursor-pointer ${
                activeTab === "medicine" ? "text-emerald-850" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {activeTab === "medicine" && (
                <motion.div
                  layoutId="active-scan-tab"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm border border-emerald-100 -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <Pill className="w-3.5 h-3.5" />
              Medicine Scanner
            </button>
          </div>
        </div>

        {/* Tab Layout Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* UPLOADER PANEL (LEFT COLUMN) */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {activeTab === "prescription" ? (
                // PRESCRIPTION UPLOADER
                <motion.div
                  key="prescription-uploader"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`glass-panel p-6 sm:p-8 rounded-[2rem] transition-all duration-300 ${
                    isPrescriptionDragging ? "border-emerald-500 bg-emerald-50/[0.04] scale-[1.01]" : ""
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

                  {!prescriptionImage ? (
                    <div 
                      onClick={() => prescriptionFileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center border border-dashed border-slate-200 hover:border-emerald-350 rounded-[1.75rem] py-16 px-4 text-center bg-slate-50/20 hover:bg-emerald-50/[0.02] cursor-pointer transition group"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 text-emerald-600 shadow-sm group-hover:scale-110 transition duration-300">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-800 mb-1">
                        Select Prescription / Medical Report
                      </h4>
                      <p className="text-[10px] text-slate-400 mb-6 max-w-[200px] mx-auto leading-relaxed">
                        Drag and drop or click to upload printed or handwritten documents (PNG, JPG, WEBP)
                      </p>
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-full border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[9px] uppercase tracking-wider cursor-pointer shadow-sm active:scale-97 transition"
                      >
                        Choose File
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-[1.5rem] overflow-hidden bg-slate-50 border border-slate-100 aspect-square flex items-center justify-center shadow-inner group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prescriptionImage}
                        alt="Prescription preview"
                        className="w-full h-full object-contain p-2"
                      />

                      {/* Laser scanner element */}
                      {isPrescriptionScanning && <div className="scanner-laser" />}

                      {/* Veil overlay */}
                      {isPrescriptionScanning && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center">
                          <div className="relative w-11 h-11 flex items-center justify-center mb-3">
                            <div className="absolute inset-0 rounded-full border-3 border-emerald-500/20" />
                            <div className="absolute inset-0 rounded-full border-3 border-t-emerald-600 animate-spin" />
                          </div>
                          <p className="text-[10px] font-extrabold text-slate-800 animate-pulse tracking-wider uppercase">
                            Processing Document...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {prescriptionImage && !isPrescriptionScanning && (
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={startPrescriptionAnalysis}
                        className="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-sm cursor-pointer transition active:scale-97 flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" /> Analyze Document
                      </button>
                      <button
                        onClick={() => {
                          setPrescriptionImage(null);
                          setPrescriptionResult(null);
                          setPrescriptionError(null);
                          setPrescriptionRemindersCreated(false);
                          setCreatedRemindersInfo([]);
                        }}
                        className="px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                // MEDICINE UPLOADER
                <motion.div
                  key="medicine-uploader"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className={`glass-panel p-6 sm:p-8 rounded-[2rem] transition-all duration-300 ${
                    isMedicineDragging ? "border-emerald-500 bg-emerald-50/[0.04] scale-[1.01]" : ""
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

                  {!medicineImage ? (
                    <div 
                      onClick={() => medicineFileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center border border-dashed border-slate-200 hover:border-emerald-350 rounded-[1.75rem] py-16 px-4 text-center bg-slate-50/20 hover:bg-emerald-50/[0.02] cursor-pointer transition group"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 text-emerald-600 shadow-sm group-hover:scale-110 transition duration-300">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-800 mb-1">
                        Select Medicine Strip / Box
                      </h4>
                      <p className="text-[10px] text-slate-400 mb-6 max-w-[200px] mx-auto leading-relaxed">
                        Drag and drop or click to upload medicine box, strip, or labels (PNG, JPG, WEBP)
                      </p>
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-full border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[9px] uppercase tracking-wider cursor-pointer shadow-sm active:scale-97 transition"
                      >
                        Choose File
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-[1.5rem] overflow-hidden bg-slate-50 border border-slate-100 aspect-square flex items-center justify-center shadow-inner group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={medicineImage}
                        alt="Medicine preview"
                        className="w-full h-full object-contain p-2"
                      />

                      {/* Laser scanner element */}
                      {isMedicineScanning && <div className="scanner-laser" />}

                      {/* Veil overlay */}
                      {isMedicineScanning && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center">
                          <div className="relative w-11 h-11 flex items-center justify-center mb-3">
                            <div className="absolute inset-0 rounded-full border-3 border-emerald-500/20" />
                            <div className="absolute inset-0 rounded-full border-3 border-t-emerald-600 animate-spin" />
                          </div>
                          <p className="text-[10px] font-extrabold text-slate-800 animate-pulse tracking-wider uppercase">
                            Identifying Packaging...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {medicineImage && !isMedicineScanning && (
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={startMedicineAnalysis}
                        className="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-sm cursor-pointer transition active:scale-97 flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" /> Execute Scan
                      </button>
                      <button
                        onClick={() => {
                          setMedicineImage(null);
                          setMedicineResult(null);
                          setMedicineError(null);
                          setMedicineReminderCreated(false);
                          setCreatedMedicineReminderInfo("");
                        }}
                        className="px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RESULTS PANEL (RIGHT COLUMN) */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {/* STATE 1: Empty state / Awaiting Upload */}
              {activeTab === "prescription" && !prescriptionImage && !isPrescriptionScanning && !prescriptionResult && (
                <motion.div
                  key="presc-awaiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-panel p-12 sm:p-16 rounded-[2rem] text-center border-dashed border-slate-200 bg-slate-50/10"
                >
                  <div className="w-14 h-14 bg-emerald-550/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-150">
                    <FileText className="w-6 h-6 text-emerald-600 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1.5">
                    Awaiting Prescription Scan
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Upload a photograph of your prescription. The clinical card list, dosage times, and reminder generation dashboard will render here.
                  </p>
                </motion.div>
              )}

              {activeTab === "medicine" && !medicineImage && !isMedicineScanning && !medicineResult && (
                <motion.div
                  key="med-awaiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-panel p-12 sm:p-16 rounded-[2rem] text-center border-dashed border-slate-200 bg-slate-50/10"
                >
                  <div className="w-14 h-14 bg-emerald-550/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-150">
                    <Pill className="w-6 h-6 text-emerald-600 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1.5">
                    Awaiting Medicine Scan
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Upload a package image, strip, or box. The clinical summary, safety score, and smart reminder generator will appear in this workspace.
                  </p>
                </motion.div>
              )}

              {/* STATE 2: Processing state / Checklist */}
              {isPrescriptionScanning && (
                <motion.div
                  key="presc-scanning"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-panel p-6 sm:p-8 rounded-[2rem] flex flex-col justify-center min-h-[340px]"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <h3 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">
                          Clinical Prescription Audit
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full">
                        Step {prescriptionScanStep + 1} of {prescriptionScanSteps.length}
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-600"
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
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex items-center gap-3 text-xs transition-colors duration-200 ${
                              isDone ? "text-emerald-700 font-semibold" : isCurrent ? "text-slate-900 font-bold" : "text-slate-350"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] transition duration-200 ${
                              isDone ? "bg-emerald-50 border-emerald-200 text-emerald-600" : isCurrent ? "border-emerald-500 bg-white text-emerald-600 font-extrabold animate-pulse" : "border-slate-200 text-slate-300"
                            }`}>
                              {isDone ? "✓" : isCurrent ? "⚡" : idx + 1}
                            </div>
                            <span>{step}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {isMedicineScanning && (
                <motion.div
                  key="med-scanning"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-panel p-6 sm:p-8 rounded-[2rem] flex flex-col justify-center min-h-[340px]"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <h3 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">
                          Medicine Packaging Audit
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full">
                        Step {medicineScanStep + 1} of {medicineScanSteps.length}
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-600"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((medicineScanStep + 1) / medicineScanSteps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <div className="space-y-3">
                      {medicineScanSteps.map((step, idx) => {
                        const isDone = medicineScanStep > idx;
                        const isCurrent = medicineScanStep === idx;
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex items-center gap-3 text-xs transition-colors duration-200 ${
                              isDone ? "text-emerald-700 font-semibold" : isCurrent ? "text-slate-900 font-bold" : "text-slate-350"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] transition duration-200 ${
                              isDone ? "bg-emerald-50 border-emerald-200 text-emerald-600" : isCurrent ? "border-emerald-500 bg-white text-emerald-600 font-extrabold animate-pulse" : "border-slate-200 text-slate-300"
                            }`}>
                              {isDone ? "✓" : isCurrent ? "⚡" : idx + 1}
                            </div>
                            <span>{step}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STATE 3: Error banners */}
              {prescriptionError && (
                <motion.div
                  key="presc-error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5 bg-red-550/5 border border-red-200 text-red-800 rounded-2xl text-xs flex gap-3 shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 text-red-650 shrink-0" />
                  <div>
                    <h4 className="font-extrabold mb-1">Prescription Scan Error</h4>
                    <p>{prescriptionError}</p>
                  </div>
                </motion.div>
              )}

              {medicineError && (
                <motion.div
                  key="med-error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-5 bg-red-550/5 border border-red-200 text-red-800 rounded-2xl text-xs flex gap-3 shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 text-red-650 shrink-0" />
                  <div>
                    <h4 className="font-extrabold mb-1">Medicine Scan Error</h4>
                    <p>{medicineError}</p>
                  </div>
                </motion.div>
              )}

              {/* STATE 4: Prescription scan results dashboard */}
              {prescriptionResult && !isPrescriptionScanning && (
                <motion.div
                  key="presc-results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Summary Header Card */}
                  <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-emerald-500 shadow-sm relative overflow-hidden bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold tracking-widest text-emerald-650 uppercase block">
                          Document Assessment
                        </span>
                        <h2 className="text-lg font-black text-slate-900 leading-tight">
                          Prescription Intelligence Summary
                        </h2>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          {prescriptionResult.summary}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    </div>

                    {prescriptionResult.disclaimer && (
                      <p className="mt-4 text-[9px] text-slate-400 pl-3 border-l border-slate-200">
                        {prescriptionResult.disclaimer}
                      </p>
                    )}
                  </div>

                  {/* Confidence Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel p-4.5 rounded-2xl flex items-center justify-between bg-white shadow-sm">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          OCR Confidence
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {prescriptionResult.confidenceScore}% Certainty
                        </span>
                      </div>
                      <div className="w-8 h-8 relative flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="16" cy="16" r="12" className="stroke-slate-100" strokeWidth="2.5" fill="transparent" />
                          <circle cx="16" cy="16" r="12" className="stroke-emerald-500" strokeWidth="2.5" fill="transparent" strokeDasharray="75.39" strokeDashoffset={75.39 - (prescriptionResult.confidenceScore / 100) * 75.39} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-[8px] font-extrabold text-slate-800">{prescriptionResult.confidenceScore}%</span>
                      </div>
                    </div>

                    <div className="glass-panel p-4.5 rounded-2xl flex items-center justify-between bg-white shadow-sm">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          AI Review State
                        </span>
                        <span className="text-sm font-extrabold text-emerald-600 flex items-center gap-1">
                          Scan Verified
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-black">
                        ✓
                      </div>
                    </div>
                  </div>

                  {/* REMINDER CREATOR CARD */}
                  <div className="glass-panel p-6 rounded-[2rem] bg-emerald-50/10 border border-emerald-100/50 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          Reminder Engine Auto-Sync
                        </h3>
                        <p className="text-[10px] text-slate-500 max-w-sm">
                          Automatically configure medicine alerts in your dashboard routines timeline based on OCR frequencies.
                        </p>
                      </div>

                      <button
                        onClick={generatePrescriptionReminders}
                        disabled={prescriptionRemindersCreated || isCreatingPrescriptionReminders}
                        className={`px-5 py-3 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm transition active:scale-97 cursor-pointer shrink-0 ${
                          prescriptionRemindersCreated
                            ? "bg-emerald-50 border border-emerald-100 text-emerald-700 cursor-default"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {isCreatingPrescriptionReminders ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-white animate-ping" /> Scheduling...
                          </span>
                        ) : prescriptionRemindersCreated ? (
                          "Reminders Created ✓"
                        ) : (
                          "Create Reminders Automatically"
                        )}
                      </button>
                    </div>

                    {prescriptionRemindersCreated && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t border-emerald-100/30 space-y-1.5"
                      >
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-650 shrink-0" />
                          Reminders synced to overview calendar successfully:
                        </div>
                        <ul className="text-[10px] text-slate-500 pl-5 list-disc space-y-0.5 font-medium">
                          {createdRemindersInfo.map((info, i) => (
                            <li key={i}>{info}</li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>

                  {/* Medicines Card List */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Extracted Medications
                    </h3>

                    {prescriptionResult.medicines.map((med, idx) => {
                      const isNameIdentified = med.medicineName !== "Medicine name could not be confidently identified.";
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`glass-panel p-5 rounded-2xl bg-white border shadow-sm relative overflow-hidden group transition ${
                            isNameIdentified 
                              ? "border-slate-100 hover:border-emerald-150" 
                              : "border-red-200 bg-red-50/[0.01] hover:border-red-350"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-3 w-full">
                              {/* Medicine Name and Dosage */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isNameIdentified ? "bg-emerald-500" : "bg-red-500"}`} />
                                  <h4 className={`text-sm font-extrabold leading-none transition ${
                                    isNameIdentified 
                                      ? "text-slate-900 group-hover:text-emerald-700" 
                                      : "text-red-650"
                                  }`}>
                                    {med.medicineName}
                                  </h4>
                                </div>
                                {isNameIdentified && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-150 text-[9px] font-extrabold text-slate-650">
                                    {med.dosage}
                                  </span>
                                )}
                              </div>

                              {/* Generic Name Display */}
                              <div className="text-[10px] sm:text-xs">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                  Generic Name
                                </span>
                                <span className={`font-bold ${isNameIdentified ? "text-slate-805" : "text-slate-400"}`}>
                                  {med.genericName}
                                </span>
                              </div>

                              {/* Info grid */}
                              {isNameIdentified && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                  {/* Left parameters */}
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                                        Intake Frequency
                                      </span>
                                      <span className="text-slate-700 font-semibold flex items-center gap-1.5 mt-0.5">
                                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                        {med.frequency}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                                        Primary Purpose
                                      </span>
                                      <span className="text-slate-650 block mt-0.5 leading-normal">
                                        {med.purpose}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right parameters */}
                                  <div className="p-3 bg-amber-50/[0.04] border border-amber-100/30 rounded-xl">
                                    <span className="text-[8px] font-extrabold text-amber-700 flex items-center gap-1 uppercase tracking-wider">
                                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                                      Safety Precautions
                                    </span>
                                    <p className="text-[10px] text-slate-600 mt-1 leading-normal">
                                      {med.precautions}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Disclaimer banner */}
                  <div className="p-4.5 bg-emerald-50/15 border border-emerald-100/50 rounded-2xl text-[10px] sm:text-xs leading-relaxed text-emerald-950 flex gap-2.5">
                    <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>AI Safe Check:</strong> Assessments serve strictly as informative digests. Always cross-reference with physical packets and primary clinical instructions before ingestion.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STATE 5: Medicine packaging scan results dashboard */}
              {medicineResult && !isMedicineScanning && (
                <motion.div
                  key="med-results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Identified Header Card */}
                  {medicineResult.medicineName === "Medicine name could not be confidently identified." ? (
                    // WARNING NAME CARD
                    <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-red-500 bg-red-50/[0.01] shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[8px] font-extrabold tracking-widest text-red-650 uppercase block">
                            Document Assessment
                          </span>
                          <h2 className="text-lg font-black text-red-800 mt-1.5 leading-tight">
                            Medicine name could not be confidently identified.
                          </h2>
                          <p className="text-xs text-slate-500 mt-2">
                            Please ensure your photo has good lighting, contains no glares, and clearly shows the brand name of the packaging label.
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // SUCCESS NAME CARD
                    <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-emerald-500 shadow-sm relative overflow-hidden bg-white">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[8px] font-extrabold tracking-widest text-emerald-600 uppercase block">
                            Audited Compound Identity
                          </span>
                          <h2 className="text-xl font-black text-slate-900 mt-1">
                            {medicineResult.medicineName}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700">
                              <Activity className="w-3 h-3" /> {medicineResult.purpose}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600">
                              Generic: {medicineResult.genericName}
                            </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650 shrink-0">
                          <Pill className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>

                      {medicineResult.disclaimer && (
                        <p className="mt-4 text-[9px] text-slate-400 pl-3 border-l border-slate-200">
                          {medicineResult.disclaimer}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Metrics gauge row */}
                  {medicineResult.medicineName !== "Medicine name could not be confidently identified." && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Confidence gauge circle */}
                      <div className="glass-panel p-5 rounded-2xl flex items-center justify-between bg-white shadow-sm">
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            Clarity Confidence
                          </span>
                          <span className="text-base font-black text-slate-900 block">
                            {medicineResult.confidenceScore}% Certainty
                          </span>
                          <span className="text-[9px] text-emerald-600 font-bold block">
                            Clinical Match Confirmed
                          </span>
                        </div>
                        
                        <div className="w-12 h-12 relative flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="18" className="stroke-slate-100" strokeWidth="3" fill="transparent" />
                            <circle cx="24" cy="24" r="18" className="stroke-emerald-500" strokeWidth="3" fill="transparent" strokeDasharray="113.1" strokeDashoffset={113.1 - (medicineResult.confidenceScore / 100) * 113.1} strokeLinecap="round" />
                          </svg>
                          <span className="absolute text-[9px] font-black text-slate-800">{medicineResult.confidenceScore}%</span>
                        </div>
                      </div>

                      {/* AI Review Status Badge */}
                      <div className="glass-panel p-5 rounded-2xl flex items-center justify-between bg-white shadow-sm">
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            AI Audit Level
                          </span>
                          <span className="text-base font-black text-emerald-600 block">
                            Scan Complete
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold block">
                            Structured data logged
                          </span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-black shadow-sm shrink-0">
                          ✓
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REMINDER CREATOR CARD */}
                  {medicineResult.medicineName !== "Medicine name could not be confidently identified." && (
                    <div className="glass-panel p-6 rounded-[2rem] bg-emerald-50/10 border border-emerald-100/50 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            Configure Smart Alert
                          </h3>
                          <p className="text-[10px] text-slate-500 max-w-sm">
                            Instantly set up a daily calendar reminder based on packaging dosage instructions.
                          </p>
                        </div>

                        <button
                          onClick={generateMedicineReminder}
                          disabled={medicineReminderCreated || isCreatingMedicineReminder}
                          className={`px-5 py-3 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm transition active:scale-97 cursor-pointer shrink-0 ${
                            medicineReminderCreated
                              ? "bg-emerald-50 border border-emerald-100 text-emerald-700 cursor-default"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {isCreatingMedicineReminder ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-white animate-ping" /> Scheduling...
                            </span>
                          ) : medicineReminderCreated ? (
                            "Reminder Scheduled ✓"
                          ) : (
                            "Generate Smart Reminder"
                          )}
                        </button>
                      </div>

                      {medicineReminderCreated && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 pt-4 border-t border-emerald-100/30 flex items-center gap-1.5 text-xs text-emerald-800 font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-650 shrink-0" />
                          <span>Created alert: <strong>{createdMedicineReminderInfo}</strong></span>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Scorecard grids */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Generic Name Display */}
                    <div className="glass-panel p-5 rounded-2xl bg-white border border-slate-100 shadow-sm col-span-1 sm:col-span-2">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-slate-400" /> Generic / Chemical Name
                      </h4>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-normal">
                        {medicineResult.genericName}
                      </p>
                    </div>

                    {/* Purpose */}
                    <div className="glass-panel p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" /> Clinical Purpose
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-650">
                        {medicineResult.purpose}
                      </p>
                    </div>

                    {/* Dosage Guidance */}
                    <div className="glass-panel p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-slate-400" /> Dosage Guidance
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-650">
                        {medicineResult.dosageGuidance}
                      </p>
                    </div>

                    {/* Precautions */}
                    <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-amber-500 bg-amber-50/[0.02] shadow-sm">
                      <h4 className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Safety Warnings
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-650">
                        {medicineResult.precautions}
                      </p>
                    </div>

                    {/* Side Effects */}
                    <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-red-500 bg-red-50/[0.02] shadow-sm">
                      <h4 className="text-[9px] font-black text-red-650 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Side Effects Warnings
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-650">
                        {medicineResult.sideEffects}
                      </p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {medicineResult.medicineName !== "Medicine name could not be confidently identified." && (
                    <div className="glass-panel p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Usage Recommendations
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-650">
                        {medicineResult.usageRecommendations}
                      </p>
                    </div>
                  )}

                  {/* Warning advice */}
                  <div className="p-4.5 bg-emerald-50/15 border border-emerald-100/50 rounded-2xl text-[10px] sm:text-xs leading-relaxed text-emerald-950 flex gap-2.5">
                    <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Pharmacist Guidance:</strong> AI assessments serve strictly as supportive logs. Verify primary details against physical boxes. Consult a certified practitioner prior to treatment updates.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
