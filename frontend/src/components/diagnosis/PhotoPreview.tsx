"use client";

import Image from "next/image";
import { RotateCcw, Check, Loader2 } from "lucide-react";

interface PhotoPreviewProps {
  imageUrl: string;
  isAnalyzing: boolean;
  onConfirm: () => void;
  onRetake: () => void;
}

export default function PhotoPreview({
  imageUrl,
  isAnalyzing,
  onConfirm,
  onRetake,
}: PhotoPreviewProps) {
  return (
    <div className="mx-3 mt-3">
      {/* Photo preview */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-green-300 shadow-lg">
        <Image
          src={imageUrl}
          alt="Crop photo for diagnosis"
          width={800}
          height={600}
          className="w-full h-auto object-cover max-h-[400px]"
          unoptimized
        />

        {/* Analyzing overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <div className="text-white font-bold text-base">
              Analyzing your crop...
            </div>
            <div className="text-white/80 text-xs">
              AI is checking for diseases & deficiencies
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!isAnalyzing && (
        <div className="flex gap-3 mt-3">
          <button
            onClick={onRetake}
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 rounded-xl py-3 text-sm font-bold active:scale-[0.96] transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retake
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-600 text-white rounded-xl py-3 text-sm font-bold active:scale-[0.96] transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Check className="w-4 h-4" />
            Use this photo
          </button>
        </div>
      )}
    </div>
  );
}
