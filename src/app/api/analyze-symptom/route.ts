import { NextResponse } from "next/server";
import OpenAI from "openai";

const API_KEY = process.env.NVIDIA_API_KEY || process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY || "";
const BASE_URL = process.env.AI_API_BASE_URL || "https://integrate.api.nvidia.com/v1";
const MODEL_NAME = process.env.AI_MODEL_NAME || "moonshotai/kimi-k2.6" || "meta/llama-3-8b-instruct";

// High fidelity keyword-based local medical triage generator
function getMockSymptomResponse(query: string, language: string): string {
  const q = query.toLowerCase();
  const lang = (language || "english").toLowerCase();
  
  if (lang === "hindi") {
    if (q.includes("headache") || q.includes("fever") || q.includes("temperature") || q.includes("सर") || q.includes("बुखार") || q.includes("तापमान") || q.includes("सिर")) {
      return `### 🩺 प्रारंभिक मूल्यांकन: वायरल सिंड्रोम / प्रारंभिक फ्लू
आपके द्वारा बताए गए **सिरदर्द** और **बुखार** के लक्षणों के आधार पर, यह वायरल संक्रमण की ओर इशारा करता है, जैसे कि फ्लू या वायरल बुखार।

#### 💡 संभावित स्थितियां:
1. **इन्फ्लुएंजा (फ्लू):** शरीर में दर्द, ठंड लगना, और थकान के साथ।
2. **सामान्य सर्दी / वायरल बुखार:** आम रोगजनकों के प्रति सामान्य शारीरिक प्रतिक्रिया।
3. **हल्का निर्जलीकरण (Dehydration):** इससे सिरदर्द बढ़ सकता है और तापमान बढ़ सकता है।

#### ⚠️ बुनियादी सावधानियां और देखभाल:
*   **आराम:** बिस्तर पर आराम करें और शारीरिक परिश्रम से बचें। शरीर को संक्रमण से लड़ने के लिए ऊर्जा की आवश्यकता होती है।
*   **बुखार नियंत्रण:** पेरासिटामोल या इबुप्रोफेन जैसी दवाएं बुखार और सिरदर्द को कम करने में मदद कर सकती हैं। *खुराक सीमा का ध्यान रखें।*
*   **दूरी बनाएं:** दूसरों में संक्रमण फैलने से रोकने के लिए दूरी बनाए रखें।

#### 💧 जलयोजन और पोषण सुझाव:
*   **तरल पदार्थ:** पर्याप्त मात्रा में गुनगुना पानी, ओआरएस (ORS), या हर्बल चाय पिएं। प्रतिदिन 2.5 से 3 लीटर तरल पदार्थ का लक्ष्य रखें।
*   **आहार:** हल्का और आसानी से पचने वाला भोजन करें (जैसे सूप, खिचड़ी, दलिया)।

#### 🚨 महत्वपूर्ण सुरक्षा सिफारिश:
*यह पेशेवर चिकित्सा निदान नहीं है। हमेशा चिकित्सक से सलाह लें।*
**कृपया तुरंत डॉक्टर से संपर्क करें** यदि बुखार 103°F (39.4°C) से अधिक हो जाता है, 3 दिनों से अधिक रहता है, या निम्नलिखित लक्षण विकसित होते हैं:
*   गर्दन में अकड़न
*   सीने में तेज दर्द या सांस लेने में कठिनाई
*   भ्रम या अत्यधिक तंद्रा (नींद आना)।`;
    }
    
    if (q.includes("cough") || q.includes("throat") || q.includes("cold") || q.includes("खांसी") || q.includes("गला") || q.includes("जुकाम") || q.includes("खराश")) {
      return `### 🩺 प्रारंभिक मूल्यांकन: ऊपरी श्वसन संक्रमण / ब्रोंकाइटिस
आपके द्वारा बताए गए **खांसी या गले में खराश** के लक्षण ऊपरी श्वास नली में सूजन या जलन का संकेत देते हैं, जो आमतौर पर वायरल संक्रमण या एलर्जी के कारण होता है।

#### 💡 संभावित स्थितियां:
1. **एक्यूट ग्रसनीशोथ (गले में खराश):** अक्सर वायरल होता है, कभी-कभी बैक्टीरियल।
2. **सामान्य सर्दी:** नाक बंद होना, गले में खराश और खांसी का कारण।
3. **एक्यूट ब्रोंकाइटिस:** ब्रोन्कियल नलियों में सूजन, जो अक्सर सर्दी के बाद होती है।

#### ⚠️ बुनियादी सावधानियां और देखभाल:
*   **गुनगुने पानी से गरारे:** दिन में 3-4 बार गुनगुने नमक के पानी से गरारे करें। इससे गले की सूजन और दर्द कम होता है।
*   **भाप लेना:** श्वास नलियों को शांत करने के लिए भाप लें या ह्यूमिडिफायर का उपयोग करें।
*   **उत्तेजक पदार्थों से बचें:** तंबाकू के धुएं, ठंडी हवा और धूल से दूर रहें।

#### 💧 जलयोजन और पोषण सुझाव:
*   **गले को राहत:** गुनगुना शहद-नींबू पानी या सूप पिएं। शहद प्राकृतिक रूप से खांसी को शांत करता है।
*   **हाइड्रेट रहें:** बलगम को पतला करने के लिए लगातार गुनगुना पानी पीते रहें।

#### 🚨 महत्वपूर्ण सुरक्षा सिफारिश:
*यह पेशेवर चिकित्सा निदान नहीं है। हमेशा चिकित्सक से सलाह लें।*
**कृपया तुरंत डॉक्टर से संपर्क करें** यदि आपको:
*   सांस लेने या लार निगलने में कठिनाई हो
*   खांसी में खून आए
*   लगातार तेज बुखार रहे।`;
    }
    
    if (q.includes("stomach") || q.includes("nausea") || q.includes("vomit") || q.includes("diarrhea") || q.includes("पेट") || q.includes("उल्टी") || q.includes("दस्त") || q.includes("दर्द")) {
      return `### 🩺 प्रारंभिक मूल्यांकन: गैस्ट्रोएंटेराइटिस / अपच
आपके पेट के लक्षण पेट या आंतों की परत में जलन का संकेत देते हैं, जो हल्के फूड पॉइजनिंग, पेट के वायरस या मसालेदार भोजन के कारण हो सकता है।

#### 💡 संभावित स्थितियां:
1. **वायरल गैस्ट्रोएंटेराइटिस:** अत्यधिक संक्रामक पेट का वायरस।
2. **फूड पॉइजनिंग:** दूषित भोजन या पानी के सेवन से।
3. **हल्का अपच (गैस्ट्राइटिस):** मसालेदार भोजन या तनाव के कारण पेट में जलन।

#### ⚠️ बुनियादी सावधानियां और देखभाल:
*   **पेट को आराम:** उल्टी होने के बाद कुछ घंटों तक ठोस भोजन न करें, पेट को शांत होने दें।
*   **परहेज करें:** डेयरी उत्पाद, कैफीन, मसालेदार, या बहुत वसायुक्त भोजन से बचें।
*   **दवाएं:** बिना डॉक्टर की सलाह के दस्त रोकने की दवाएं न लें, क्योंकि यह संक्रमण को अंदर रोक सकती हैं।

#### 💧 जलयोजन और पोषण सुझाव:
*   **जलयोजन:** पानी, ओआरएस या पतले सूप की छोटी-छोटी घूंट लें। एक बार में ज्यादा पीने से उल्टी हो सकती है।
*   **बीआरएटी आहार:** जब ठोस भोजन शुरू करें, तो हल्का भोजन लें: केला, चावल, सेब की चटनी, और टोस्ट (BRAT)।

#### 🚨 महत्वपूर्ण सुरक्षा सिफारिश:
*यह पेशेवर चिकित्सा निदान नहीं है। हमेशा चिकित्सक से सलाह लें।*
**कृपया तुरंत डॉक्टर से संपर्क करें** यदि:
*   गंभीर निर्जलीकरण के लक्षण हों (अत्यधिक प्यास, मुंह सूखना, पेशाब न आना या चक्कर आना)
*   उल्टी या मल में खून आए
*   पेट में तेज, असहनीय दर्द हो।`;
    }
    
    return `### 🩺 प्रारंभिक मूल्यांकन: सामान्य स्वास्थ्य परामर्श
आपके लक्षणों का विवरण: *"#QUERY#"* साझा करने के लिए धन्यवाद। यद्यपि ये लक्षण मामूली स्वास्थ्य समस्याओं से जुड़े हो सकते हैं, सटीक मूल्यांकन के लिए डॉक्टर का परामर्श आवश्यक है।

#### 💡 संभावित स्थितियां:
1. **अस्थायी थकान प्रतिक्रिया:** शारीरिक थकान जो शारीरिक लक्षणों के रूप में प्रकट होती है।
2. **प्रारंभिक प्रतिरक्षा प्रतिक्रिया:** शरीर की मामूली रोगजनकों के प्रति हल्की प्रतिक्रिया।
3. **पर्यावरणीय कारक:** नींद, मौसम, पानी या खान-पान में बदलाव।

#### ⚠️ बुनियादी सावधानियां और देखभाल:
*   **पर्याप्त नींद:** शरीर की रिकवरी के लिए 7-8 घंटे की गहरी नींद लें।
*   **निगरानी:** लक्षणों के समय और तीव्रता का रिकॉर्ड रखें।

#### 💧 जलयोजन और पोषण सुझाव:
*   **जलयोजन:** दिन भर में कम से कम 8-10 गिलास साफ पानी पिएं।
*   **स्वच्छ आहार:** ताजे फल और सब्जियों का सेवन करें।

#### 🚨 महत्वपूर्ण सुरक्षा सिफारिश:
*यह पेशेवर चिकित्सा निदान नहीं है। हमेशा चिकित्सक से सलाह लें।*
**कृपया डॉक्टर से संपर्क करें** यदि लक्षण 48-72 घंटों से अधिक समय तक बने रहते हैं या बिगड़ जाते हैं।`;
  }
  
  if (lang === "telugu") {
    if (q.includes("headache") || q.includes("fever") || q.includes("temperature") || q.includes("తల") || q.includes("జ్వరం") || q.includes("వేడి") || q.includes("నొప్పి")) {
      return `### 🩺 ప్రాథమిక అంచనా: వైరల్ సిండ్రోమ్ / ప్రారంభ ఫ్లూ
మీరు నివేదించిన **తలనొప్పి** మరియు **జ్వరం** ఆధారంగా, ఈ లక్షణాలు సాధారణంగా వైరల్ ఇన్ఫెక్షన్ లేదా ప్రారంభ ఫ్లూని సూచిస్తాయి.

#### 💡 సాధ్యమయ్యే పరిస్థితులు:
1. **ఇన్ఫ్లుఎంజా (ఫ్లూ):** ఒంటి నొప్పులు, చలి మరియు అలసటతో కూడి ఉంటుంది.
2. **సాధారణ జ్వరం:** వైరల్ క్రిములకు వ్యతిరేకంగా शरीरం యొక్క సాధారణ ప్రతిస్పందన.
3. **తేలికపాటి డీహైడ్రేషన్:** ఇది తలనొప్పిని పెంచడమే కాకుండా శరీర వేడిని కూడా పెంచుతుంది.

#### ⚠️ ప్రాథమిక జాగ్రత్తలు & సంరక్షణ:
*   **విశ్రాంతి:** బెడ్ రెస్ట్ తీసుకోండి మరియు శారీరక శ్రమను నివారించండి. ఇన్ఫెక్షన్‌తో పోరాడటానికి శరీరానికి శక్తి అవసరం.
*   **జ్వరం నియంత్రణ:** పారాసెటమాల్ లేదా ఐబుప్రోఫెన్ వంటి మందులు జ్వరం మరియు తలనొప్పి నుండి ఉపశమనం ఇస్తాయి. *మోతాదు జాగ్రత్తగా గమనించండి.*
*   **దూరం పాటించండి:** ఇతరులకు ఇన్ఫెక్షన్ వ్యాపించకుండా దూరం పాటించండి.

#### 💧 హైడ్రేషన్ & పోషకాహార సూచనలు:
*   **ద్రవపదార్థాలు:** గోరువెచ్చని నీరు, ఓఆర్ఎస్ (ORS), లేదా హెర్బల్ టీలు తగినంత తాగండి. రోజుకు 2.5 నుండి 3 లీటర్ల ద్రవాలు తాగడం మంచిది.
*   **ఆహారం:** తేలికగా అరిగే ఆహారాన్ని తీసుకోండి (ఉదా. జావ, కషాయం, సూప్, అరటిపండు).

#### 🚨 కీలక రక్షణ సిఫార్సు:
*ఇది వృత్తిపరమైన వైద్య నిర్ధారణ కాదు. ఎల్లప్పుడూ వైద్యుడిని సంప్రదించండి.*
**దయచేసి వెంటనే వైద్యుడిని సంప్రదించండి** ఒకవేళ మీ జ్వరం 103°F (39.4°C) దాటినా, 3 రోజుల కంటే ఎక్కువ కాలం ఉన్నా, లేదా ఈ క్రింది తీవ్రమైన లక్షణాలు కనిపించినా:
*   మెడ బిగుసుకుపోవడం
*   తీవ్రమైన ఛాతి నొప్పి లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది
*   తీవ్రమైన తలతిరగడం లేదా మగతగా ఉండటం.`;
    }
    
    if (q.includes("cough") || q.includes("throat") || q.includes("cold") || q.includes("దగ్గు") || q.includes("గొంతు") || q.includes("జలుబు") || q.includes("మంట")) {
      return `### 🩺 ప్రాథమిక అంచనా: ఎగువ శ్వాసకోశ ఇన్ఫెక్షన్ / బ్రోన్కైటిస్
మీరు నివేదించిన **దగ్గు లేదా గొంతు నొప్పి** మీ శ్వాసనాళాలలో వాపు లేదా చికాకును సూచిస్తుంది. ఇది సాధారణంగా వైరస్ లేదా అలర్జీల వల్ల వస్తుంది.

#### 💡 సాధ్యమయ్యే పరిస్థితులు:
1. **అక్యూట్ ఫారింజైటిస్ (గొంతు నొప్పి):** ఎక్కువగా వైరల్, అరుదుగా బ్యాక్టీరియల్ (స్ట్రెప్ గొంతు).
2. **సాధారణ జలుబు:** గొంతులో మంట, దగ్గు మరియు ముక్కు దిబ్బడ కలిగించే వైరస్.
3. **అక్యూట్ బ్రోన్కైటిస్:** శ్వాస నాళాల వాపు, ఇది సాధారణంగా జలుబు తర్వాత వస్తుంది.

#### ⚠️ ప్రాథమిక జాగ్రత్తలు & సంరక్షణ:
*   **గోరువెచ్చని ఉప్పునీటి గార్గ్లింగ్:** రోజుకు 3-4 సార్లు గోరువెచ్చని ఉప్పునీటితో గొంతును శుభ్రం చేసుకోండి. ఇది గొంతు నొప్పి మరియు వాపును తగ్గిస్తుంది.
*   **ఆవిరి పట్టడం:** శ్వాసనాళాలను ఉపశమింపజేయడానికి ఆవిరి పట్టడం మంచిది.
*   **చికాకులు నివారించండి:** పొగమంచు, ధూళి, మరియు చల్లటి గాలికి దూరంగా ఉండండి.

#### 💧 హైడ్రేషన్ & పోషకాహార సూచనలు:
*   **గొంతు ఉపశమనం:** గోరువెచ్చని తేనె-నిమ్మకాయ నీరు లేదా సూప్ తాగండి. తేనె దగ్గును అద్భుతంగా తగ్గిస్తుంది.
*   **హైడ్రేట్ గా ఉండండి:** కఫాన్ని కరిగించడానికి నిరంతరం గోరువెచ్చని నీరు తాగుతూ ఉండండి.

#### 🚨 కీలక రక్షణ సిఫార్సు:
*ఇది వృత్తిపరమైన వైద్య నిర్ధారణ కాదు. ఎల్లప్పుడూ వైద్యుడిని సంప్రదించండి.*
**దయచేసి వెంటనే వైద్యుడిని సంప్రదించండి** ఒకవేళ మీకు:
*   ఉమ్మి మింగడం లేదా శ్వాస తీసుకోవడం కష్టంగా మారినప్పుడు
*   దగ్గినప్పుడు రక్తం పడటం
*   సుదీర్ఘమైన అధిక జ్వరం ఉండటం.`;
    }
    
    if (q.includes("stomach") || q.includes("nausea") || q.includes("vomit") || q.includes("diarrhea") || q.includes("కడుపు") || q.includes("వాంతులు") || q.includes("విరేచనాలు") || q.includes("నొప్పి")) {
      return `### 🩺 ప్రాథమిక అంచనా: గ్యాస్ట్రోఎంటరైటిస్ / అజీర్ణం
మీ కడుపు లక్షణాలు జీర్ణవ్యవస్థలో వాపు లేదా చికాకును సూచిస్తాయి, ఇది కలుషిత ఆహారం (ఫుడ్ పాయిజనింగ్), కడుపు వైరస్ లేదా కారంగా ఉండే ఆహారం వల్ల కావచ్చు.

#### 💡 సాధ్యమయ్యే పరిస్థితులు:
1. **వైరల్ గ్యాస్ట్రోఎంటరైటిస్:** అత్యంత వేగంగా సంక్రమించే పొట్ట వైరస్.
2. **ఫుడ్ పాయిజనింగ్:** కలుషితమైన ఆహారం లేదా నీరు తీసుకోవడం.
3. **గ్యాస్ట్రైటిస్ (అజీర్ణం):** ఒత్తిడి లేదా కారంగా ఉండే ఆహారం వల్ల కడుపులో మంట.

#### ⚠️ ప్రాథమిక జాగ్రత్తలు & సంరక్షణ:
*   **పొట్టకు విశ్రాంతి:** వాంతులు అయిన తర్వాత కొన్ని గంటల పాటు ఘనాహారం తీసుకోకుండా పొట్టకు విశ్రాంతి ఇవ్వండి.
*   **నివారించండి:** పాలు/డైరీ ఉత్పత్తులు, కేఫీన్, కారంగా ఉండే మరియు కొవ్వు పదార్థాలను నివారించండి.
*   **మందులు:** డాక్టర్ సలహా లేకుండా విరేచనాలు ఆపే మందులు నేరుగా వాడకండి.

#### 💧 హైడ్రేషన్ & పోషకాహార సూచనలు:
*   **డీహైడ్రేషన్ నివారణ:** నీరు, ఓఆర్ఎస్ లేదా పల్చటి సూప్‌లను కొద్దికొద్దిగా నిరంతరం తాగండి. ఒకేసారి ఎక్కువ తాగితే వాంతులు కావచ్చు.
*   **BRAT ఆహారం:** జీర్ణక్రియ తేలికగా అవ్వడానికి అరటిపండ్లు, ఉడికించిన అన్నం, యాపిల్ సాస్, మరియు టోస్ట్ (BRAT) తీసుకోండి.

#### 🚨 కీలక రక్షణ సిఫార్సు:
*ఇది వృత్తిపరమైన వైద్య నిర్ధారణ కాదు. ఎల్లప్పుడూ వైద్యుడిని సంప్రదించండి.*
**దయచేసి వెంటనే వైద్యుడిని సంప్రదించండి** ఒకవేళ:
*   తీవ్రమైన డీహైడ్రేషన్ గుర్తులు (విపరీతమైన దాహం, నోరు ఎండిపోవడం, మూత్రం రాకపోవడం, తల తిరగడం)
*   వాంతులు లేదా మలంలో రక్తం పడటం
*   కడుపులో విపరీతమైన, భరించలేని నొప్పి రావడం.`;
    }
    
    return `### 🩺 ప్రాథమిక అంచనా: జనరల్ సింప్టమాటిక్ కన్సల్టేషన్
మీరు నివేదించిన లక్షణాలు: *"#QUERY#"* పంచుకున్నందుకు ధన్యవాదాలు. ఇవి సాధారణ ఆరోగ్య మార్పుల వల్ల రావచ్చు, కానీ ఖచ్చితమైన నిర్ధారణకు వైద్య పరిశీలన అవసరం.

#### 💡 సాధ్యమయ్యే పరిస్థితులు:
1. **శారీరక అలసట:** నిద్రలేమి లేదా అధిక శ్రమ వల్ల కలిగే అలసట.
2. **ప్రారంభ నిరోధక ప్రతిస్పందన:** క్రిములకు వ్యతిరేకంగా శరీరం యొక్క స్వల్ప పోరాటం.
3. **వాతావరణ మార్పులు:** నిద్ర, వాతావరణం, హైడ్రేషన్ లేదా పోషకాహారంలో మార్పులు.

#### ⚠️ ప్రాథమిక జాగ్రత్తలు & సంరక్షణ:
*   **తగినంత నిద్ర:** మీ రోగనిరోధక శక్తి పెరగడానికి కనీసం 7-8 గంటలు పడుకోండి.
*   **పర్యవేక్షణ:** లక్షణాల తీవ్రతను గమనిస్తూ ఒక డైరీలో రాసుకోండి.

#### 💧 హైడ్రేషన్ & పోషకాహార సూచనలు:
*   **హైడ్రేషన్:** రోజుకు కనీసం 8-10 గ్లాసుల స్వచ్ఛమైన నీరు తాగండి.
*   **ఆరోగ్యకరమైన ఆహారం:** తాజా పండ్లు మరియు కూరగాయలు ఎక్కువగా తీసుకోండి.

#### 🚨 కీలక రక్షణ సిఫార్సు:
*ఇది వృత్తిపరమైన వైద్య నిర్ధారణ కాదు. ఎల్లప్పుడూ వైద్యుడిని సంప్రదించండి.*
**దయచేసి వైద్యుడిని సంప్రదించండి** మీ లక్షణాలు 48-72 గంటల కంటే ఎక్కువ కాలం ఉన్నా లేదా తీవ్రంగా మారినా.`;
  }

  // English (default)
  if (q.includes("headache") && (q.includes("fever") || q.includes("temperature"))) {
    return `### 🩺 Preliminary Assessment: Viral Syndrome / Early Flu
Based on your report of **headache** and **fever**, these symptoms frequently point toward a systemic viral infection, such as influenza, a common viral illness, or potentially early stages of another infection.

#### 💡 Possible Conditions:
1. **Influenza (The Flu):** Accompanied by body aches, chills, fatigue.
2. **Common Cold / Viral Fever:** Standard body response to common pathogens.
3. **Mild Dehydration:** Can exacerbate headaches and elevate core temperature.

#### ⚠️ Basic Precautions & Care:
*   **Rest:** Stay in bed and avoid physical exertion. Your body needs energy to fight off the pathogen.
*   **Fever Control:** Over-the-counter antipyretics (like Acetaminophen/Paracetamol or Ibuprofen) can help reduce fever and relieve headache pain. *Follow dosage limits carefully.*
*   **Isolate:** Keep your distance from others to prevent spreading potential viral contagions.

#### 💧 Hydration & Nutrition Suggestions:
*   **Fluids:** Drink plenty of warm water, oral rehydration solutions (ORS), herbal teas, or clear broths. Aim for 2.5 to 3 liters daily.
*   **Diet:** Stick to light, easily digestible meals (e.g., toast, soup, bananas, rice).

#### 🚨 Critical Safety Recommendation:
*This is not a professional medical diagnosis. Always consult a physician.*
**Please consult a physician immediately** if your fever exceeds 103°F (39.4°C), if it lasts more than 3 consecutive days, or if you develop critical red-flag signs such as:
*   Stiff neck
*   Severe chest pain or difficulty breathing
*   Confusion or extreme drowsiness
*   Severe, sudden-onset headache unlike any you've had before.`;
  }
  
  if (q.includes("cough") || q.includes("throat") || q.includes("cold")) {
    return `### 🩺 Preliminary Assessment: Upper Respiratory Infection / Bronchitis
Based on your report of **cough or sore throat**, this suggests irritation or inflammation of your upper airways, which is commonly caused by viral pathogens (rhinovirus, adenovirus) or environmental allergens.

#### 💡 Possible Conditions:
1. **Acute Pharyngitis (Sore Throat):** Often viral, occasionally bacterial (Strep throat).
2. **Common Cold:** Rhinovirus causing congestion, ticklish throat, and coughing.
3. **Acute Bronchitis:** Inflammation of the bronchial tubes, often following a cold.

#### ⚠️ Basic Precautions & Care:
*   **Warm gargles:** Gargle with warm salt water (1/2 tsp salt in warm water) 3-4 times daily to reduce throat swelling and discomfort.
*   **Air moisture:** Use a cool-mist humidifier or take steam inhalations to soothe irritated bronchial passages.
*   **Avoid Irritants:** Stay away from tobacco smoke, heavy cooking vapors, and cold air.

#### 💧 Hydration & Nutrition Suggestions:
*   **Soothe:** Drink warm honey-lemon teas, warm broths, or warm water. Honey is a clinically proven natural cough suppressant (do not give to children under 1 year).
*   **Hydrate:** Maintain constant fluid intake to thin mucosal secretions.

#### 🚨 Critical Safety Recommendation:
*This is not a professional medical diagnosis. Always consult a physician.*
**Please consult a physician immediately** if you experience:
*   Difficulty swallowing saliva or breathing
*   Coughing up blood or rust-colored phlegm
*   A persistent high fever
*   A barking cough or whooping noise when breathing in.`;
  }

  if (q.includes("stomach") || q.includes("nausea") || q.includes("vomit") || q.includes("diarrhea")) {
    return `### 🩺 Preliminary Assessment: Gastroenteritis / Indigestion
Your gastrointestinal symptoms suggest irritation of the stomach or intestinal lining, which could be related to mild food poisoning, a stomach virus ("stomach flu"), or dietary indiscretion.

#### 💡 Possible Conditions:
1. **Viral Gastroenteritis:** Highly contagious stomach virus causing spasms and fluid loss.
2. **Food Poisoning:** Consuming contaminated food or water.
3. **Mild Indigestion (Gastritis):** Stomach lining irritation due to spicy/greasy food or stress.

#### ⚠️ Basic Precautions & Care:
*   **Gut Rest:** Let your stomach settle. Avoid eating solid foods for a few hours after vomiting.
*   **Avoid Triggers:** Steer clear of dairy, caffeine, alcohol, nicotine, fatty, or highly seasoned foods.
*   **Bowel Rest:** Do not take anti-diarrheal medications immediately without consulting a doctor, as they can sometimes trap pathogens inside the digestive tract.

#### 💧 Hydration & Nutrition Suggestions:
*   **Rehydrate:** Take small, frequent sips of water, electrolyte drinks, or clear soups. Large gulps can trigger vomiting.
*   **BRAT Diet:** When ready for solids, start with plain, bland foods: **B**ananas, **R**ice, **A**pplesauce, **T**oast.

#### 🚨 Critical Safety Recommendation:
*This is not a professional medical diagnosis. Always consult a physician.*
**Please consult a physician immediately** if you observe:
*   Signs of severe dehydration (extreme thirst, dry mouth, little to no urination, deep dizziness)
*   Blood in your vomit or stool (black, tarry stools)
*   Severe, localized abdominal pain (especially in the lower right quadrant)
*   An inability to keep any fluids down for more than 12-24 hours.`;
  }

  // Generic clinical response
  return `### 🩺 Preliminary Assessment: General Symptomatic Consultation
Thank you for sharing your symptoms: *"#QUERY#"*. While these symptoms can be associated with various minor, self-limiting health conditions, a precise evaluation requires professional observation.

#### 💡 Possible Conditions:
1. **Transient Stress Response:** Physical fatigue manifesting as somatic symptoms.
2. **Early Immune Response:** Mild bodily reaction to environmental or minor viral pathogens.
3. **Environmental Factors:** Changes in sleep, weather, hydration, or nutrition.

#### ⚠️ Basic Precautions & Care:
*   **Adequate Sleep:** Ensure you get 7-8 hours of sound sleep to allow your immune system to function optimally.
*   **Monitor:** Keep a log of when symptoms occur, what makes them better or worse, and their severity.
*   **OTC Medications:** Use over-the-counter remedies only for symptomatic relief and strictly as directed.

#### 💧 Hydration & Nutrition Suggestions:
*   **Hydrate:** Drink at least 8 glasses of pure water daily.
*   **Clean Diet:** Consume wholesome, vitamin-rich meals, focusing on fresh fruits and vegetables to support cellular recovery.

#### 🚨 Critical Safety Recommendation:
*This is not a professional medical diagnosis. Always consult a physician.*
**Please consult a healthcare provider** if your symptoms persist for more than 48-72 hours, interfere with your daily functions, or worsen over time. Seek emergency medical attention for any chest pain, severe breathing issues, sudden weakness, or high fever.`;
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
      console.log(`⚠️ No AI API Key found. Returning high-fidelity fallback symptom response in: ${activeLang}`);
      
      const responseText = getMockSymptomResponse(latestUserMessage, activeLang).replace("#QUERY#", latestUserMessage);
      
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

    const languagePromptMap: Record<string, string> = {
      hindi: "You are MediBuddy AI, a warm, professional, premium AI Healthcare Companion. You MUST speak and respond ONLY in हिन्दी (Hindi using Devanagari script). Complete all clinical assessments, precautions, and instructions fully in Hindi. Translate headings as well. Keep each section short (1-2 sentences max) to minimize token latency. Include the Hindi warning disclaimer verbatim at the very end: '⚠️ चेतावनी: यह कोई पेशेवर चिकित्सा निदान नहीं है। उचित सलाह के लिए कृपया किसी लाइसेंस प्राप्त चिकित्सा पेशेवर से परामर्श लें।'",
      telugu: "You are MediBuddy AI, a warm, professional, premium AI Healthcare Companion. You MUST speak and respond ONLY in తెలుగు (Telugu using Telugu script). Complete all clinical assessments, precautions, and instructions fully in Telugu. Translate headings as well. Keep each section short (1-2 sentences max) to minimize token latency. Include the Telugu warning disclaimer verbatim at the very end: '⚠️ హెచ్చరిక: ఇది వృత్తిపరమైన వైద్య నిర్ధారణ కాదు. దయచేసి సరైన సలహా కోసం లైసెన్స్ పొందిన వైద్య నిపుణుడిని సంప్రదించండి.'",
      english: "You are MediBuddy AI, a warm, professional, premium AI Healthcare Companion. You MUST speak and respond ONLY in Indian English (en-IN format). Complete all assessments and precautions in highly concise English. Keep each section short (1-2 sentences max) to minimize token latency. Include the English warning disclaimer verbatim at the very end: '⚠️ Disclaimer: This is not a professional medical diagnosis. Please consult a licensed medical professional for proper advice.'"
    };

    const activePrompt = languagePromptMap[activeLang] || languagePromptMap.english;

    // Map conversation logs to API-supported format
    const formattedMessages = [
      { role: "system", content: activePrompt },
      ...messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content
      }))
    ];

    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: formattedMessages as any,
      max_tokens: 500,
      temperature: 0.3
    });

    const aiContent = response.choices[0]?.message?.content || "";
    return NextResponse.json({ content: aiContent }, { status: 200 });
  } catch (error: any) {
    console.error("🔴 AI Symptom Analyzer API error:", error);
    return NextResponse.json({ 
      error: "Symptom check failed. Please try again.",
      message: error?.message || "Internal server error" 
    }, { status: 500 });
  }
}
