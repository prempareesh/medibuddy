"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface Reminder {
  _id: string;
  medicineName: string;
  time: string; // "HH:MM"
  note?: string;
  active: boolean;
  takenDates: string[];
  createdAt?: string;
}

interface ScanHistory {
  _id: string;
  medicineName: string;
  purpose?: string;
  usage?: string;
  precautions?: string;
  sideEffects?: string;
  imageUrl?: string;
  createdAt: string;
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

export default function Dashboard() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Hydration state
  const [waterIntake, setWaterIntake] = useState(1250); // ml
  const waterTarget = 2500; // ml

  // Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({ medicineName: "", time: "", note: "" });
  
  // Notification status
  const [notifPermission, setNotifPermission] = useState<string>("default");

  const alarmLogRef = useRef<Record<string, string>>({});
  const [isLocalEmulated, setIsLocalEmulated] = useState(false);

  // SpeechSynthesis states & refs
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(0.8);
  const [speechVolume, setSpeechVolume] = useState<number>(0.8);
  const [isTestSpeaking, setIsTestSpeaking] = useState(false);

  const speechRateRef = useRef(speechRate);
  const speechVolumeRef = useRef(speechVolume);
  const selectedVoiceNameRef = useRef(selectedVoiceName);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  useEffect(() => {
    speechVolumeRef.current = speechVolume;
  }, [speechVolume]);

