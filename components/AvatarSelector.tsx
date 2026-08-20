"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  userId: string;
  onSelectAvatar: (url: string) => void;
}

export default function AvatarSelector({ currentAvatar, userId, onSelectAvatar }: AvatarSelectorProps) {
  const supabase = createClientComponentClient();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/pfp.${fileExt}`;

    setUploading(true);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Error uploading avatar: " + uploadError.message);
      setUploading(false);
      return;
    }

    // Get public URL
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`; // cache-buster

    onSelectAvatar(publicUrl);
    setUploading(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-400 transition"
      >
        <img src={currentAvatar} alt="PFP" className="w-8 h-8 rounded-full bg-slate-950 object-cover" />
        <span className="text-xs text-slate-300 font-medium">Change PFP</span>
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 z-50 p-4 bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl w-64 space-y-3">
          
          {/* Custom File Upload Option */}
          <div>
            <label className="block w-full cursor-pointer p-2.5 rounded-xl border border-dashed border-cyan-400/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-center transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <span className="text-xs font-bold text-cyan-300">
                {uploading ? "Uploading image..." : "📷 Upload Custom Photo"}
              </span>
            </label>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-2 text-[10px] text-slate-500 uppercase font-bold">Or Choose Default</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Preset Avatars */}
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_SELECTIONS.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Preset Avatar"
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

        </div>
      )}
    </div>
  );
}
