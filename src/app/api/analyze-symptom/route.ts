import { NextResponse } from "next/server";
import OpenAI from "openai";

const API_KEY = process.env.NVIDIA_API_KEY || process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY || "";
const BASE_URL = process.env.AI_API_BASE_URL || "https://integrate.api.nvidia.com/v1";
const MODEL_NAME = process.env.AI_MODEL_NAME || "moonshotai/kimi-k2.6" || "meta/llama-3-8b-instruct";

const MOCK_RESPONSES: Record<string, Record<string, { possible_conditions: string[], recommendations: string[], warning_signs: string[], disclaimer: string }>> = {
  english: {
    fever_headache: {
      possible_conditions: ["Viral Syndrome", "Early Flu", "Mild Dehydration"],
      recommendations: [
        "Take plenty of bed rest to conserve energy.",
        "Stay hydrated by drinking water, ORS, or warm broths.",
        "Monitor your body temperature regularly.",
        "Consider over-the-counter paracetamol for fever control (follow dosage limits)."
      ],
      warning_signs: [
        "Fever exceeding 103°F (39.4°C) or lasting more than 3 days.",
        "Stiff neck, confusion, or extreme drowsiness.",
        "Severe chest pain or difficulty breathing."
      ],
      disclaimer: "⚠️ Disclaimer: This is not a professional medical diagnosis. Please consult a licensed medical professional for proper advice."
    },
    cough_throat: {
      possible_conditions: ["Upper Respiratory Infection", "Common Cold", "Mild Bronchitis"],
      recommendations: [
        "Gargle with warm salt water 3-4 times a day.",
        "Use a cool-mist humidifier or take steam inhalation.",
        "Soothe your throat with warm honey-lemon tea (avoid honey for children under 1 year)."
      ],
      warning_signs: [
        "Difficulty breathing or swallowing saliva.",
        "Coughing up blood or rust-colored phlegm.",
        "High fever that does not respond to medication."
      ],
      disclaimer: "⚠️ Disclaimer: This is not a professional medical diagnosis. Please consult a licensed medical professional for proper advice."
    },
    stomach_nausea: {
      possible_conditions: ["Gastroenteritis", "Food Poisoning", "Mild Indigestion (Gastritis)"],
      recommendations: [
        "Rest your stomach; avoid solid foods for a few hours after vomiting.",
        "Rehydrate with small, frequent sips of water or electrolyte solutions.",
        "Stick to the BRAT diet (Bananas, Rice, Applesauce, Toast) when starting solids.",
        "Avoid dairy, caffeine, alcohol, and spicy foods."
      ],
      warning_signs: [
        "Signs of severe dehydration (extreme thirst, dry mouth, little to no urination).",
        "Blood in vomit or stool.",
        "Severe, localized abdominal pain."
      ],
      disclaimer: "⚠️ Disclaimer: This is not a professional medical diagnosis. Please consult a licensed medical professional for proper advice."
    },
    generic: {
      possible_conditions: ["Transient Fatigue Response", "Early Immune Response", "Environmental Factors"],
      recommendations: [
        "Ensure 7-8 hours of sound sleep.",
        "Drink 8-10 glasses of pure water daily.",
        "Consume fresh, vitamin-rich fruits and vegetables.",
        "Keep a log of symptoms, noting their timing and severity."
      ],
      warning_signs: [
        "Symptoms persisting beyond 48-72 hours.",
        "Sudden chest pain, difficulty breathing, or severe weakness."
      ],
      disclaimer: "⚠️ Disclaimer: This is not a professional medical diagnosis. Please consult a licensed medical professional for proper advice."
    }
  },
  hindi: {
    fever_headache: {
      possible_conditions: ["वायरल सिंड्रोम", "प्रारंभिक फ्लू", "हल्का निर्जलीकरण"],
      recommendations: [
        "ऊर्जा बचाने के लिए पर्याप्त आराम करें।",
        "पानी, ओआरएस या गर्म सूप पीकर हाइड्रेटेड रहें।",
        "नियमित रूप से अपने शरीर के तापमान की निगरानी करें।",
        "बुखार और सिरदर्द नियंत्रण के लिए पेरासिटामोल लेने पर विचार करें (खुराक सीमा का ध्यान रखें)।"
      ],
      warning_signs: [
        "बुखार 103°F (39.4°C) से अधिक होना या 3 दिनों से अधिक समय तक रहना।",
        "गर्दन में अकड़न, भ्रम, या अत्यधिक सुस्ती।",
        "सीने में तेज दर्द या सांस लेने में कठिनाई।"
      ],
      disclaimer: "⚠️ चेतावनी: यह कोई पेशेवर चिकित्सा निदान नहीं है। उचित सलाह के लिए कृपया किसी लाइसेंस प्राप्त चिकित्सा पेशेवर से परामर्श लें।"
    },
    cough_throat: {
      possible_conditions: ["ऊपरी श्वसन संक्रमण", "सामान्य सर्दी", "हल्का ब्रोंकाइटिस"],
      recommendations: [
        "दिन में 3-4 बार गुनगुने नमक के पानी से गरारे करें।",
        "ह्यूमिडिफायर का उपयोग करें या भाप लें।",
        "गले को आराम देने के लिए गुनगुना शहद-नींबू पानी या सूप पिएं।"
      ],
      warning_signs: [
        "सांस लेने या लार निगलने में कठिनाई होना।",
        "खांसी में खून आना।",
        "दवा के बाद भी बुखार कम न होना।"
      ],
      disclaimer: "⚠️ चेतावनी: यह कोई पेशेवर चिकित्सा निदान नहीं है। उचित सलाह के लिए कृपया किसी लाइसेंस प्राप्त चिकित्सा पेशेवर से परामर्श लें।"
    },
    stomach_nausea: {
      possible_conditions: ["गैस्ट्रोएंटेराइटिस", "फूड पॉइजनिंग", "हल्का अपच (गैस्ट्राइटिस)"],
      recommendations: [
        "पेट को आराम दें; उल्टी के बाद कुछ घंटों तक ठोस भोजन से बचें।",
        "पानी या इलेक्ट्रोलाइट्स की छोटी-छोटी घूंट लेकर रीहाइड्रेट करें।",
        "ठोस भोजन शुरू करते समय बीआरएटी (केला, चावल, सेब की चटनी, टोस्ट) आहार लें।",
        "डेयरी, कैफीन, शराब और मसालेदार भोजन से बचें।"
      ],
      warning_signs: [
        "गंभीर निर्जलीकरण के लक्षण (अत्यधिक प्यास, मुंह सूखना, पेशाब न आना)।",
        "उल्टी या मल में खून आना।",
        "पेट में गंभीर, असहनीय दर्द।"
      ],
      disclaimer: "⚠️ चेतावनी: यह कोई पेशेवर चिकित्सा निदान नहीं है। उचित सलाह के लिए कृपया किसी लाइसेंस प्राप्त चिकित्सा पेशेवर से परामर्श लें।"
    },
    generic: {
      possible_conditions: ["अस्थायी थकान प्रतिक्रिया", "प्रारंभिक प्रतिरक्षा प्रतिक्रिया", "पर्यावरणीय कारक"],
      recommendations: [
        "7-8 घंटे की गहरी नींद लें।",
        "रोजाना 8-10 गिलास साफ पानी पिएं।",
        "ताजे फल और सब्जियों का सेवन करें।",
        "लक्षणों की समय और तीव्रता की निगरानी करें।"
      ],
      warning_signs: [
        "लक्षण 48-72 घंटों से अधिक समय तक बने रहना।",
        "सीने में अचानक दर्द, सांस लेने में कठिनाई, या गंभीर कमजोरी होना।"
      ],
      disclaimer: "⚠️ चेतावनी: यह कोई पेशेवर चिकित्सा निदान नहीं है। उचित सलाह के लिए कृपया किसी लाइसेंस प्राप्त चिकित्सा पेशेवर से परामर्श लें।"
    }
  },
  telugu: {
    fever_headache: {
      possible_conditions: ["వైరల్ సిండ్రోమ్", "ప్రారంభ ఫ్లూ", "తేలికపాటి డీహైడ్రేషన్"],
      recommendations: [
        "శరీర శక్తిని కాపాడుకోవడానికి తగినంత విశ్రాంతి తీసుకోండి.",
        "నీరు, ఓఆర్ఎస్ లేదా గోరువెచ్చని సూప్‌లు తాగుతూ హైడ్రేటెడ్‌గా ఉండండి.",
        "మీ ఉష్ణోగ్రతను క్రమం తప్పకుండా పర్యవేక్షించండి.",
        "జ్వరం నివారణకు పారాసెటమాల్ వాడటాన్ని పరిశీలించండి (మోతాదు జాగ్రత్తగా గమనించండి)."
      ],
      warning_signs: [
        "జ్వరం 103°F (39.4°C) దాటినా లేదా 3 రోజుల కంటే ఎక్కువ కాలం ఉన్నా.",
        "మెడ బిగుసుకుపోవడం, గందరగోళం, లేదా తీవ్రమైన మగత.",
        "తీవ్రమైన ఛాతి నొప్పి లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది."
      ],
      disclaimer: "⚠️ హెచ్చరిక: ఇది వృత్తిపరమైన వైద్య నిర్ధారణ కాదు. దయచేసి సరైన సలహా కోసం లైసెన్స్ పొందిన వైద్య నిపుణుడిని సంప్రదించండి."
    },
    cough_throat: {
      possible_conditions: ["ఎగువ శ్వాసకోశ ఇన్ఫెక్షన్", "సాధారణ జలుబు", "తేలికపాటి బ్రోన్కైటిస్"],
      recommendations: [
        "రోజుకు 3-4 సార్లు గోరువెచ్చని ఉప్పునీటితో గార్గ్లింగ్ చేయండి.",
        "ఆవిరి పట్టడం లేదా హ్యూమిడిఫైయర్ ఉపయోగించండి.",
        "గొంతు ఉపశమనానికి తేనె-నిమ్మకాయ నీరు లేదా సూప్ తీసుకోండి."
      ],
      warning_signs: [
        "శ్వాస తీసుకోవడం లేదా ఉమ్మి మింగడం కష్టంగా మారడం.",
        "దగ్గినప్పుడు రక్తం పడటం.",
        "మందులు వేసుకున్నా జ్వరం తగ్గకపోవడం."
      ],
      disclaimer: "⚠️ హెచ్చరిక: ఇది వృత్తిపరమైన వైద్య నిర్ధారణ కాదు. దయచేసి సరైన సలహా కోసం లైసెన్స్ పొందిన వైద్య నిపుణుడిని సంప్రదించండి."
    },
    stomach_nausea: {
      possible_conditions: ["గ్యాస్ట్రోఎంటరైటిస్", "ఫుడ్ పాయిజనింగ్", "తేలికపాటి అజీర్ణం (గ్యాస్ట్రైటిస్)"],
      recommendations: [
        "పొట్టకు విశ్రాంతి ఇవ్వండి; వాంతులు అయిన తర్వాత కొద్దిసేపు ఘనాహారం నివారించండి.",
        "నీరు లేదా ఎలక్ట్రోలైట్ ద్రవాలను కొద్దికొద్దిగా తాగుతూ డీహైడ్రేషన్ నివారించండి.",
        "ఘనాహారం మొదలుపెట్టినప్పుడు BRAT (అరటిపండ్లు, అన్నం, ఆపిల్ సాస్, టోస్ట్) తీసుకోండి.",
        "పాలు/డైరీ ఉత్పత్తులు, కేఫీన్, మద్యం మరియు కారం పదార్థాలను నివారించండి."
      ],
      warning_signs: [
        "తీవ్రమైన డీహైడ్రేషన్ గుర్తులు (నోరు ఎండిపోవడం, మూత్రం రాకపోవడం, తల తిరగడం).",
        "వాంతి లేదా మలంలో రక్తం పడటం.",
        "కడుపులో విపరీతమైన, భరించలేని నొప్పి."
      ],
      disclaimer: "⚠️ హెచ్చరిక: ఇది వృత్తిపరమైన వైద్య నిర్ధారణ కాదు. దయచేసి సరైన సలహా కోసం లైసెన్స్ పొందిన వైద్య నిపుణుడిని సంప్రదించండి."
    },
    generic: {
      possible_conditions: ["శారీరక అలసట", "ప్రారంభ నిరోధక ప్రతిస్పందన", "వాతావరణ మార్పులు"],
      recommendations: [
        "కనీసం 7-8 గంటలు పడుకోండి.",
        "రోజుకు కనీసం 8-10 గ్లాసుల స్వచ్ఛమైన నీరు తాగండి.",
        "తాజా పండ్లు మరియు కూరగాయలు ఎక్కువగా తీసుకోండి.",
        "లక్షణాల తీవ్రతను గమనిస్తూ రికార్ड చేయండి."
      ],
      warning_signs: [
        "లక్షణాలు 48-72 గంటల కంటే ఎక్కువ కాలం ఉండటం.",
        "ఛాతి నొప్పి, శ్వాస ఇబ్బంది, లేదా తీవ్రమైన బలహీనత అకస్మాత్తుగా రావడం."
      ],
      disclaimer: "⚠️ హెచ్చరిక: ఇది వృత్తిపరమైన వైద్య నిర్ధారణ కాదు. దయచేసి సరైన సలహా కోసం లైసెన్స్ పొందిన వైద్య నిపుణుడిని సంప్రదించండి."
    }
  }
};

