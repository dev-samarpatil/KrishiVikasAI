"use client";

import { useRouter } from "next/navigation";
import { Map, FileText, TrendingUp, Leaf } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const items = [
  {
    id: "sentinel",
    icon: Map,
    color: "text-red-500",
    bg: "bg-red-50",
    path: "/sentinel",
  },
  {
    id: "schemes",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    path: "/schemes",
  },
  {
    id: "mandi",
    icon: TrendingUp,
    color: "text-amber-600",
    bg: "bg-amber-50",
    path: "/mandi",
  },
  {
    id: "farm",
    icon: Leaf,
    color: "text-green-700",
    bg: "bg-green-50",
    path: "/farm",
  },
];

export default function QuickAccessGrid() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="mx-3 mt-4">
      <h2 className="text-base font-bold text-gray-900 mb-3">{t("quick_access")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(30);
              }
              router.push(item.path);
            }}
            className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3 active:scale-[0.97] transition-all duration-100 shadow-sm"
            id={`quick-${item.id}`}
          >
            <div
              className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={2} />
            </div>
            <span className="text-sm font-bold text-gray-800">{t(item.id)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
