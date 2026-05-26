"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isMock?: boolean;
  isSpeaking?: boolean;
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

const translations = {
  english: {
    title: "Symptom Assistant",
    subtitle: "Discuss wellness concerns in a secure, minimal dialogue space. Use vocal dictation and speech output.",
    placeholder: "Describe your symptoms here or tap the mic to speak...",
    send: "Send",
    listening: "Listening aloud...",
    clinicalEngine: "Clinical Engine Active",
    quickSymptomsHeader: "Common symptom checks:",
    quickSymptoms: [
      { title: "Headache & Fever", text: "I have a headache accompanied by a rising fever and exhaustion." },
      { title: "Dry Cough & Sore Throat", text: "I have had a tickling dry cough and throat irritation for two days." },
      { title: "Stomach Cramps & Nausea", text: "I am experiencing stomach cramps and indigestion after dinner." },
    ],
    welcomeMsg: `### 👋 Welcome to MediBuddy AI
Describe your symptoms in simple language (e.g. "I have throat pain and a persistent dry cough"). MediBuddy AI clinical intelligence will instantly analyze possible conditions, rest protocols, and clinical warnings.

Use the **microphone 🎙️** to dictate symptoms, or tap the **speaker 🔊** icon on messages to listen aloud.`,
    settingsHeader: "Voice Assistant Controls",
    langSelect: "Language Selection",
    voiceSelect: "Voice Selection",
    speakingSpeed: "Speaking Speed",
    speakingVolume: "Assistant Volume",
    previewBtn: "🔊 Test Voice Alert",
    speakingBtn: "Speaking...",
    muteToggle: "Mute Vocal Audio"
  },
  hindi: {
    title: "लक्षण सहायक",
    subtitle: "एक सुरक्षित, न्यूनतम संवाद स्थान में स्वास्थ्य संबंधी चिंताओं पर चर्चा करें। आवाज श्रुतलेख और भाषण आउटपुट का उपयोग करें।",
    placeholder: "यहाँ अपने लक्षणों का वर्णन करें या बोलने के लिए माइक पर टैप करें...",
    send: "भेजें",
    listening: "आवाज़ सुन रहा हूँ...",
    clinicalEngine: "क्लिनिकल इंजन सक्रिय",
    quickSymptomsHeader: "सामान्य लक्षण जाँच:",
    quickSymptoms: [
      { title: "सिरदर्द और बुखार", text: "मुझे सिरदर्द के साथ-साथ तेज बुखार और थकान महसूस हो रही है।" },
      { title: "सूखी खांसी और गले में खराश", text: "मुझे दो दिनों से गले में खराश और सूखी खांसी आ रही है।" },
      { title: "पेट में ऐंठन और मतली", text: "मुझे रात के खाने के बाद पेट में ऐंठन और अपच का अनुभव हो रहा है।" },
    ],
    welcomeMsg: `### 👋 मेडीबडी एआई में आपका स्वागत है
अपने लक्षणों को सरल भाषा में समझाएं (जैसे "मुझे गले में दर्द और लगातार सूखी खांसी है")। मेडीबडी एआई नैदानिक ​​बुद्धि तुरंत संभावित स्थितियों, आराम प्रोटोकॉल और नैदानिक चेतावनियों का विश्लेषण करेगी।

लक्षणों को निर्धारित करने के लिए **माइक 🎙️** का उपयोग करें, या जोर से सुनने के लिए संदेशों पर **स्पीकर 🔊** आइकन पर टैप करें।`,
    settingsHeader: "वॉयस असिस्टेंट कंट्रोल्स",
    langSelect: "भाषा का चयन",
    voiceSelect: "वॉयस चयन",
    speakingSpeed: "बोलने की गति",
    speakingVolume: "असिस्टेंट वॉल्यूम",
    previewBtn: "🔊 वॉयस टेस्ट",
    speakingBtn: "बोल रहा हूँ...",
    muteToggle: "वॉयस म्यूट करें"
  },
  telugu: {
    title: "లక్షణాల సహాయకుడు",
    subtitle: "సురక్షితమైన, సరళమైన సంభాషణ స్థలంలో మీ ఆరోగ్య సమస్యలను చర్చించండి. వాయిస్ టైపింగ్ మరియు స్పీచ్ అవుట్‌పుట్ ఉపయోగించండి.",
    placeholder: "ఇక్కడ మీ లక్షణాలను వివరించండి లేదా మాట్లాడటానికి మైక్‌ని నొక్కండి...",
    send: "పంపండి",
    listening: "వాయిస్ వింటున్నాను...",
    clinicalEngine: "క్లినికల్ ఇంజిన్ యాక్టివ్‌గా ఉంది",
    quickSymptomsHeader: "సాధారణ లక్షణాల తనిఖీ:",
    quickSymptoms: [
      { title: "తలనొప్పి & జ్వరం", text: "నాకు తలనొప్పితో పాటు జ్వరం మరియు తీవ్రమైన అలసట ఉంది." },
      { title: "పొడి దగ్గు & గొంతు నొప్పి", text: "నాకు రెండు రోజులుగా గొంతు నొప్పి మరియు పొడి దగ్గు వస్తోంది." },
      { title: "కడుపు నొప్పి & వికారం", text: "రాత్రి భోజనం తర్వాత నాకు కడుపు నొప్పి మరియు అజీర్ణం కలిగింది." },
    ],
    welcomeMsg: `### 👋 మెడిబడ్డీ AI కి స్వాగతం
మీ లక్షణాలను సరళమైన భాషలో వివరించండి (ఉదా. "నాకు గొంతు నొప్పి మరియు నిరంతర పొడి దగ్గు ఉంది"). మెడిబడ్డీ AI క్లినికల్ ఇంటెలిజెన్స్ తక్షణమే సాధ్యమయ్యే పరిస్థితులు, విశ్రాంతి ప్రోటోకాల్‌లు మరియు క్లినికల్ హెచ్చరికలను విశ్లేషిస్తుంది.

మీ లక్షణాలను చెప్పడానికి **మైక్రోఫోన్ 🎙️** ఉపయోగించండి, లేదా గట్టిగా వినడానికి సందేశాలపై **స్పీకర్ 🔊** గుర్తును నొక్కండి.`,
    settingsHeader: "వాయిస్ అసిస్టెంట్ సెట్టింగ్‌లు",
    langSelect: "భాష ఎంపిక",
    voiceSelect: "వాయిస్ ఎంపిక",
    speakingSpeed: "మాట్లాడే వేగం",
    speakingVolume: "అసిస్టెంట్ వాల్యూమ్",
    previewBtn: "🔊 వాయిస్ టెస్ట్",
    speakingBtn: "మాట్లాడుతోంది...",
    muteToggle: "వాయిస్ మ్యూట్ చేయి"
  }
};