function getMockSymptomResponse(query: string, language: string): string {
  const q = query.toLowerCase();
  const lang = (language || "english").toLowerCase();
  const langSet = MOCK_RESPONSES[lang] || MOCK_RESPONSES.english;
  
  let key = "generic";
  if (q.includes("headache") || q.includes("fever") || q.includes("temperature") || q.includes("सर") || q.includes("बुखार") || q.includes("सिर") || q.includes("జ్వరం") || q.includes("నొప్పి") || q.includes("వేడి")) {
    key = "fever_headache";
  } else if (q.includes("cough") || q.includes("throat") || q.includes("cold") || q.includes("खांसी") || q.includes("गला") || q.includes("जुकाम") || q.includes("దగ్గు") || q.includes("గొంతు") || q.includes("జలుబు")) {
    key = "cough_throat";
  } else if (q.includes("stomach") || q.includes("nausea") || q.includes("vomit") || q.includes("diarrhea") || q.includes("पेट") || q.includes("उल्टी") || q.includes("दस्त") || q.includes("కడుపు") || q.includes("వాంతులు") || q.includes("విరేచనాలు")) {
    key = "stomach_nausea";
  }

  const responseObj = langSet[key] || langSet.generic;
  return JSON.stringify(responseObj);
}

export async function POST(request: Request) {
  try {
    const { messages, language = "english" } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid conversation history received" }, { status: 400 });
    }

    const latestUserMessage = messages[messages.length - 1]?.content || "";
    const activeLang = String(language).toLowerCase();

    // If API Key is missing, trigger the premium high-fidelity demo fallback
    if (!API_KEY) {
      console.log(`⚠️ No AI API Key found. Returning optimized structured JSON response in: ${activeLang}`);
      
      const responseText = getMockSymptomResponse(latestUserMessage, activeLang);
      
      // Artificial delay to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return NextResponse.json({
        content: responseText,
        isMock: true,
        disclaimer: activeLang === "hindi" 
          ? "डेमो मोड: मेडीबडी क्लिनिकल ट्राइएज एमुलेटर के माध्यम से गणना की गई।" 
          : activeLang === "telugu"
          ? "డెమో మోడ్: మెడిబడ్డీ క్లినికల్ ట్రియాజ్ ఎమ్యులేటర్ ద్వారా లెక్కించబడింది."
          : "Demo Mode: Computed via MediBuddy clinical triage emulator."
      }, { status: 200 });
    }

    const openai = new OpenAI({
      apiKey: API_KEY,
      baseURL: BASE_URL,
    });

    const activeLanguageText = activeLang === "hindi" ? "Hindi (हिन्दी)" : activeLang === "telugu" ? "Telugu (తెలుగు)" : "Indian English (en-IN)";
    
    // Strict JSON System Prompt to prevent prompt leakage
    const activePrompt = `You are MediBuddy AI, a professional, premium AI Healthcare Companion. 
Analyze the user's symptoms and return EXACTLY a single stringified JSON object matching the requested structure. Keep all description elements short (1-2 sentences max) to minimize response size. No markdown wrappers.

Language Instruction:
All text values inside the JSON parameters (possible_conditions, recommendations, warning_signs, disclaimer) must be written entirely in: ${activeLanguageText}.
The JSON dictionary keys MUST remain exactly in English: "possible_conditions", "recommendations", "warning_signs", "disclaimer".

JSON Structure:
{
  "possible_conditions": [
    "Condition Name in selected language"
  ],
  "recommendations": [
    "Care/recommendation tip in selected language"
  ],
  "warning_signs": [
    "Critical warning/red-flag sign in selected language"
  ],
  "disclaimer": "Verbatim warning disclaimer in selected language"
}

Important:
Do NOT output any markdown tags (like \`\`\`json). Do NOT output any system prompt text or meta explanations like 'Here is the response:' or 'I will now provide a concise answer...'. Only output the raw stringified JSON.`;

    // Filter out previous system messages to prevent system instructions from leaking in conversation context
    const cleanUserMessages = messages
      .filter((m: any) => m.role !== "system" && !m.content.includes("possible_conditions")) // strip system prompt details
      .map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content
      }));

    const formattedMessages = [
      { role: "system", content: activePrompt },
      ...cleanUserMessages
    ];

    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: formattedMessages as any,
      max_tokens: 350, // Reduced token limits to increase speed
      temperature: 0.1
    });

    const aiContent = response.choices[0]?.message?.content?.trim() || "";
    
    // Verify JSON parsing correctness
    try {
      const cleanJsonString = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
      JSON.parse(cleanJsonString); // Verify parsing
      return NextResponse.json({ content: cleanJsonString }, { status: 200 });
    } catch (parseError) {
      console.warn("⚠️ Failed to parse JSON from AI model response. Returning fallback representation.", aiContent);
      // Fallback response matching the correct schema
      const fallbackObj = MOCK_RESPONSES[activeLang] || MOCK_RESPONSES.english;
      return NextResponse.json({ content: JSON.stringify(fallbackObj.generic) }, { status: 200 });
    }
  } catch (error: any) {
    console.error("🔴 AI Symptom Analyzer API error:", error);
    return NextResponse.json({ 
      error: "Unable to analyze symptoms at the moment. Please try again.",
      message: error?.message || "Internal server error" 
    }, { status: 500 });
  }
}
