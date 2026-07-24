"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Pill, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Settings, 
  Send, 
  Mic, 
  Clock, 
  Activity, 
  AlertCircle,
  ShieldCheck,
  User,
  Heart,
  ChevronDown,
  ChevronUp,
  PhoneCall,
  HelpCircle,
  Stethoscope,
  TrendingUp,
  CheckCircle2
} from "lucide-react";
import { PatientIntakeData, CDSSPayload, TriageLevel } from "@/lib/clinicalTypes";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isMock?: boolean;
  isSpeaking?: boolean;
  timestamp: string;
  riskLevel?: TriageLevel;
}

const getInitialWelcomeContent = (lang: "english" | "hindi" | "telugu") => {
  if (lang === "hindi") {
    return JSON.stringify({
      riskLevel: "ROUTINE",
      emergencyTriggered: false,
      patientSummary: "रोगी नैदानिक लक्षण मूल्यांकन के लिए उपस्थित हो रहा है।",
      primarySymptoms: ["मुख्य लक्षण की प्रतीक्षा है"],
      clinicalAssessment: "मेडीबडी एआई सीडीएसएस सक्रिय है। ICD-10, SNOMED CT, WHO, और NICE नैदानिक दिशानिर्देशों पर आधारित।",
      rankedDifferential: [
        {
          conditionName: "नैदानिक लक्षण मूल्यांकन",
          icd10Code: "Z00.00",
          likelihood: "High",
          confidenceRange: "90-95%",
          rationale: "कृपया 5-स्तरीय नैदानिक मूल्यांकन शुरू करने के लिए लक्षण विवरण प्रदान करें।",
          supportingEvidence: ["सिस्टम प्रारंभ किया गया"],
          opposingEvidence: [],
          missingInfoNeeded: ["लक्षण विवरण", "वाइटल्स"]
        }
      ],
      followUpQuestions: [
        "आज आपको किस मुख्य लक्षण के कारण परामर्श लेना पड़ रहा है?",
        "आपको यह लक्षण कितने समय से महसूस हो रहे हैं?",
        "क्या आपको बुखार या उच्च रक्तचाप की समस्या है?"
      ],
      recommendations: [
        "सटीक जांच के लिए ऊपर दिए गए 22-मापदंडों वाले फ़ॉर्म को भरें।",
        "अपने शुरुआती लक्षणों का विस्तार से वर्णन करें।"
      ],
      warningSigns: [
        "अचानक सीने में दर्द, सांस लेने में तकलीफ या स्ट्रोक के लक्षणों के लिए आपातकालीन चिकित्सा की आवश्यकता होती है।"
      ],
      recommendedTests: ["नैदानिक वाइटल्स जांच"],
      immediateAdvice: "अपने लक्षणों का वर्णन करें या नीचे त्वरित प्रश्न चुनें।",
      qualityScores: { evidenceStrength: 90, clinicalConfidence: 92, missingInformation: ["मुख्य लक्षण"], diagnosticCompleteness: 85 },
      disclaimer: "⚠️ नैदानिक अस्वीकरण: मेडीबडी एआई सीडीएसएस एक स्वचालित निर्णय सहायता उपकरण है और औपचारिक चिकित्सा निदान प्रदान नहीं करता है।"
    });
  }
  if (lang === "telugu") {
    return JSON.stringify({
      riskLevel: "ROUTINE",
      emergencyTriggered: false,
      patientSummary: "రోగి క్లినికల్ లక్షణాల మూల్యాంకనం కోసం హాజరవుతున్నారు.",
      primarySymptoms: ["ముఖ్య లక్షణం కోసం వేచి చూస్తోంది"],
      clinicalAssessment: "మెడిబడ్డీ AI CDSS యాక్టివ్‌గా ఉంది. ICD-10, SNOMED CT, WHO మరియు NICE క్లినికల్ మార్గదర్శకాల ఆధారంగా పనిచేస్తుంది.",
      rankedDifferential: [
        {
          conditionName: "క్లినికల్ లక్షణాల మూల్యాంకనం",
          icd10Code: "Z00.00",
          likelihood: "High",
          confidenceRange: "90-95%",
          rationale: "5-స్థాయి క్లినికల్ ట్రయేజ్‌ను ప్రారంభించడానికి దయచేసి మీ లక్షణాలను వివరిించండి.",
          supportingEvidence: ["సిస్టమ్ ప్రారంభించబడింది"],
          opposingEvidence: [],
          missingInfoNeeded: ["లక్షణాల వివరాలు", "వైటల్స్"]
        }
      ],
      followUpQuestions: [
        "ఈరోజు మిమ్మల్ని ఇక్కడకు తీసుకువచ్చిన ప్రాథమిక లక్షణం ఏమిటి?",
        "మీరు ఈ లక్షణాలను ఎంతకాలంగా అనుభవిస్తున్నారు?",
        "మీకు జ్వరం లేదా అధిక రక్తపోటు రీడింగ్ ఉందా?"
      ],
      recommendations: [
        "ఖచ్చితమైన విశ్లేషణ కోసం పైన ఉన్న 22-పారామితుల ఇన్టేక్ ఫారమ్‌ను పూర్తి చేయండి.",
        "మీ లక్షణాలను వివరంగా వివరిించండి."
      ],
      warningSigns: [
        "హఠాత్తుగా ఛాతీ నెప్పి, శ్వాస తీసుకోవడంలో ఇబ్బంది లేదా పక్షవాతం లక్షణాలు కనిపిస్తే అత్యవసర వైద్య మూల్యాంకనం అవసరం."
      ],
      recommendedTests: ["వైటల్స్ పరీక్ష"],
      immediateAdvice: "మీ లక్షణాలను వివరిించండి లేదా క్రింద ఉన్న ప్రశ్నను ఎంచుకోండి.",
      qualityScores: { evidenceStrength: 90, clinicalConfidence: 92, missingInformation: ["ప్రధాన లక్షణాలు"], diagnosticCompleteness: 85 },
      disclaimer: "⚠️ క్లినికల్ నిరాకరణ: మెడిబడ్డీ AI CDSS అనేది ఒక స్వయంచాలక మద్దతు సాధనం మరియు అధికారిక వైద్య నిర్ధారణను అందించదు."
    });
  }
  return JSON.stringify({
    riskLevel: "ROUTINE",
    emergencyTriggered: false,
    patientSummary: "Patient presenting for clinical symptom assessment.",
    primarySymptoms: ["Awaiting chief complaint"],
    clinicalAssessment: "MediBuddy AI CDSS active. Grounded in ICD-10, SNOMED CT, WHO, and NICE clinical guidelines.",
    rankedDifferential: [
      {
        conditionName: "Clinical Symptom Triage Assessment",
        icd10Code: "Z00.00",
        likelihood: "High",
        confidenceRange: "90-95%",
        rationale: "Please complete patient vitals and describe symptoms to initialize 5-level clinical triage.",
        supportingEvidence: ["System initialized"],
        opposingEvidence: [],
        missingInfoNeeded: ["Symptom description", "Vitals"]
      }
    ],
    followUpQuestions: [
      "What primary symptom prompted your visit today?",
      "How long have you been experiencing these symptoms?",
      "Do you have a fever or high blood pressure reading?"
    ],
    recommendations: [
      "Complete the 22-parameter clinical intake form above for tailored triage accuracy.",
      "Describe any onset symptoms in detail."
    ],
    warningSigns: [
      "Sudden chest pain, respiratory distress, or stroke signs require emergency medical evaluation."
    ],
    recommendedTests: ["Clinical Vitals Check"],
    immediateAdvice: "Describe your symptoms or select a quick check below.",
    qualityScores: {
      evidenceStrength: 90,
      clinicalConfidence: 92,
      missingInformation: ["Chief Complaint"],
      diagnosticCompleteness: 85
    },
    disclaimer: "⚠️ CLINICAL DISCLAIMER: MediBuddy AI CDSS is an automated triage decision support tool and does not provide formal medical diagnosis."
  });
};

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

