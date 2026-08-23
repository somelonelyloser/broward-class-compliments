"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        setShowPrompt(true);
      }
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("Notifications Enabled!", {
          body: "You will now get alerts when classmates vote for you!",
          icon: "/favicon.ico",
        });
      }
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-40 p-4 rounded-xl bg-slate-900 border border-purple-500/40 text-white shadow-2xl flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-bold">Turn on Notifications</p>
          <p className="text-[11px] text-slate-400">Get alerted when you get voted on!</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={requestPermission}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
        >
          Enable
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
