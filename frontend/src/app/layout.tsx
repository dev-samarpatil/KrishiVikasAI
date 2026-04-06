import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/shell/TopBar";
import BottomNav from "@/components/shell/BottomNav";
import VoiceFAB from "@/components/shell/VoiceFAB";
import GlobalInit from "@/components/shared/GlobalInit";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Krishi Vikas AI — Empowering Farmers",
  description:
    "AI-powered farming companion for Indian smallholder farmers. Get instant crop diagnosis, weather alerts, mandi prices, and government scheme guidance.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E7D32",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-gray-50" suppressHydrationWarning>
        <LanguageProvider>
          {/* Fixed TopBar */}
          <TopBar />

          {/* Global Init covers Alerts and GPS */}
          <GlobalInit />

          {/* Scrollable content area — padded for fixed TopBar and BottomNav */}
          <main className="flex-1 pt-[60px] pb-[80px] overflow-y-auto w-full max-w-lg mx-auto relative shadow-sm bg-gray-50 min-h-screen border-x border-gray-200/50">
            {children}
          </main>

          {/* Pulsing Voice FAB */}
          <VoiceFAB />

          {/* Fixed BottomNav */}
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
// Wake up Render backend on app load
useEffect(() => {
  fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/health`)
    .then(() => console.log('Backend awake'))
    .catch(() => console.log('Backend waking up...'))
}, [])