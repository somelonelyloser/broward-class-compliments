"use client";

import { useState } from "react";

const AVATAR_SELECTIONS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zack",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Milo",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Pepper",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Shadow",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Kiki",
];

interface AvatarSelectorProps {
  currentAvatar: string;
  onSelectAvatar: (url: string) => void;
}

export default function AvatarSelector({ currentAvatar, onSelectAvatar }: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-400 transition"
      >
        <img src={currentAvatar} alt="PFP" className="w-8 h-8 rounded-full bg-slate-900" />
        <span className="text-xs text-slate-300 font-medium">Change PFP</span>
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 z-50 p-3 bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-xl grid grid-cols-4 gap-2 w-56">
          {AVATAR_SELECTIONS.map((url, i) => (
            <img
              key={i}
              src={url}
              alt="Avatar Choice"
              onClick={() => {
                onSelectAvatar(url);
                setIsOpen(false);
              }}
              className={`w-10 h-10 rounded-full cursor-pointer bg-slate-950 p-1 border-2 transition hover:scale-105 ${
                currentAvatar === url ? "border-cyan-400" : "border-transparent"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
