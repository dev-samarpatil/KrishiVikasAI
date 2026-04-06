"use client";

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
  variant?: "card" | "text" | "circle" | "rect";
}

export default function SkeletonLoader({
  className = "",
  lines = 3,
  variant = "card",
}: SkeletonLoaderProps) {
  if (variant === "circle") {
    return (
      <div
        className={`rounded-full bg-gray-200 animate-pulse ${className}`}
      />
    );
  }

  if (variant === "rect") {
    return (
      <div
        className={`rounded-xl bg-gray-200 animate-pulse ${className}`}
      />
    );
  }

  if (variant === "text") {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-gray-200 rounded-full animate-pulse"
            style={{ width: `${85 - i * 15}%` }}
          />
        ))}
      </div>
    );
  }

  // Card skeleton
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 p-4 space-y-3 ${className}`}
    >
      <div className="h-4 bg-gray-200 rounded-full animate-pulse w-3/4" />
      <div className="h-3 bg-gray-200 rounded-full animate-pulse w-full" />
      <div className="h-3 bg-gray-200 rounded-full animate-pulse w-5/6" />
      <div className="h-3 bg-gray-200 rounded-full animate-pulse w-2/3" />
    </div>
  );
}
