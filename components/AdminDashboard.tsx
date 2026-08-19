
"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [requireIdVerification, setRequireIdVerification] = useState(false);
  const [feedbackQueue, setFeedbackQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || profile?.role !== "admin") {
        router.push("/");
      } else {
        setIsAdmin(true);
        fetchAppSettings();
        fetchFeedbackQueue();
      }
      setLoading(false);
    }

    async function fetchAppSettings() {
      const { data, error } = await supabase
        .from("app_settings")
        .select("require_id_verification")
        .single();

      if (error) {
        console.error("Error fetching app settings:", error);
      } else if (data) {
        setRequireIdVerification(data.require_id_verification);
      }
    }

    async function fetchFeedbackQueue() {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("status", "pending");

      if (error) {
        console.error("Error fetching feedback queue:", error);
      } else if (data) {
        setFeedbackQueue(data);
      }
    }

    checkAdmin();
  }, [supabase, router]);

  const handleToggleIdVerification = async () => {
    const { error } = await supabase
      .from("app_settings")
      .update({ require_id_verification: !requireIdVerification })
      .eq("id", 1); // Assuming a single row with ID 1 for app settings

    if (error) {
      console.error("Error updating ID verification setting:", error);
    } else {
      setRequireIdVerification(!requireIdVerification);
    }
  };

  const handleApproveFeedback = async (feedbackId: string, userId: string) => {
    const { error } = await supabase
      .from("feedback")
      .update({ status: "approved" })
      .eq("id", feedbackId);

    if (error) {
      console.error("Error approving feedback:", error);
    } else {
      // Reward user with Aura and multiplier
      const { error: auraError } = await supabase
        .from("profiles")
        .update({ aura_points: 300, aura_multiplier: 2, aura_multiplier_end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
        .eq("id", userId);

      if (auraError) {
        console.error("Error rewarding user with Aura:", auraError);
      }

      fetchFeedbackQueue(); // Refresh feedback queue
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (!isAdmin) {
    return null; // Should be redirected by router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Settings</h2>
        <div className="flex items-center justify-between">
          <span>Require ID Verification:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              value=""
              className="sr-only peer"
              checked={requireIdVerification}
              onChange={handleToggleIdVerification}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              {requireIdVerification ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Feedback Review</h2>
        {feedbackQueue.length === 0 ? (
          <p>No pending feedback.</p>
        ) : (
          <ul>
            {feedbackQueue.map((feedback: any) => (
              <li key={feedback.id} className="mb-4 p-4 bg-gray-700 rounded-lg">
                <p className="mb-2">{feedback.feedback_text}</p>
                <button
                  onClick={() => handleApproveFeedback(feedback.id, feedback.user_id)}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Approve Feedback
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Placeholder for other admin capabilities */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Moderation Controls</h2>
        <p>Content moderation tools will be implemented here.</p>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Manage Perks</h2>
        <p>Perk management for top-ranked students will be implemented here.</p>
      </div>
    </div>
  );
}
