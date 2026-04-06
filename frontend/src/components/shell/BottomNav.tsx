"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Map, Leaf, TrendingUp, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const tabs = [
  { id: "home", path: "/home", Icon: Home },
  { id: "sentinel", path: "/sentinel", Icon: Map },
  { id: "farm", path: "/farm", Icon: Leaf },
  { id: "mandi", path: "/mandi", Icon: TrendingUp },
  { id: "schemes", path: "/schemes", Icon: FileText },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const isActive = (tabPath: string) => {
    if (tabPath === "/home") {
      return pathname === "/" || pathname === "/home";
    }
    return pathname.startsWith(tabPath);
  };

  return (
    <nav
      className="fixed bottom-0 z-20 w-full bg-white/95 backdrop-blur-sm border-t border-gray-200 py-2 flex justify-around pb-safe"
      id="bottom-navigation"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate(30);
            }
            router.push(tab.path);
          }}
          className="flex flex-col items-center gap-1 px-3 py-2 active:scale-[0.93] transition-all min-w-[60px]"
          aria-label={t(tab.id)}
          id={`nav-${tab.id}`}
        >
          <tab.Icon
            className={`w-6 h-6 ${
              isActive(tab.path) ? "stroke-green-700" : "stroke-gray-500"
            }`}
            strokeWidth={isActive(tab.path) ? 2.5 : 2}
          />
          <span
            className={`text-xs font-medium ${
              isActive(tab.path)
                ? "text-green-700 font-bold"
                : "text-gray-500"
            }`}
          >
            {t(tab.id)}
          </span>
        </button>
      ))}
    </nav>
  );
}
