"use client";

import Image from "next/image";
import { Globe, ChevronDown, User } from "lucide-react";
import { useState, useEffect } from "react";
import LanguageModal from "../shared/LanguageModal";
import FarmerProfileModal from "../shared/FarmerProfileModal";
import { useLanguage } from "@/context/LanguageContext";

const LANGUAGES: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
  ta: "தமிழ்",
};

export default function TopBar() {
  const { language, setLanguage, t } = useLanguage();
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setLangModalOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-gray-50 shadow-sm border-b border-gray-200 px-3 py-2.5 flex justify-between items-center">
        {/* LEFT: Logo + Brand */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            width={30}
            height={30}
            className="rounded-lg"
            alt="Krishi Vikas AI Logo"
            priority
          />
          <div>
            <div className="text-xl font-extrabold tracking-tight leading-none">
              <span className="text-green-900">Krishi Vikas </span>
              <span className="text-blue-700">AI</span>
            </div>
            <div className="text-[10px] text-gray-500 tracking-widest uppercase mt-0.5 font-bold">
              {t('empowering_farmers')}
            </div>
          </div>
        </div>

        {/* RIGHT: Buttons */}
        <div className="flex items-center gap-2">
          {/* Profile Edit Button */}
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center justify-center bg-white border border-gray-300 rounded-full w-11 h-11 shadow-sm active:scale-[0.96] transition-all"
            aria-label="Edit Profile"
          >
            <User className="w-5 h-5 text-gray-700" />
          </button>

          {/* Language pill */}
          <button
            onClick={() => setLangModalOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-full px-3 py-2 shadow-sm active:scale-[0.96] transition-all min-h-[44px]"
            aria-label="Change language"
            id="language-selector"
          >
            <Globe className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-bold text-gray-800">
              {LANGUAGES[language]}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </header>

      <LanguageModal
        isOpen={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        currentLang={language}
        onSelect={handleLanguageChange}
      />

      <FarmerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        forceOpen={true} // Automatically opens if no profile is found on mount
      />
    </>
  );
}
