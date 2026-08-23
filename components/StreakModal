"use client";

import { useEffect } from "react";
import { Flame, Trophy, X } from "lucide-react";
import { playSound } from "@/lib/audio";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
  auraBonus: number;
}

export default function StreakModal({
  isOpen,
  onClose,
  streakCount,
  auraBonus,
}: StreakModalProps) {
  useEffect(() => {
    if (isOpen) {
      playSound("streak");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-amber-500/30 p-6 text-center text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 bg-amber-500/20 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <Flame className="w-12 h-12 text-amber-500 animate-pulse" />
        </div>

        <h3 className="text-2xl font-black text-amber-400">
          {streakCount} Day Streak!
        </h3>
        <p className="text-slate-300 mt-2 text-sm">
          You are on fire! Keep playing daily to maintain your multiplier.
        </p>

        <div className="my-6 p-4 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400" />
          <span className="text-lg font-bold text-yellow-300">
            +{auraBonus} Aura Bonus
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-lg"
        >
          Claim & Continue
        </button>
      </div>
    </div>
  );
}
