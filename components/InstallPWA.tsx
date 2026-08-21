"use client";

import { useEffect, useState } from "react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone (installed) mode
    const checkStandalone = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    setIsStandalone(checkStandalone);

    if (checkStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Capture Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show prompt banner on iOS if not installed
    if (iosDevice && !checkStandalone) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert("To install on iPhone:\n\n1. Tap the Share icon (square with arrow up) at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen'.");
    }
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed top-3 left-4 right-4 z-50 bg-indigo-600 border border-indigo-400 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">📲</span>
        <div>
          <p className="text-xs font-black">Get the App</p>
          <p className="text-[10px] text-indigo-100 font-medium">
            Add to your home screen for full screen & faster access!
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-white text-indigo-600 font-black text-xs px-3 py-1.5 rounded-xl shadow hover:bg-slate-100 transition"
        >
          Install
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="text-indigo-200 text-xs font-bold px-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
