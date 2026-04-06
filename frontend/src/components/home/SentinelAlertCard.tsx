"use client";

interface SentinelAlertCardProps {
  title: string;
  message: string;
  count: number;
  disease: string;
}

export default function SentinelAlertCard({
  title,
  message,
  count,
  disease,
}: SentinelAlertCardProps) {
  return (
    <button
      className="w-full border-l-4 border-red-500 bg-red-50 rounded-2xl p-4 mx-3 mt-3 text-left active:scale-[0.98] transition-all duration-100"
      style={{ width: "calc(100% - 24px)" }}
      onClick={() => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(50);
        }
      }}
      id="sentinel-alert-card"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-label="Alert siren">
          🚨
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-red-900">{title}</div>
          <p className="text-xs text-red-700 mt-1 leading-relaxed">{message}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] bg-red-500 text-white px-2.5 py-1 rounded-full font-bold">
              {count} cases nearby
            </span>
            <span className="text-[10px] bg-red-100 text-red-800 px-2.5 py-1 rounded-full font-bold border border-red-200">
              {disease}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
