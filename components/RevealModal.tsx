"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, UserCheck } from "lucide-react";
import { playSound } from "@/lib/audio";

interface RevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  voterInfo: {
    hint: string;
    grade?: string;
  };
}

export default function RevealModal({ isOpen, onClose, voterInfo }: RevealModalProps) {
  const [progress, setProgress] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setIsRevealed(false);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsRevealed(true);
            playSound("reveal");
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 text-center text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isRevealed ? (
          <div className="py-8 space-y-4">
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold">Unlocking Hint...</h3>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="bg-purple-500 h-full transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/40 rounded-full flex items-center justify-center mx-auto">
              <UserCheck className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-black text-purple-300">Vote Revealed!</h3>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80">
              <p className="text-xs text-slate-400">Voter Hint:</p>
              <p className="text-lg font-bold text-white mt-1">{voterInfo.hint}</p>
              {voterInfo.grade && (
                <p className="text-xs text-purple-400 mt-2">{voterInfo.grade}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
