"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AnnouncementBanner() {
  const supabase = createClientComponentClient();
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchLatestAnnouncement = async () => {
      const { data } = await supabase
        .from("announcements")
        .select("message")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.message) {
        setAnnouncement(data.message);
      }
    };

    fetchLatestAnnouncement();
  }, [supabase]);

  if (!announcement || !visible) return null;

  return (
    <div className="w-full max-w-xl mx-auto my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-sm font-bold flex items-center justify-between shadow-lg backdrop-blur-md">
      <div className="flex items-center space-x-3">
        <span className="text-base">📢</span>
        <p>{announcement}</p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-amber-400 hover:text-white text-xs font-bold px-2 py-1 transition"
      >
        ✕
      </button>
    </div>
  );
}
