"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { updateFarmerContext } from "@/lib/farmer-context";

type Translations = Record<string, string>;
type LanguageDict = Record<string, Translations>;

const translations: LanguageDict = {
  en: {
    home: "Home",
    sentinel: "Sentinel",
    farm: "Farm",
    mandi: "Mandi",
    schemes: "Schemes",
    scan_your_crop: "Scan Your Crop",
    tap_for_diagnosis: "Tap to get instant AI diagnosis",
    disease_detection: "Disease detection",
    deficiency_check: "Deficiency check",
    budget_plan: "Budget plan",
    quick_access: "Quick Access",
    active_disease: "Active Disease",
    active_soil: "Active Soil",
    severe: "Severe",
    moderate: "Moderate",
    low: "Low",
    soil_health: "Soil Health",
    log_treatment: "Log Treatment",
    used_organic: "Used Organic",
    used_chemical: "Used Chemical",
    treatment_history: "Treatment History",
    soil_guardian: "Soil Guardian",
    live_mandi_prices: "Live Mandi Prices",
    modal_price: "Modal Price",
    min: "Min",
    max: "Max",
    loading_prices: "Loading prices...",
    government_schemes: "Government Schemes",
    view_details_apply: "View Details & Apply",
    eligibility: "Eligibility",
    empowering_farmers: "Empowering Farmers",
    ask_krishi: "Ask Krishi Vikas AI...",
    voice_prompt_hint: "How much fertilizer should I use today?",
    tap_mic_to_reply: "Tap mic to reply",
    retake_better_results: "Retake for better results",
    photo_unclear: "The photo was unclear. For best results:",
    natural_daylight: "Take photo in natural daylight",
    leaf_closeup: "Show the most affected leaf close-up",
    hold_steady: "Hold phone steady, 20-30cm from leaf",
    avoid_shadows: "Avoid shadows on the leaf",
    try_again: "Try again"
  },
  hi: {
    home: "होम",
    sentinel: "प्रहरी",
    farm: "खेत",
    mandi: "मंडी",
    schemes: "योजनाएं",
    scan_your_crop: "अपनी फसल स्कैन करें",
    tap_for_diagnosis: "तुरंत AI निदान पाने के लिए टैप करें",
    disease_detection: "रोग की पहचान",
    deficiency_check: "कमी की जांच",
    budget_plan: "बजट योजना",
    quick_access: "त्वरित पहुँच",
    active_disease: "सक्रिय बीमारी",
    active_soil: "सक्रिय मिट्टी",
    severe: "गंभीर",
    moderate: "मध्यम",
    low: "कम",
    soil_health: "मिट्टी का स्वास्थ्य",
    log_treatment: "उपचार दर्ज करें",
    used_organic: "जैविक का उपयोग किया",
    used_chemical: "रसायन का उपयोग किया",
    treatment_history: "उपचार इतिहास",
    soil_guardian: "मिट्टी रक्षक",
    live_mandi_prices: "लाइव मंडी भाव",
    modal_price: "औसत मूल्य",
    min: "न्यूनतम",
    max: "अधिकतम",
    loading_prices: "कीमतें लोड हो रही हैं...",
    government_schemes: "सरकारी योजनाएं",
    view_details_apply: "विवरण देखें और आवेदन करें",
    eligibility: "पात्रता",
    empowering_farmers: "किसानों का सशक्तिकरण",
    ask_krishi: "कृषि विकास AI से पूछें...",
    voice_prompt_hint: "आज मुझे कितने उर्वरक का उपयोग करना चाहिए?",
    tap_mic_to_reply: "जवाब देने के लिए माइक टैप करें",
    retake_better_results: "Retake for better results",
    photo_unclear: "The photo was unclear. For best results:",
    natural_daylight: "Take photo in natural daylight",
    leaf_closeup: "Show the most affected leaf close-up",
    hold_steady: "Hold phone steady, 20-30cm from leaf",
    avoid_shadows: "Avoid shadows on the leaf",
    try_again: "Try again"
  },
  mr: {
    home: "होम",
    sentinel: "पहारेकरी",
    farm: "शेत",
    mandi: "बाजार समिती",
    schemes: "योजना",
    scan_your_crop: "तुमचे पीक स्कॅन करा",
    tap_for_diagnosis: "त्वरित AI निदान मिळवण्यासाठी टॅप करा",
    disease_detection: "रोग निदान",
    deficiency_check: "कमतरता तपासणी",
    budget_plan: "बजेट योजना",
    quick_access: "त्वरित प्रवेश",
    active_disease: "सक्रिय रोग",
    active_soil: "सक्रिय माती",
    severe: "तीव्र",
    moderate: "मध्यम",
    low: "कमी",
    soil_health: "मातीचे आरोग्य",
    log_treatment: "उपचार नोंदवा",
    used_organic: "सेंद्रिय वापरले",
    used_chemical: "रासायनिक वापरले",
    treatment_history: "उपचार इतिहास",
    soil_guardian: "माती रक्षक",
    live_mandi_prices: "थेट बाजार भाव",
    modal_price: "सर्वसाधारण दर",
    min: "किमान",
    max: "कमाल",
    loading_prices: "दर लोड होत आहेत...",
    government_schemes: "सरकारी योजना",
    view_details_apply: "तपशील पहा आणि अर्ज करा",
    eligibility: "पात्रता",
    empowering_farmers: "शेतकऱ्यांचे सक्षमीकरण",
    ask_krishi: "कृषी विकास AI ला विचारा...",
    voice_prompt_hint: "आज मी किती खत वापरावे?",
    tap_mic_to_reply: "उत्तर देण्यासाठी माइक टॅप करा",
    retake_better_results: "Retake for better results",
    photo_unclear: "The photo was unclear. For best results:",
    natural_daylight: "Take photo in natural daylight",
    leaf_closeup: "Show the most affected leaf close-up",
    hold_steady: "Hold phone steady, 20-30cm from leaf",
    avoid_shadows: "Avoid shadows on the leaf",
    try_again: "Try again"
  },
  ta: {
    home: "முகப்பு",
    sentinel: "காவலர்",
    farm: "பண்ணை",
    mandi: "சந்தை",
    schemes: "திட்டங்கள்",
    scan_your_crop: "உங்கள் பயிரை ஸ்கேன் செய்யவும்",
    tap_for_diagnosis: "உடனடி AI நோயறிதலைப் பெற தட்டவும்",
    disease_detection: "நோய் கண்டறிதல்",
    deficiency_check: "குறைபாடு சரிபார்ப்பு",
    budget_plan: "பட்ஜெட் திட்டம்",
    quick_access: "விரைவான அணுகல்",
    active_disease: "தற்போதைய நோய்",
    active_soil: "தற்போதைய மண்",
    severe: "கடுமையான",
    moderate: "மிதமான",
    low: "குறைந்த",
    soil_health: "மண் வளம்",
    log_treatment: "சிகிச்சையை பதிவு செய்",
    used_organic: "இயற்கை உர பயன்பாடு",
    used_chemical: "இரசாயன பயன்பாடு",
    treatment_history: "சிகிச்சை வரலாறு",
    soil_guardian: "மண் பாதுகாவலர்",
    live_mandi_prices: "நேரடி சந்தை விலை",
    modal_price: "சராசரி விலை",
    min: "குறைந்தபட்சம்",
    max: "அதிகபட்சம்",
    loading_prices: "விலைகள் ஏற்றப்படுகின்றன...",
    government_schemes: "அரசு திட்டங்கள்",
    view_details_apply: "விவரங்களைக் காண்க & விண்ணப்பிக்கவும்",
    eligibility: "தகுதி",
    empowering_farmers: "விவசாயிகளுக்கு அதிகாரமளித்தல்",
    ask_krishi: "கிருஷி விகாஸ் AI யிடம் கேளுங்கள்...",
    voice_prompt_hint: "இன்று நான் எவ்வளவு உரம் பயன்படுத்த வேண்டும்?",
    tap_mic_to_reply: "பதிலளிக்க மைக்கைத் தட்டவும்",
    retake_better_results: "Retake for better results",
    photo_unclear: "The photo was unclear. For best results:",
    natural_daylight: "Take photo in natural daylight",
    leaf_closeup: "Show the most affected leaf close-up",
    hold_steady: "Hold phone steady, 20-30cm from leaf",
    avoid_shadows: "Avoid shadows on the leaf",
    try_again: "Try again"
  }
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "hi",
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState("hi");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("kv_language");
    if (stored && translations[stored]) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("kv_language", lang);
      updateFarmerContext({ language: lang as any });
    }
  };

  const t = (key: string): string => {
    if (!translations[language]) return key;
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
