"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function UserSettings() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // Apply or remove the 'dark' class on <html>
  const applyTheme = (mode: "light" | "dark") => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    async function fetchSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: settings, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user settings:", error);
        await supabase.from("user_settings").insert({ 
          user_id: user.id,
          theme_mode: "light" 
        });
        applyTheme("light");
      } else if (settings) {
        setPushNotifications(settings.push_notifications ?? true);
        setInAppNotifications(settings.in_app_notifications ?? true);
        
        const savedTheme = settings.theme_mode || "light";
        setThemeMode(savedTheme);
        applyTheme(savedTheme);
        localStorage.setItem("kudo-theme", savedTheme);
      }
      setLoading(false);
    }

    fetchSettings();
  }, [supabase, router]);

  const handleThemeToggle = () => {
    const nextTheme = themeMode === "light" ? "dark" : "light";
    setThemeMode(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem("kudo-theme", nextTheme);
  };

  const handleSaveSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_settings")
      .update({
        push_notifications: pushNotifications,
        in_app_notifications: inAppNotifications,
        theme_mode: themeMode,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating settings:", error);
      alert("Failed to update settings.");
    } else {
      alert("Settings updated successfully!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] color-[var(--foreground)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-8">User Settings</h1>

      {/* Appearance Section */}
      <div className="backdrop-blur-glass p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">App Theme Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {themeMode === "light" ? "Currently using Bright Mode" : "Currently using Dark Mode"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleThemeToggle}
            className="px-4 py-2 font-semibold text-sm rounded-lg bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow hover:opacity-90 transition-all"
          >
            Switch to {themeMode === "light" ? "Dark Mode" : "Bright Mode"}
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="backdrop-blur-glass p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Notifications</h2>

        <div className="flex items-center justify-between mb-4">
          <span>Push Notifications:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={pushNotifications}
              onChange={() => setPushNotifications(!pushNotifications)}
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium">
              {pushNotifications ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span>In-App Notifications:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={inAppNotifications}
              onChange={() => setInAppNotifications(!inAppNotifications)}
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium">
              {inAppNotifications ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>

        <button
          onClick={handleSaveSettings}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
