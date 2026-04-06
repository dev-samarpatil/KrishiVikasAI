"use client";

import dynamic from "next/dynamic";

const SentinelMapWithNoSSR = dynamic(
  () => import("@/components/sentinel/SentinelMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-sm" style={{ height: 'calc(100vh - 132px)' }}>
        Loading map...
      </div>
    ),
  }
);

export default function SentinelPage() {
  return (
    <main className="h-full w-full relative">
      <SentinelMapWithNoSSR />
    </main>
  );
}
