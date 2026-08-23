"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { playSound } from "../lib/audio";

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
}

export default function ShareCardModal({ isOpen, onClose, profile }: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    playSound("boost");

    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.download = `${profile?.username || "user"}-stats.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-5 text-center shadow-2xl"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-cyan-400 uppercase tracking-wide">Share Your Flex 🔥</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          {/* EXPORTABLE CARD TARGET */}
          <div
            ref={cardRef}
            className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 border border-indigo-500/30 text-white space-y-4 shadow-xl text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3">
              <img
                src={profile?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=default"}
                alt="Avatar"
                className="w-14 h-14 rounded-full bg-slate-950 border-2 border-indigo-400 p-1 object-cover"
              />
              <div>
                <h4 className="font-black text-lg text-white">{profile?.first_name} {profile?.last_name}</h4>
                <p className="text-xs text-indigo-300 font-medium">@{profile?.username} • {profile?.high_school}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="bg-slate-900/80 border border-indigo-500/20 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">Streak</span>
                <span className="text-xl font-black text-amber-400">🔥 {profile?.streak || 1} Days</span>
              </div>
              <div className="bg-slate-900/80 border border-indigo-500/20 p-3 rounded-2xl text-center">
                <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">Aura</span>
                <span className="text-xl font-black text-cyan-400">⚡ {profile?.aura || 0}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-indigo-500/20 p-3 rounded-2xl text-center">
              <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">Total Votes</span>
              <span className="text-2xl font-black text-pink-400">💖 {profile?.total_votes_received || 0}</span>
            </div>

            <div className="pt-2 flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-800/80">
              <span>Vote for me on the app!</span>
              <span className="text-indigo-400">#AuraApp</span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-extrabold text-sm text-white shadow-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {downloading ? "Generating..." : "📸 Save Image for Story"}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
