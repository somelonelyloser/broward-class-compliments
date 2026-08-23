"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Clean, modern 3D and illustative avatar seeds
const AVATAR_SELECTIONS = [
  "https://api.dicebear.com/7.x/notionists/svg?seed=Aiden&backgroundColor=b6e3f4,c0aede,d1d4f9",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Maya&backgroundColor=b6e3f4,c0aede,d1d4f9",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jaden&backgroundColor=b6e3f4,c0aede,d1d4f9",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe&backgroundColor=b6e3f4,c0aede,d1d4f9",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Kai&backgroundColor=b6e3f4,c0aede,d1d4f9",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Sasha&backgroundColor=b6e3f4,c0aede,d1d4f9",
  "https://api.dicebear.com/7.x/thumbs/svg?seed=Jordan&backgroundColor=b6e3f4,c0aede,d1d4f9",
  "https://api.dicebear.com/7.x/thumbs/svg?seed=Taylor&backgroundColor=b6e3f4,c0aede,d1d4f9",
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

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Error uploading avatar: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

    onSelectAvatar(publicUrl);
    setUploading(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 pr-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition active:scale-95 shadow-md"
      >
        <img src={currentAvatar} alt="PFP" className="w-10 h-10 rounded-xl bg-slate-950 object-cover border border-slate-700" />
        <div className="text-left">
          <p className="text-xs font-extrabold text-white">Profile Photo</p>
          <p className="text-[10px] text-indigo-400 font-semibold">Click to change</p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-14 left-0 z-50 p-4 bg-slate-900/95 border border-indigo-500/30 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] backdrop-blur-xl w-72 space-y-4">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-black text-white uppercase tracking-wider">Choose Avatar</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-500 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Custom File Upload Option */}
          <div>
            <label className="block w-full cursor-pointer p-3 rounded-2xl border border-dashed border-cyan-400/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-center transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <span className="text-xs font-extrabold text-cyan-300 flex items-center justify-center gap-2">
                📸 {uploading ? "Uploading image..." : "Upload Custom Photo"}
              </span>
            </label>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-2 text-[10px] text-slate-500 uppercase font-extrabold">Or Select Styled Preset</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Preset Avatars */}
          <div className="grid grid-cols-4 gap-2.5">
            {AVATAR_SELECTIONS.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelectAvatar(url);
                  setIsOpen(false);
                }}
                className={`relative rounded-2xl overflow-hidden p-1 bg-slate-800 border-2 transition hover:scale-110 active:scale-95 ${
                  currentAvatar === url ? "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "border-slate-700/80 hover:border-slate-500"
                }`}
              >
                <img src={url} alt="Preset Avatar" className="w-10 h-10 rounded-xl object-cover bg-slate-950" />
              </button>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