export default function SymptomChat() {
  const [language, setLanguage] = useState<"english" | "hindi" | "telugu">("english");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: translations.english.welcomeMsg,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(0.8);
  const [speechVolume, setSpeechVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTestSpeaking, setIsTestSpeaking] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Initialize Speech Recognition API dynamically when language changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }

        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;

        const langMap = {
          english: "en-IN",
          hindi: "hi-IN",
          telugu: "te-IN"
        };
        rec.lang = langMap[language] || "en-IN";

        rec.onstart = () => {
          setIsListening(true);
          setRecognitionError(null);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => {
            const updatedInput = prev ? prev + " " + transcript : transcript;
            setTimeout(() => {
              handleSendMessage(updatedInput);
            }, 600);
            return updatedInput;
          });
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error !== "no-speech") {
            setRecognitionError("Voice error: " + event.error);
          }
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [language]);

  // SpeechSynthesis Setup
  useEffect(() => {
    const savedVoice = localStorage.getItem("medibuddy_assistant_voice");
    const savedRate = localStorage.getItem("medibuddy_assistant_rate");
    const savedVol = localStorage.getItem("medibuddy_assistant_volume");
    const savedMuted = localStorage.getItem("medibuddy_assistant_muted");
    const savedLang = localStorage.getItem("medibuddy_assistant_lang");

    if (savedVoice) setSelectedVoiceName(savedVoice);
    if (savedRate) setSpeechRate(Number(savedRate));
    if (savedVol) setSpeechVolume(Number(savedVol));
    if (savedMuted) setIsMuted(savedMuted === "true");
    if (savedLang) setLanguage(savedLang as any);

    const updateVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        if (!savedVoice && availableVoices.length > 0) {
          autoSelectVoiceForLanguage(savedLang || language, availableVoices);
        }
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const autoSelectVoiceForLanguage = (lang: string, allVoices: SpeechSynthesisVoice[]) => {
    const searchTerms: Record<string, string[]> = {
      english: ["en-in", "samantha", "en-us", "google us english"],
      hindi: ["hi-in", "hindi", "hi_in"],
      telugu: ["te-in", "telugu", "te_in"]
    };

    const terms = searchTerms[lang] || ["en-in"];
    let matchedVoice = null;
    
    for (const term of terms) {
      matchedVoice = allVoices.find(v => v.lang.toLowerCase().includes(term) || v.name.toLowerCase().includes(term));
      if (matchedVoice) break;
    }

    if (matchedVoice) {
      setSelectedVoiceName(matchedVoice.name);
    } else if (allVoices.length > 0) {
      setSelectedVoiceName(allVoices[0].name);
    }
  };

  // Sync vocal language selection updates
  useEffect(() => {
    if (voices.length > 0) {
      autoSelectVoiceForLanguage(language, voices);
    }
    localStorage.setItem("medibuddy_assistant_lang", language);

    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === "welcome") {
        return [{
          id: "welcome",
          role: "assistant",
          content: translations[language].welcomeMsg
        }];
      }
      return prev;
    });
  }, [language, voices]);

  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      setRecognitionError("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSpeak = (text: string, messageId: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Voice speech is not supported in this browser.");
      return;
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isSpeaking: false } : { ...m, isSpeaking: false }))
      );
      return;
    }

    if (isMuted) return;

    playCalmChime();
    
    setTimeout(() => {
      const cleanText = text
        .replace(/#/g, "")
        .replace(/\*/g, "")
        .replace(/_/g, "")
        .replace(/- /g, "")
        .replace(/⚠️/g, language === "hindi" ? "चेतावनी:" : language === "telugu" ? "హెచ్చరిక:" : "Warning:")
        .replace(/🩺/g, "")
        .replace(/💡/g, language === "hindi" ? "सुझाव:" : language === "telugu" ? "సూచన:" : "Tip:")
        .replace(/🚨/g, language === "hindi" ? "ध्यान दें:" : language === "telugu" ? "గమనిక:" : "Attention:");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = speechRate;
      utterance.volume = speechVolume;

      utterance.onend = () => {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isSpeaking: false } : m))
        );
      };

      utterance.onerror = (e) => {
        console.error("SpeechSynthesis error:", e);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isSpeaking: false } : m))
        );
      };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isSpeaking: true } : { ...m, isSpeaking: false }
        )
      );

      window.speechSynthesis.speak(utterance);
    }, 850);
  };

  const playVoicePreview = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsTestSpeaking(true);
    playCalmChime();
    
    setTimeout(() => {
      const previewTextMap = {
        english: "Hello. I am your MediBuddy clinical companion.",
        hindi: "नमस्ते। मैं आपका मेडीबडी क्लिनिकल साथी हूँ।",
        telugu: "నమస్తే. నేను మీ మెడిబడ్డీ క్లినికల్ తోడు."
      };
      const voiceText = previewTextMap[language] || previewTextMap.english;
      const utterance = new SpeechSynthesisUtterance(voiceText);
      
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = speechRate;
      utterance.volume = speechVolume;
      
      utterance.onend = () => {
        setIsTestSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsTestSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }, 850);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Reset speaking states
    setMessages((prev) => prev.map((m) => ({ ...m, isSpeaking: false })));

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze-symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          language: language
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process symptoms");
      }

      const responseText = data.content;
      const newAiMsgId = `ai_${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: newAiMsgId,
          role: "assistant",
          content: responseText,
          isMock: data.isMock,
        },
      ]);

      // Auto-speak response if vocal speaker is not muted
      if (!isMuted) {
        setTimeout(() => {
          handleSpeak(responseText, newAiMsgId);
        }, 500);
      }
    } catch (err: any) {
      console.error(err);
      const errMsgContent = language === "hindi"
        ? `🔴 **त्रुटि:** ${err?.message || "सर्वर से कनेक्ट करने में समस्या हुई। पुनः प्रयास करें।"}`
        : language === "telugu"
        ? `🔴 **లోపం:** ${err?.message || "సర్వర్‌తో కనెక్ట్ కావడంలో ఇబ్బంది ఏర్పడింది. మళ్లీ ప్రయత్నించండి."}`
        : `🔴 **Processing Error:** ${err?.message || "I encountered an error connecting to our database. Please try again."}`;

      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: errMsgContent,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-dots py-16 px-6 flex flex-col items-center">
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
      <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/[0.01] rounded-full filter blur-[100px] -z-10 pulse-airy" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/[0.01] rounded-full filter blur-[100px] -z-10 pulse-airy" style={{ animationDelay: "1.5s" }} />

      <div className="w-full max-w-4xl flex-grow flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {translations[language].title}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto">
            {translations[language].subtitle}
          </p>
        </div>

        {/* CHAT workspace */}
        <div className="glass-panel rounded-[2.5rem] flex flex-col flex-1 max-h-[600px] sm:max-h-[680px] overflow-hidden shadow-sm relative border border-slate-100 bg-white/40">
          
          {/* Top indicator bar with Language Switcher and Settings Toggle */}
          <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/40">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-slate-500">
                  {translations[language].clinicalEngine}
                </span>
              </div>
              
              {/* Elegant Inline Language Switcher */}
              <div className="flex items-center gap-1 bg-white border border-slate-150 rounded-full p-0.5 shadow-sm">
                {(["english", "hindi", "telugu"] as const).map((lang) => {
                  const labelMap = { english: "English", hindi: "हिन्दी", telugu: "తెలుగు" };
                  const isActive = language === lang;
                  return (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition active:scale-95 ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-550 hover:bg-slate-100"
                      }`}
                    >
                      {labelMap[lang]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {recognitionError && (
                <span className="text-[10px] font-bold text-red-500">
                  {recognitionError}
                </span>
              )}
              
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`px-3.5 py-1.5 rounded-full border text-[10px] font-bold cursor-pointer transition flex items-center gap-1.5 ${
                  isSettingsOpen
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-white border-slate-150 text-slate-650 hover:bg-slate-50"
                }`}
              >
                <span>⚙️</span> {translations[language].settingsHeader}
              </button>
            </div>
          </div>

          {/* Collapsible Vocal Settings Panel */}
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-b border-slate-100 bg-white/90 backdrop-blur-md"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                  
                  {/* Select Voice */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      {translations[language].voiceSelect}
                    </label>
                    <select
                      value={selectedVoiceName}
                      onChange={(e) => {
                        setSelectedVoiceName(e.target.value);
                        localStorage.setItem("medibuddy_assistant_voice", e.target.value);
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 cursor-pointer"
                    >
                      {voices.length === 0 ? (
                        <option>Default Voice</option>
                      ) : (
                        voices
                          .filter(v => {
                            const langMap: Record<string, string> = { english: "en", hindi: "hi", telugu: "te" };
                            const filterCode = langMap[language];
                            return v.lang.toLowerCase().includes(filterCode);
                          })
                          .map((voice) => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </option>
                          ))
                      )}
                    </select>
                  </div>

                  {/* Speed Rate Slider */}
                  <div className="md:col-span-3 space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        {translations[language].speakingSpeed}
                      </label>
                      <span className="text-[9px] font-bold text-emerald-600">
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
                        localStorage.setItem("medibuddy_assistant_rate", String(val));
                      }}
                      className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Volume Slider */}
                  <div className="md:col-span-2 space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        {translations[language].speakingVolume}
                      </label>
                      <span className="text-[9px] font-bold text-emerald-600">
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
                        localStorage.setItem("medibuddy_assistant_volume", String(val));
                      }}
                      className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                    />
                  </div>

                  {/* Mute Toggle and Preview */}
                  <div className="md:col-span-3 flex items-center gap-3">
                    {/* Mute Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !isMuted;
                        setIsMuted(nextVal);
                        localStorage.setItem("medibuddy_assistant_muted", String(nextVal));
                        if (nextVal) {
                          if (typeof window !== "undefined" && window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                          }
                        }
                      }}
                      className={`h-10 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer flex-1 border ${
                        isMuted
                          ? "bg-red-50 border-red-200 text-red-750"
                          : "bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-100"
                      }`}
                    >
                      <span>{isMuted ? "🔇" : "🔊"}</span>
                      <span className="truncate text-[10px]">{translations[language].muteToggle}</span>
                    </button>

                    {/* Test Button */}
                    <button
                      type="button"
                      onClick={playVoicePreview}
                      disabled={isTestSpeaking || isMuted}
                      className={`h-10 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer flex-1 border ${
                        isTestSpeaking || isMuted
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                          : "bg-emerald-50 border-emerald-100 text-emerald-800 hover:bg-emerald-100/50"
                      }`}
                    >
                      <span>{isTestSpeaking ? "..." : "▶️"}</span>
                      <span className="truncate text-[10px]">Test</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth bg-slate-50/10">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-4 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      isUser
                        ? "bg-slate-100 text-slate-655 border border-slate-200/50"
                        : "bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold"
                    }`}
                  >
                    {isUser ? "👤" : "🩺"}
                  </div>

                  <div className="max-w-[78%] space-y-2">
                    <div
                      className={`p-6 rounded-[2rem] border relative group text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? "bg-slate-900 text-white border-slate-950 rounded-tr-none"
                          : "bg-white text-slate-800 border-slate-100 rounded-tl-none"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm space-y-2">
                        {message.content.split("\n").map((line, idx) => {
                          if (line.startsWith("### ")) {
                            return <h3 key={idx} className="font-extrabold text-base pt-2 mb-1 text-slate-900">{line.replace("### ", "")}</h3>;
                          }
                          if (line.startsWith("#### ")) {
                            return <h4 key={idx} className="font-bold text-sm text-emerald-600 pt-1.5">{line.replace("#### ", "")}</h4>;
                          }
                          if (line.startsWith("* ")) {
                            return <li key={idx} className="list-disc pl-2 ml-4 text-slate-550">{line.replace("* ", "")}</li>;
                          }
                          if (line.startsWith("1. ")) {
                            return <li key={idx} className="list-decimal pl-2 ml-4 text-slate-550 font-semibold">{line.replace("1. ", "")}</li>;
                          }
                          return <p key={idx}>{line}</p>;
                        })}
                      </div>

                      {!isUser && (
                        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleSpeak(message.content, message.id)}
                            className={`w-6 h-6 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition ${
                              message.isSpeaking ? "ring-2 ring-emerald-500/20" : ""
                            }`}
                            title={message.isSpeaking ? "Mute" : "Listen aloud"}
                          >
                            {message.isSpeaking ? (
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {message.isMock && (
                      <span className="text-[10px] text-slate-400 pl-4 block italic font-medium">
                        {language === "hindi" ? "स्थानीय अनुकरण परामर्श" : language === "telugu" ? "స్థానిక అనుకరణ సంప్రదింపులు" : "Local emulated consultation"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                  🩺
                </div>
                <div className="p-4 rounded-[1.75rem] rounded-tl-none bg-white border border-slate-100 flex items-center gap-1 min-w-[65px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Suggested symptoms chips */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-6 py-4 bg-slate-50/40 border-t border-slate-100 flex flex-wrap gap-2.5">
              <span className="text-[10px] font-extrabold text-slate-400 w-full mb-1 uppercase tracking-wider">
                {translations[language].quickSymptomsHeader}
              </span>
              {translations[language].quickSymptoms.map((qs, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qs.text)}
                  className="px-4.5 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-655 cursor-pointer shadow-sm active:scale-98 transition"
                >
                  {qs.title}
                </button>
              ))}
            </div>
          )}

          {/* Floating Input Field Panel */}
          <div className="p-4 bg-white border-t border-slate-100 flex gap-3 items-center">
            {/* Mic Toggle */}
            <button
              onClick={handleMicToggle}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition cursor-pointer shrink-0 ${
                isListening
                  ? "bg-red-50 hover:bg-red-100 text-red-655 border border-red-100 ring-2 ring-red-100"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
              }`}
              title={isListening ? "Listening..." : "Dictate speech"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Input bar / Audio soundwave */}
            {isListening ? (
              <div className="flex-1 h-12 px-5 rounded-full border border-red-100 bg-red-50/20 flex items-center justify-between">
                <span className="text-red-700 text-xs font-bold animate-pulse">
                  {translations[language].listening}
                </span>
                
                {/* Animated soundwave bars */}
                <div className="flex items-center gap-0.75 h-4 pr-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => {
                    const delay = (idx % 4) * 0.15;
                    const duration = 0.6 + (idx % 3) * 0.15;
                    return (
                      <div
                        key={idx}
                        className="w-0.75 h-full bg-red-500 rounded-full animate-bar-wave"
                        style={{
                          animation: `barWave ${duration}s ease-in-out infinite`,
                          animationDelay: `${delay}s`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={translations[language].placeholder}
                disabled={isLoading}
                className="flex-1 h-12 px-5 rounded-full border border-slate-200 bg-slate-50/50 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition disabled:opacity-50"
              />
            )}

            {/* Circular Send */}
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!input.trim() && !isListening)}
              className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-850 text-white flex items-center justify-center shadow-sm active:scale-98 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shrink-0"
            >
              <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