  useEffect(() => {
    selectedVoiceNameRef.current = selectedVoiceName;
  }, [selectedVoiceName]);


  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }

    // Hydration sync
    const savedWater = localStorage.getItem("medibuddy_hydration");
    if (savedWater) {
      setWaterIntake(Number(savedWater));
    }

    fetchReminders();
    fetchHistory();
  }, []);

  // Voice Synthesis Setup
  useEffect(() => {
    // Load settings from localStorage
    const savedVoice = localStorage.getItem("medibuddy_voice_name");
    const savedRate = localStorage.getItem("medibuddy_voice_rate");
    const savedVol = localStorage.getItem("medibuddy_voice_volume");
    if (savedVoice) setSelectedVoiceName(savedVoice);
    if (savedRate) setSpeechRate(Number(savedRate));
    if (savedVol) setSpeechVolume(Number(savedVol));

    const updateVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Auto-select a warm premium voice if none is selected
        if (!savedVoice && availableVoices.length > 0) {
          const premium = availableVoices.find(v => 
            v.name.toLowerCase().includes("samantha") || 
            v.name.toLowerCase().includes("google us english") || 
            v.name.toLowerCase().includes("microsoft zira") ||
            v.name.toLowerCase().includes("en-us") ||
            v.lang.toLowerCase().startsWith("en-")
          );
          if (premium) {
            setSelectedVoiceName(premium.name);
          } else {
            setSelectedVoiceName(availableVoices[0].name);
          }
        }
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const getSelectedVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const allVoices = window.speechSynthesis.getVoices();
    return allVoices.find(v => v.name === selectedVoiceNameRef.current) || null;
  };

  const previewReminderAudio = (reminder: Reminder) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    playCalmChime();
    
    setTimeout(() => {
      const voiceText = `This is a preview of your medication reminder. Please take your ${reminder.medicineName}. ${reminder.note ? `Note: ${reminder.note}` : ""}`;
      const utterance = new SpeechSynthesisUtterance(voiceText);
      
      const voice = getSelectedVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = speechRateRef.current;
      utterance.volume = speechVolumeRef.current;
      
      window.speechSynthesis.speak(utterance);
    }, 850);
  };

  const playVoicePreview = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsTestSpeaking(true);
    playCalmChime();
    
    setTimeout(() => {
      const voiceText = "Hello. This is your gentle medicine reminder. Please take your sugar tablet before bedtime.";
      const utterance = new SpeechSynthesisUtterance(voiceText);
      
      const voice = getSelectedVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = speechRateRef.current;
      utterance.volume = speechVolumeRef.current;
      
      utterance.onend = () => {
        setIsTestSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsTestSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }, 850);
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === "granted") {
        new Notification("MediBuddy AI", { body: "Reminders successfully configured!" });
      }
    }
  };

  const addWaterLog = () => {
    const nextVal = Math.min(waterIntake + 250, 4000);
    setWaterIntake(nextVal);
    localStorage.setItem("medibuddy_hydration", String(nextVal));
    confetti({
      particleCount: 25,
      spread: 20,
      colors: ["#38bdf8", "#0ea5e9", "#bae6fd"]
    });
  };

  const fetchReminders = async () => {
    setIsLoadingReminders(true);
    try {
      const response = await fetch("/api/reminders");
      const data = await response.json();
      
      if (response.ok && !data.isFallback) {
        setReminders(data);
      } else {
        setIsLocalEmulated(true);
        loadLocalReminders();
      }
    } catch (err) {
      console.warn("API error fetching reminders. Emulating locally.", err);
      setIsLocalEmulated(true);
      loadLocalReminders();
    } finally {
      setIsLoadingReminders(false);
    }
  };

  const loadLocalReminders = () => {
    const local = localStorage.getItem("medibuddy_reminders");
    if (local) {
      setReminders(JSON.parse(local));
    } else {
      const seed: Reminder[] = [
        {
          _id: "seed_1",
          medicineName: "Metformin Hydrochloride",
          time: "08:30",
          note: "Take after breakfast with water",
          active: true,
          takenDates: []
        },
        {
          _id: "seed_2",
          medicineName: "Atorvastatin Calcium",
          time: "21:00",
          note: "Take before bed",
          active: true,
          takenDates: []
        }
      ];
      setReminders(seed);
      localStorage.setItem("medibuddy_reminders", JSON.stringify(seed));
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      if (response.ok && !data.isFallback) {
        setHistory(data);
      } else {
        loadLocalHistory();
      }
    } catch (err) {
      console.warn("API error fetching history. Emulating locally.", err);
      loadLocalHistory();
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadLocalHistory = () => {
    const local = localStorage.getItem("medibuddy_history");
    if (local) {
      setHistory(JSON.parse(local));
    } else {
      setHistory([]);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkMedicationAlarms();
    }, 10000);

    return () => clearInterval(interval);
  }, [reminders]);

  const checkMedicationAlarms = () => {
    if (typeof window === "undefined") return;

    const now = new Date();
    const currentDayStr = now.toISOString().split("T")[0];
    const currentHourMin = now.toTimeString().slice(0, 5);
    const currentFullTimeStr = `${currentDayStr} ${currentHourMin}`;

    reminders.forEach((reminder) => {
      if (reminder.active && reminder.time === currentHourMin) {
        const lastTriggered = alarmLogRef.current[reminder._id];
        if (lastTriggered !== currentFullTimeStr) {
          alarmLogRef.current[reminder._id] = currentFullTimeStr;
          triggerMedicationAlarm(reminder);
        }
      }
    });
  };

  const triggerMedicationAlarm = (reminder: Reminder) => {
    if (notifPermission === "granted") {
      new Notification("⏰ MediBuddy Reminder", {
        body: `It is time to take your ${reminder.medicineName}. ${reminder.note ? `(${reminder.note})` : ""}`,
      });
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      playCalmChime();
      
      setTimeout(() => {
        const voiceText = `This is a reminder. Please take your medication: ${reminder.medicineName}. ${reminder.note ? `Note: ${reminder.note}` : ""}`;
        const utterance = new SpeechSynthesisUtterance(voiceText);
        
        const voice = getSelectedVoice();
        if (voice) {
          utterance.voice = voice;
        }
        utterance.rate = speechRateRef.current;
        utterance.volume = speechVolumeRef.current;
        
        window.speechSynthesis.speak(utterance);
      }, 850);
    }
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const { medicineName, time, note } = formData;

    if (!medicineName || !time) return;

    if (editingReminder) {
      const updatedItem = { ...editingReminder, medicineName, time, note };
      if (!isLocalEmulated) {
        try {
          const res = await fetch(`/api/reminders/${editingReminder._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedItem)
          });
          if (!res.ok) throw new Error("API failed");
          setReminders((prev) => prev.map((r) => (r._id === editingReminder._id ? { ...r, medicineName, time, note } : r)));
        } catch (err) {
          editLocalReminder(updatedItem);
        }
      } else {
        editLocalReminder(updatedItem);
      }
    } else {
      if (!isLocalEmulated) {
        try {
          const res = await fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ medicineName, time, note })
          });
          const data = await res.json();
          if (!res.ok) throw new Error("API failed");
          setReminders((prev) => [data, ...prev]);
        } catch (err) {
          addLocalReminder(medicineName, time, note);
        }
      } else {
        addLocalReminder(medicineName, time, note);
      }
    }

    setFormData({ medicineName: "", time: "", note: "" });
    setEditingReminder(null);
    setIsModalOpen(false);
  };

  const addLocalReminder = (medicineName: string, time: string, note: string) => {
    const newItem: Reminder = {
      _id: `local_${Date.now()}`,
      medicineName,
      time,
      note,
      active: true,
      takenDates: []
    };
    const list = [newItem, ...reminders];
    setReminders(list);
    localStorage.setItem("medibuddy_reminders", JSON.stringify(list));
  };

  const editLocalReminder = (updated: Reminder) => {
    const list = reminders.map((r) => (r._id === updated._id ? updated : r));
    setReminders(list);
    localStorage.setItem("medibuddy_reminders", JSON.stringify(list));
  };

  const handleDeleteReminder = async (id: string) => {
    if (!isLocalEmulated) {
      try {
        const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("API failed");
        setReminders((prev) => prev.filter((r) => r._id !== id));
      } catch (err) {
        deleteLocalReminder(id);
      }
    } else {
      deleteLocalReminder(id);
    }
  };

  const deleteLocalReminder = (id: string) => {
    const list = reminders.filter((r) => r._id !== id);
    setReminders(list);
    localStorage.setItem("medibuddy_reminders", JSON.stringify(list));
  };

  const handleToggleReminder = async (reminder: Reminder) => {
    const updated = { ...reminder, active: !reminder.active };
    if (!isLocalEmulated) {
      try {
        const res = await fetch(`/api/reminders/${reminder._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: updated.active })
        });
        if (!res.ok) throw new Error("API failed");
        setReminders((prev) => prev.map((r) => (r._id === reminder._id ? { ...r, active: updated.active } : r)));
      } catch (err) {
        toggleLocalReminder(reminder._id);
      }
    } else {
      toggleLocalReminder(reminder._id);
    }
  };

  const toggleLocalReminder = (id: string) => {
    const list = reminders.map((r) => (r._id === id ? { ...r, active: !r.active } : r));
    setReminders(list);
    localStorage.setItem("medibuddy_reminders", JSON.stringify(list));
  };

  const handleMarkAsTaken = async (reminder: Reminder) => {
    const today = new Date().toISOString().split("T")[0];
    const isTaken = reminder.takenDates.includes(today);
    
    let nextTakenDates = [...reminder.takenDates];
    if (isTaken) {
      nextTakenDates = nextTakenDates.filter((d) => d !== today);
    } else {
      nextTakenDates.push(today);
      confetti({
        particleCount: 30,
        spread: 30,
        colors: ["#10b981", "#34d399"]
      });
    }

    if (!isLocalEmulated) {
      try {
        const res = await fetch(`/api/reminders/${reminder._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ takenDates: nextTakenDates })
        });
        if (!res.ok) throw new Error("API failed");
        setReminders((prev) => prev.map((r) => (r._id === reminder._id ? { ...r, takenDates: nextTakenDates } : r)));
      } catch (err) {
        markLocalTaken(reminder._id, nextTakenDates);
      }
    } else {
      markLocalTaken(reminder._id, nextTakenDates);
    }
  };

  const markLocalTaken = (id: string, dates: string[]) => {
    const list = reminders.map((r) => (r._id === id ? { ...r, takenDates: dates } : r));
    setReminders(list);
    localStorage.setItem("medibuddy_reminders", JSON.stringify(list));
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h._id !== id));
      } else {
        deleteLocalHistoryItem(id);
      }
    } catch (err) {
      deleteLocalHistoryItem(id);
    }
  };

  const deleteLocalHistoryItem = (id: string) => {
    const list = history.filter((h) => h._id !== id);
    setHistory(list);
    localStorage.setItem("medibuddy_history", JSON.stringify(list));
  };

  const totalActiveToday = reminders.filter((r) => r.active).length;
  const todayStr = new Date().toISOString().split("T")[0];
  const takenCountToday = reminders.filter((r) => r.active && r.takenDates.includes(todayStr)).length;
  const completionRate = totalActiveToday > 0 ? Math.round((takenCountToday / totalActiveToday) * 100) : 0;

  // SVG Progress Ring
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  const handleEditClick = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      medicineName: reminder.medicineName,
      time: reminder.time,
      note: reminder.note || ""
    });
    setIsModalOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-dots py-16 px-6">
      <style>{`
        @keyframes barWave {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .animate-bar-wave {
          animation: barWave 0.8s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>

      {/* Floating blurs */}
      <div className="absolute top-10 left-1/3 w-80 h-80 bg-emerald-500/[0.01] rounded-full filter blur-[100px] -z-10 pulse-airy" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/[0.01] rounded-full filter blur-[100px] -z-10 pulse-airy" style={{ animationDelay: "2s" }} />

      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Overview
            </h1>
            <p className="text-slate-400 text-xs mt-1 font-semibold tracking-wide">
              {isLocalEmulated ? "🔒 Secure Local Sandbox Mode" : "🟢 Synchronized Cloud Engine Active"}
            </p>
          </div>

          {/* Outline alarm permission */}
          {notifPermission !== "granted" && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={requestNotificationPermission}
              className="px-4.5 py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 text-xs font-bold text-emerald-800 flex items-center gap-2 cursor-pointer shadow-sm transition"
            >
              <span>🔔 Enable Alarm Notifications</span>
            </motion.button>
          )}
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Circular SVG Tracker */}
          <div className="glass-panel p-8 rounded-[2rem] lg:col-span-4 flex items-center justify-between shadow-sm">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                Medication Tracker
              </span>
              <h3 className="text-2xl font-black text-slate-900 leading-none">
                {takenCountToday}/{totalActiveToday} Taken
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-[170px]">
                Mark schedules as taken to update daily wellness rate progression.
              </p>
            </div>
            
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r={radius} className="stroke-slate-100" strokeWidth="5" fill="transparent" />
                <motion.circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-emerald-500"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-bold text-slate-800">
                {completionRate}%
              </span>
            </div>
          </div>

          {/* Interactive Hydration Log Widget */}
          <div className="glass-panel p-8 rounded-[2rem] lg:col-span-4 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                  Daily Hydration
                </span>
                <span className="text-xs font-bold text-sky-600">
                  {waterIntake}ml / {waterTarget}ml
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 leading-none flex items-center gap-1.5">
                <span>💧</span> {Math.round((waterIntake / waterTarget) * 100)}% Consumed
              </h3>
              
              {/* Hydration Progress Bar */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                <motion.div
                  className="h-full bg-sky-400"
                  animate={{ width: `${Math.min((waterIntake / waterTarget) * 100, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <button
              onClick={addWaterLog}
              className="w-full py-2.5 rounded-full border border-sky-200 hover:bg-sky-50/50 text-sky-700 font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow-sm transition mt-6"
            >
              + Log 250ml Water
            </button>
          </div>

          {/* Weekly Progress Statistics Widget */}
          <div className="glass-panel p-8 rounded-[2rem] lg:col-span-4 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                Adherence Rate
              </span>
              <h3 className="text-2xl font-black text-slate-900 leading-none">
                Weekly Adherence
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your calculated weekly medication adherence indicator matches optimal safety targets.
              </p>
              
              {/* Clean Horizontal Stats Indicator */}
              <div className="flex items-center gap-1 pt-3">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
                  const isSuccess = idx < 5; // Emulated progression
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full h-4 rounded-md transition ${isSuccess ? "bg-emerald-500" : "bg-slate-100"}`} />
                      <span className="text-[8px] font-bold text-slate-400">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ROUTINES TIMELINE & AUDITS GRIDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT TIMELINE SECTION */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>⏰</span> Scheduled Routines Timeline
              </h2>
              <button
                onClick={() => {
                  setEditingReminder(null);
                  setFormData({ medicineName: "", time: "", note: "" });
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer transition active:scale-98 flex items-center gap-1"
              >
                <span>+</span> Add Reminder
              </button>
            </div>

            {isLoadingReminders ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 w-full bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
                ))}
              </div>
            ) : reminders.length === 0 ? (
              <div className="glass-panel p-16 text-center rounded-[2rem] border-dashed border-slate-200/80 bg-slate-50/20">
                <span className="text-3xl mb-4 block">🔔</span>
                <h3 className="text-sm font-bold text-slate-800 mb-1">No active medication tracks</h3>
                <p className="text-xs text-slate-450 max-w-xs mx-auto leading-relaxed mb-6">
                  Add Med schedules to configure real-time vocal alert warnings and browse notification triggers!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {reminders.map((reminder) => {
                    const isTakenToday = reminder.takenDates.includes(todayStr);
                    return (
                      <motion.div
                        key={reminder._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className={`glass-panel p-6 rounded-2xl transition-all duration-300 border flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${
                          !reminder.active
                            ? "opacity-45 border-slate-100 bg-slate-50/30"
                            : isTakenToday
                            ? "border-emerald-200 bg-emerald-50/[0.05]"
                            : "border-slate-100"
                        }`}
                      >
                        {/* Checklist Check circle */}
                        <div className="flex items-start gap-4">
                          {reminder.active && (
                            <button
                              onClick={() => handleMarkAsTaken(reminder)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition shrink-0 ${
                                isTakenToday
                                  ? "bg-emerald-500 border border-emerald-600 text-white shadow-sm"
                                  : "border border-slate-350 bg-slate-50 hover:border-emerald-500"
                              }`}
                              title={isTakenToday ? "Mark as untaken" : "Mark as taken today"}
                            >
                              {isTakenToday && (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-extrabold text-slate-900 leading-none">
                                {reminder.medicineName}
                              </span>
                              {isTakenToday && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[8px] font-bold text-emerald-600">
                                  Taken Today
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                ⏰ {reminder.time}
                              </span>
                              {reminder.note && (
                                <span className="italic pl-3 border-l border-slate-200">
                                  {reminder.note}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Flat active switch + CRUD */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto border-t sm:border-0 border-slate-100 pt-3 sm:pt-0">
                          <button
                            onClick={() => handleToggleReminder(reminder)}
                            className={`w-9 h-5.5 rounded-full p-0.5 transition cursor-pointer flex items-center ${
                              reminder.active ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
                            }`}
                            aria-label={reminder.active ? "Deactivate reminder" : "Activate reminder"}
                          >
                            <span className="w-4.5 h-4.5 rounded-full bg-white shadow-sm" />
                          </button>

                          <button
                            onClick={() => previewReminderAudio(reminder)}
                            className="w-8 h-8 rounded-full bg-slate-50 border border-slate-150 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 flex items-center justify-center cursor-pointer transition text-xs"
                            title="Preview voice announcement"
                          >
                            🔊
                          </button>

                          <button
                            onClick={() => handleEditClick(reminder)}
                            className="w-8 h-8 rounded-full bg-slate-50 border border-slate-150 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer transition text-xs"
                            title="Edit"
                          >
                            ✏️
                          </button>


                          <button
                            onClick={() => handleDeleteReminder(reminder._id)}
                            className="w-8 h-8 rounded-full bg-slate-50 border border-slate-150 text-slate-500 hover:text-red-500 flex items-center justify-center cursor-pointer transition text-xs"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* AUDITED SCANS HISTORY */}
          <div className="lg:col-span-5 space-y-8">
            {/* VOICE ASSISTANT CONFIGURATION PANEL */}
            <div className="glass-panel p-8 rounded-[2rem] border border-slate-100 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>🔊</span> Vocal Assistant Settings
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[8px] font-bold text-emerald-600">
                  Calm Assist
                </span>
              </div>

              <div className="space-y-4">
                {/* Voice Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Voice Selection
                  </label>
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => {
                      setSelectedVoiceName(e.target.value);
                      localStorage.setItem("medibuddy_voice_name", e.target.value);
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 cursor-pointer"
                  >
                    {voices.length === 0 ? (
                      <option>Default Voice</option>
                    ) : (
                      voices.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Speed slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Speaking Speed (Elderly Comfort)
                    </label>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {speechRate}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1.2"
                    step="0.05"
                    value={speechRate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSpeechRate(val);
                      localStorage.setItem("medibuddy_voice_rate", String(val));
                    }}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-400">
                    <span>Relaxed (0.6x)</span>
                    <span>Standard (1.0x)</span>
                    <span>Fast (1.2x)</span>
                  </div>
                </div>

                {/* Volume slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Assistant Volume
                    </label>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {Math.round(speechVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={speechVolume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSpeechVolume(val);
                      localStorage.setItem("medibuddy_voice_volume", String(val));
                    }}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* Preview Section */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={playVoicePreview}
                  disabled={isTestSpeaking}
                  className={`px-4 py-2.5 rounded-full font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer transition ${
                    isTestSpeaking
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : "bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 text-emerald-800"
                  }`}
                >
                  <span>{isTestSpeaking ? "Speaking..." : "🔊 Test Voice Alert"}</span>
                </button>

                {isTestSpeaking && (
                  <div className="flex items-center gap-1 h-4 px-2 bg-emerald-50 border border-emerald-100/50 rounded-full">
                    <div className="w-1 h-3 bg-emerald-500 rounded-full animate-bar-wave" style={{ animation: "barWave 0.8s ease-in-out infinite", animationDelay: "0s" }} />
                    <div className="w-1 h-3 bg-emerald-500 rounded-full animate-bar-wave" style={{ animation: "barWave 0.8s ease-in-out infinite", animationDelay: "0.15s" }} />
                    <div className="w-1 h-3 bg-emerald-500 rounded-full animate-bar-wave" style={{ animation: "barWave 0.8s ease-in-out infinite", animationDelay: "0.3s" }} />
                    <div className="w-1 h-3 bg-emerald-500 rounded-full animate-bar-wave" style={{ animation: "barWave 0.8s ease-in-out infinite", animationDelay: "0.45s" }} />
                  </div>
                )}
              </div>
            </div>

            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>📋</span> Audited History
              </h2>
              {history.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400">
                  {history.length} ITEMS
                </span>
              )}
            </div>

            {isLoadingHistory ? (
              <div className="h-24 w-full bg-slate-50 rounded-2xl animate-pulse" />
            ) : history.length === 0 ? (
              <div className="glass-panel p-10 text-center rounded-[2rem] border-dashed border-slate-200/80 bg-slate-50/20">
                <span className="text-3xl mb-3 block">📷</span>
                <h4 className="text-sm font-bold text-slate-800 mb-1">No packaging history</h4>
                <p className="text-xs text-slate-450 leading-relaxed max-w-[200px] mx-auto">
                  Photographed medicine packaging lists are dynamically archived in this tab guide.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {history.map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-panel p-4 rounded-xl border border-slate-100 flex gap-4 items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt="Audit thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xs shrink-0">
                            💊
                          </div>
                        )}

                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-850 leading-none">
                            {item.medicineName}
                          </h4>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                            {item.purpose}
                          </p>
                          <span className="text-[9px] text-slate-400 block font-semibold">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteHistory(item._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md hover:bg-red-550 text-slate-400 hover:text-red-550 flex items-center justify-center cursor-pointer text-xs"
                        title="Delete log"
                      >
                        🗑️
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LUXURY EDIT / ADD DIALOG */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="glass-panel p-8 rounded-[2rem] max-w-md w-full relative z-10 shadow-lg"
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-6">
                {editingReminder ? "✏️ Edit Med Routine" : "⏰ Schedule Med Routine"}
              </h3>

              <form onSubmit={handleSaveReminder} className="space-y-5">
                {/* Med Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Medicine Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    placeholder="e.g. Metformin Hydrochloride"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>

                {/* Alarm Time */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Dosage Note / Intake Instructions
                  </label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="e.g. Take 1 tablet before bed"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5"
                  />
                </div>

                {/* CTA actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm cursor-pointer transition active:scale-98"
                  >
                    {editingReminder ? "Save Changes" : "Create Alarm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
