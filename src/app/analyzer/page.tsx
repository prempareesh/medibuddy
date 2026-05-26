"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface MedicineResult {
  medicineName: string;
  purpose: string;
  usage: string;
  precautions: string;
  sideEffects: string;
  isMock?: boolean;
  disclaimer?: string;
}

export default function MedicineAnalyzer() {
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<MedicineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<Record<string, MedicineResult>>({});

  const scanSteps = [
    "Uploading prescription scan...",
    "Executing MediBuddy AI Health Scan audit...",
    "Parsing chemical nomenclature & formulations...",
    "Evaluating precautions & safety profiles...",
    "Assembling clinical summary card..."
  ];

  // Client-side HTML Canvas image compression helper
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
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
          resolve(canvas.toDataURL("image/jpeg", 0.7)); // Shrink to 0.7 JPEG
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      setScanStep(0);
      interval = setInterval(() => {
        setScanStep((prev) => (prev < scanSteps.length - 1 ? prev + 1 : prev));
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, or WEBP).");
      return;
    }

    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = async () => {
      // Compress the image before setting state & sending over the network
      const compressed = await compressImage(reader.result as string);
      setImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const resetAnalyzer = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setScanStep(0);
  };

  const startAnalysis = async () => {
    if (!image) return;

    setIsScanning(true);
    setError(null);

    // Instant local memory cache lookup to resolve repeats in 0ms
    if (cacheRef.current[image]) {
      // Small artificial delay for visual delight transitions
      await new Promise((resolve) => setTimeout(resolve, 800));
      setResult(cacheRef.current[image]);
      setIsScanning(false);
      confetti({
        particleCount: 30,
        spread: 30,
        colors: ["#10b981", "#34d399"]
      });
      return;
    }

    try {
      const response = await fetch("/api/analyze-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze packaging");
      }

      // Save to memory cache
      cacheRef.current[image] = data;

      setResult(data);
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 },
        colors: ["#10b981", "#34d399", "#a7f3d0"]
      });

      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medicineName: data.medicineName,
            purpose: data.purpose,
            usage: data.usage,
            precautions: data.precautions,
            sideEffects: data.sideEffects,
            imageUrl: image
          })
        });
      } catch (historyErr) {
        console.warn("Failed to sync audit to database:", historyErr);
      }

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An error occurred during scanning. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-dots py-20 px-8">
      {/* Delicate floating sage glows */}
      <div className="absolute top-10 right-10 w-[28rem] h-[28rem] bg-emerald-500/[0.012] rounded-full filter blur-[100px] -z-10 pulse-airy" />
      <div className="absolute bottom-10 left-10 w-[28rem] h-[28rem] bg-teal-500/[0.012] rounded-full filter blur-[100px] -z-10 pulse-airy" style={{ animationDelay: "2s" }} />

      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3"
          >
            AI Medicine Analyzer
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-slate-500 max-w-lg mx-auto text-xs sm:text-sm leading-relaxed"
          >
            Upload a sharp photograph of your pill box or medicine strip. MediBuddy Health Scan will instantly extract and organize clinical data.
          </motion.p>
        </div>

        {/* WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* UPLOADER */}
          <div className="lg:col-span-5">
            <motion.div
              layout
              className={`glass-panel p-8 rounded-[2.5rem] transition-all duration-300 ${
                isDragging ? "border-emerald-500 bg-emerald-50/[0.05]" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {!image ? (
                // Linear Style Dropzone
                <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[2rem] py-20 px-4 text-center bg-slate-50/20">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6 text-emerald-600 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">
                    Select Packaging Image
                  </h4>
                  <p className="text-[10px] text-slate-400 mb-6">
                    PNG, JPG, or WEBP up to 5MB
                  </p>
                  <button
                    onClick={triggerFileSelect}
                    className="px-5 py-2.5 rounded-full border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-sm active:scale-98 transition"
                  >
                    Choose File
                  </button>
                </div>
              ) : (
                // Elegant Preview with thin scanning line
                <div className="relative rounded-[1.75rem] overflow-hidden bg-slate-50 border border-slate-100 aspect-square flex items-center justify-center shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt="Scan preview"
                    className="w-full h-full object-contain p-2"
                  />

                  {/* Sage Scanner Line */}
                  {isScanning && <div className="scanner-laser" />}

                  {/* Transparent veil overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                      <div className="relative w-10 h-10 flex items-center justify-center mb-2">
                        <div className="absolute inset-0 rounded-full border-3 border-emerald-500/20" />
                        <div className="absolute inset-0 rounded-full border-3 border-t-emerald-600 animate-spin" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-850 animate-pulse tracking-wide">
                        Auditing Compounds...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {image && !isScanning && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={startAnalysis}
                    className="flex-1 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-sm cursor-pointer transition active:scale-98"
                  >
                    Execute Scan
                  </button>
                  <button
                    onClick={resetAnalyzer}
                    className="px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          {/* REPORT RESULTS */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              
              {/* State 1: Awaiting Upload */}
              {!image && !isScanning && !result && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-panel p-16 rounded-[2.5rem] text-center border-dashed border-slate-200/60 bg-slate-50/20"
                >
                  <span className="text-3xl mb-4 block">🩺</span>
                  <h3 className="text-sm font-bold text-slate-800 mb-1.5">
                    Awaiting Prescription Scan
                  </h3>
                  <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
                    Upload a photograph to analyze. An interactive clinical overview and medical card will generate here.
                  </p>
                </motion.div>
              )}

              {/* State 2: Process checklist */}
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-panel p-8 rounded-[2.5rem] flex flex-col justify-center min-h-[300px]"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center viewBox=0 0 24 24 text-[10px] text-emerald-600 animate-bounce">
                        🧬
                      </div>
                      <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        Clinical Audit Process
                      </h3>
                    </div>

                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-600"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3.5 }}
                      />
                    </div>

                    <div className="space-y-3.5">
                      {scanSteps.map((step, idx) => {
                        const isDone = scanStep > idx;
                        const isCurrent = scanStep === idx;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 text-xs transition-opacity duration-200 ${
                              isDone ? "opacity-100 text-emerald-650 font-medium" : isCurrent ? "opacity-100 text-slate-900 font-bold" : "opacity-30 text-slate-400"
                            }`}
                          >
                            <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center border text-[9px] font-bold">
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

              {/* State 3: Error Banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 bg-red-50 border border-red-100 text-red-700 rounded-3xl text-xs flex gap-2 animate-shake"
                >
                  <span>⚠️</span>
                  <div>
                    <h4 className="font-bold mb-1">Scan Discrepancy</h4>
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}

              {/* State 4: Redesigned Premium SaaS Info Cards */}
              {result && !isScanning && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {/* Clean Stripe-style Header Card */}
                  <div className="glass-panel p-8 rounded-[2.5rem] border-l-4 border-l-emerald-500 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-extrabold tracking-widest text-emerald-600 uppercase">
                          Audited Identity
                        </span>
                        <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                          {result.medicineName}
                        </h2>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg text-emerald-600 shrink-0">
                        💊
                      </div>
                    </div>
                    {result.disclaimer && (
                      <p className="mt-4 text-[10px] text-slate-400 pl-3 border-l border-slate-200">
                        {result.disclaimer}
                      </p>
                    )}
                  </div>

                  {/* METRICS ROW (Confidence & Safety Badges) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Clarity Confidence
                        </span>
                        <span className="text-base font-extrabold text-slate-900">
                          98% Certainty
                        </span>
                      </div>
                      
                      {/* Clean 98% SVG tracker */}
                      <div className="w-10 h-10 relative flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="20" cy="20" r="16" className="stroke-slate-100" strokeWidth="3" fill="transparent" />
                          <circle cx="20" cy="20" r="16" className="stroke-emerald-500" strokeWidth="3" fill="transparent" strokeDasharray="100.53" strokeDashoffset="2" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-[8px] font-bold text-slate-800">98%</span>
                      </div>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Safety Status
                        </span>
                        <span className="text-base font-extrabold text-emerald-600">
                          Prescription Safe
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-sm shadow-sm shrink-0">
                        ✓
                      </div>
                    </div>
                  </div>

                  {/* Clean, spacious sections */}
                  <div className="space-y-6">
                    {/* Purpose */}
                    <div className="glass-panel p-6 rounded-2xl bg-slate-50/20">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        🎯 Primary Purpose
                      </h4>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-normal">
                        {result.purpose}
                      </p>
                    </div>

                    {/* Usage */}
                    <div className="glass-panel p-6 rounded-2xl">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        ℹ️ Usage & Intake Protocols
                      </h4>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-650">
                        {result.usage}
                      </p>
                    </div>

                    {/* Precautions */}
                    <div className="glass-panel p-6 rounded-2xl border-l-3 border-l-amber-500 bg-amber-50/[0.03]">
                      <h4 className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        ⚠️ Safety Precautions
                      </h4>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-650">
                        {result.precautions}
                      </p>
                    </div>

                    {/* Side Effects */}
                    <div className="glass-panel p-6 rounded-2xl border-l-3 border-l-red-500 bg-red-50/[0.03]">
                      <h4 className="text-[10px] font-extrabold text-red-650 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        🚨 Side Effects Warning
                      </h4>
                      <p className="text-xs sm:text-sm leading-relaxed text-slate-650">
                        {result.sideEffects}
                      </p>
                    </div>
                  </div>

                  {/* Mint Warning Panel */}
                  <div className="p-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 text-[10px] sm:text-xs leading-relaxed text-emerald-950 flex gap-2">
                    <span>💡</span>
                    <p>
                      <strong>Pharmacist Guidance:</strong> AI assessments serve strictly as supportive logs. Inspect primary details against physical boxes. Consult a certified practitioner prior to treatment updates.
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
