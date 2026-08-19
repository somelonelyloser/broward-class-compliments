
"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function UserSettings() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

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
        // If no settings exist, create default ones
        await supabase.from("user_settings").insert({ user_id: user.id });
      } else if (settings) {
        setPushNotifications(settings.push_notifications);
        setInAppNotifications(settings.in_app_notifications);
      }
      setLoading(false);
    }

    fetchSettings();
  }, [supabase, router]);

  const handleSaveSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_settings")
      .update({
        push_notifications: pushNotifications,
        in_app_notifications: inAppNotifications,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating settings:", error);
    } else {
      alert("Settings updated successfully!");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">User Settings</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              {inAppNotifications ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>

        <button
          onClick={handleSaveSettings}
          className="mt-6 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