export default function ClinicalTriageAssistant() {
  const [language, setLanguage] = useState<"english" | "hindi" | "telugu">("english");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: getInitialWelcomeContent("english"),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      riskLevel: "ROUTINE"
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showIntakeDrawer, setShowIntakeDrawer] = useState(true);

  // 22-Parameter Patient Intake State
  const [intake, setIntake] = useState<PatientIntakeData>({
    age: "35",
    gender: "Male",
    height: "175 cm",
    weight: "70 kg",
    pregnancyStatus: "Not Pregnant",
    existingDiseases: "None",
    currentMedications: "None",
    allergies: "No known drug allergies",
    smokingHistory: "Non-smoker",
    alcoholHistory: "Occasional",
    duration: "1 to 2 days",
    severity: 4,
    painLocation: "General",
    painType: "Dull ache",
    associatedSymptoms: "Mild fatigue",
    recentTravel: "None",
    recentSurgery: "None",
    familyHistory: "None",
    bloodPressure: "120/80 mmHg",
    heartRate: "72 bpm",
    temperature: "98.6°F",
    oxygenSaturation: "98% SpO2"
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleLanguageSelect = (newLang: "english" | "hindi" | "telugu") => {
    setLanguage(newLang);
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome-1") {
        return [{
          ...prev[0],
          content: getInitialWelcomeContent(newLang)
        }];
      }
      return prev;
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === "hindi" ? "hi-IN" : language === "telugu" ? "te-IN" : "en-IN";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (isVoiceMuted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    let cleanText = text;
    try {
      const parsed: CDSSPayload = JSON.parse(text);
      cleanText = parsed.patientSummary || parsed.immediateAdvice || parsed.clinicalAssessment || text;
    } catch (e) {
      cleanText = text.replace(/[*#]/g, "");
    }

    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 300));
    utterance.lang = language === "hindi" ? "hi-IN" : language === "telugu" ? "te-IN" : "en-IN";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze-symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: text,
          preferredLanguage: language,
          language: language,
          messages: [...messages, userMsg],
          patientContext: intake
        }),
      });

      const data = await response.json();
      playCalmChime();

      const assistantMsg: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.content,
        isMock: data.isMock,
        riskLevel: data.riskLevel || "ROUTINE",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(data.content);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTriagePayload = (jsonString: string) => {
    try {
      const data: CDSSPayload = JSON.parse(jsonString);
      const riskLevel = data.riskLevel || "ROUTINE";
      const isEmergency = riskLevel === "EMERGENCY" || data.emergencyTriggered;

      return (
        <div className="space-y-5 text-xs">
          {/* Emergency Alert Banner */}
          {isEmergency && (
            <div className="bg-red-600 text-white rounded-xl p-5 shadow-lg border-2 border-red-400 space-y-2 animate-pulse">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
                <PhoneCall className="w-5 h-5 animate-bounce" />
                <span>🚨 EMERGENCY RED-FLAG ALERT</span>
              </div>
              <p className="text-xs font-bold leading-relaxed">
                {data.emergencyNotice || "Critical symptoms detected. Immediate emergency medical evaluation is required."}
              </p>
              <div className="pt-2 flex gap-3">
                <a
                  href="tel:108"
                  className="px-4 py-2 bg-white text-red-700 font-extrabold rounded-lg text-xs uppercase shadow hover:bg-red-50 transition"
                >
                  Call Emergency (108 / 911)
                </a>
              </div>
            </div>
          )}

          {/* 5-Level Triage Header & Patient Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Clinical Triage Level</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                riskLevel === "EMERGENCY"
                  ? "bg-red-100 text-red-800 border-red-300"
                  : riskLevel === "URGENT"
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : riskLevel === "SEMI-URGENT"
                  ? "bg-yellow-100 text-yellow-900 border-yellow-300"
                  : riskLevel === "ROUTINE"
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : "bg-blue-100 text-blue-900 border-blue-300"
              }`}>
                {riskLevel}
              </span>
            </div>
            <p className="text-slate-800 font-medium leading-relaxed pt-1">{data.patientSummary}</p>
          </div>

          {/* 4-Metric Clinical Quality Scores */}
          {data.qualityScores && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white border border-slate-200/80 p-3 rounded-xl text-center shadow-sm">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Evidence Strength</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">{data.qualityScores.evidenceStrength}%</span>
              </div>
              <div className="bg-white border border-slate-200/80 p-3 rounded-xl text-center shadow-sm">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Clinical Confidence</span>
                <span className="text-sm font-black text-emerald-600 block mt-0.5">{data.qualityScores.clinicalConfidence}%</span>
              </div>
              <div className="bg-white border border-slate-200/80 p-3 rounded-xl text-center shadow-sm">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Completeness</span>
                <span className="text-sm font-black text-emerald-600 block mt-0.5">{data.qualityScores.diagnosticCompleteness}%</span>
              </div>
              <div className="bg-white border border-slate-200/80 p-3 rounded-xl text-center shadow-sm">
                <span className="text-[9px] font-bold uppercase text-slate-400 block">Missing Params</span>
                <span className="text-xs font-bold text-slate-700 block mt-1">{data.qualityScores.missingInformation?.length || 0} items</span>
              </div>
            </div>
          )}

          {/* Ranked Differential Diagnosis Cards with ICD-10 */}
          {data.rankedDifferential && data.rankedDifferential.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Ranked Differential Diagnosis (ICD-10 Grounded)
              </span>
              {data.rankedDifferential.map((diff, idx) => (
                <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{diff.conditionName}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold border border-slate-200">
                        {diff.icd10Code}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Likelihood: {diff.likelihood} ({diff.confidenceRange})
                    </span>
                  </div>

                  <p className="text-slate-650 leading-relaxed text-xs">{diff.rationale}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100 text-[11px]">
                      <span className="font-bold text-emerald-800 uppercase text-[9px] block">Supporting Evidence</span>
                      <ul className="list-disc pl-3 text-slate-700">
                        {diff.supportingEvidence?.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-[11px]">
                      <span className="font-bold text-slate-500 uppercase text-[9px] block">Opposing / Missing Factors</span>
                      <ul className="list-disc pl-3 text-slate-600">
                        {diff.opposingEvidence?.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic Follow-Up Questions */}
          {data.followUpQuestions && data.followUpQuestions.length > 0 && (
            <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                Targeted Clinical Follow-Up Questions
              </span>
              <div className="space-y-1.5">
                {data.followUpQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left p-2 rounded-lg bg-white border border-amber-200/80 hover:border-amber-400 text-slate-800 font-medium text-xs transition cursor-pointer"
                  >
                    👉 {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Clinical Tests & Guidance */}
          {data.recommendedTests && data.recommendedTests.length > 0 && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Recommended Tests & Workup</span>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {data.recommendedTests.map((test, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full font-bold text-slate-700 text-xs">
                    🧪 {test}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-2 italic">
            {data.disclaimer || "⚠️ AI Clinical Decision Support Tool. Consult a licensed physician for professional medical diagnosis."}
          </div>
        </div>
      );
    } catch (e) {
      return <p className="text-xs leading-relaxed">{jsonString}</p>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24 pt-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Clinical Decision Support System (CDSS v3.2)</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Clinical Symptom Triage Engine
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e: any) => handleLanguageSelect(e.target.value)}
              className="h-10 px-3 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-sm cursor-pointer"
            >
              <option value="english">English (en-IN)</option>
              <option value="hindi">Hindi (hi-IN)</option>
              <option value="telugu">Telugu (te-IN)</option>
            </select>

            <button
              onClick={() => setIsVoiceMuted(!isVoiceMuted)}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                isVoiceMuted ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm"
              }`}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 22-Parameter Patient Intake Collapsible Drawer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowIntakeDrawer(!showIntakeDrawer)}
            className="w-full p-4 bg-slate-50/80 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>22-Parameter Clinical Intake Form ({intake.age}y, {intake.gender}, BP: {intake.bloodPressure}, SpO2: {intake.oxygenSaturation})</span>
            </div>
            {showIntakeDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showIntakeDrawer && (
            <div className="p-5 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Age</label>
                <input
                  type="text"
                  value={intake.age}
                  onChange={(e) => setIntake({ ...intake, age: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Gender</label>
                <select
                  value={intake.gender}
                  onChange={(e) => setIntake({ ...intake, gender: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={intake.bloodPressure}
                  onChange={(e) => setIntake({ ...intake, bloodPressure: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Oxygen SpO2</label>
                <input
                  type="text"
                  value={intake.oxygenSaturation}
                  onChange={(e) => setIntake({ ...intake, oxygenSaturation: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Heart Rate</label>
                <input
                  type="text"
                  value={intake.heartRate}
                  onChange={(e) => setIntake({ ...intake, heartRate: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Temperature</label>
                <input
                  type="text"
                  value={intake.temperature}
                  onChange={(e) => setIntake({ ...intake, temperature: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Duration</label>
                <input
                  type="text"
                  value={intake.duration}
                  onChange={(e) => setIntake({ ...intake, duration: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Pain Scale (1-10): {intake.severity}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intake.severity}
                  onChange={(e) => setIntake({ ...intake, severity: Number(e.target.value) })}
                  className="w-full accent-emerald-600 mt-2"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Existing Diseases / Comorbidities</label>
                <input
                  type="text"
                  value={intake.existingDiseases}
                  onChange={(e) => setIntake({ ...intake, existingDiseases: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-slate-400 uppercase text-[10px] block mb-1">Allergies & Current Medications</label>
                <input
                  type="text"
                  value={intake.allergies}
                  onChange={(e) => setIntake({ ...intake, allergies: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Chat Stream Window */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm min-h-[480px] flex flex-col justify-between space-y-6">
          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl p-5 shadow-sm space-y-2 ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white font-medium text-xs"
                      : "bg-white border border-slate-200/80 text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 pb-1 border-b border-slate-100">
                    <span className="font-bold uppercase tracking-wider">{msg.role === "user" ? "Patient Intake" : "MediBuddy CDSS Engine"}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {msg.role === "assistant" ? (
                    renderTriagePayload(msg.content)
                  ) : (
                    <p className="text-xs leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-500 animate-pulse flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>
                    {language === "hindi"
                      ? "ICD-10 नियमों और 5-स्तरीय नैदानिक मूल्यांकन की जांच की जा रही है..."
                      : language === "telugu"
                      ? "ICD-10 నిబంధనలు & 5-స్థాయి క్లినికల్ ట్రయేజ్‌ను మూల్యాంకనం చేస్తోంది..."
                      : "Evaluating ICD-10 differential rules & 5-level clinical triage..."}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <button
              onClick={toggleVoiceInput}
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition cursor-pointer shrink-0 ${
                isListening ? "bg-red-50 border-red-300 text-red-600 animate-pulse" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={
                language === "hindi"
                  ? isListening
                    ? "सुन रहा हूँ..."
                    : "लक्षणों का विस्तार से वर्णन करें (जैसे सीने में दर्द, सूखी खांसी, चक्कर आना)..."
                  : language === "telugu"
                  ? isListening
                    ? "వింటున్నాను..."
                    : "లక్షణాలను వివరంగా చెప్పండి (ఉదా. ఛాతీ నెప్పి, పొడి దగ్గు, తలతిరగడం)..."
                  : isListening
                  ? "Listening aloud..."
                  : "Describe symptoms in detail (e.g. chest pain, dry cough, dizziness)..."
              }
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition active:scale-97 cursor-pointer shrink-0 flex items-center justify-center gap-2"
            >
              <span>
                {language === "hindi" ? "लक्षण जांच" : language === "telugu" ? "లక్షణాల తనిఖీ" : "CDSS Triage"}
              </span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
