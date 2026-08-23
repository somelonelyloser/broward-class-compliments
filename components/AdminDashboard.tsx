"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedbackQueue, setFeedbackQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function fetchFeedbackQueue() {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedback queue:", error);
    } else if (data) {
      setFeedbackQueue(data);
    }
  }

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      await fetchFeedbackQueue();
      setLoading(false);
    }

    checkAdmin();
  }, [supabase, router]);

  const handleDeleteFeedback = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error) {
      console.error("Error deleting feedback:", error);
    } else {
      setFeedbackQueue((prev) => prev.filter((item) => item.id !== id));
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p className="animate-pulse text-indigo-400 font-bold">Verifying Admin Privileges...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900/80 border border-indigo-500/30 p-6 rounded-2xl backdrop-blur-md">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              Admin Control Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage user reports, feedback, and platform settings.</p>
          </div>
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
            Admin Verified
          </span>
        </div>

        {/* Feedback Queue */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-200">
              Feedback & Bug Reports ({feedbackQueue.length})
            </h2>
            <button
              onClick={fetchFeedbackQueue}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              🔄 Refresh List
            </button>
          </div>

          {feedbackQueue.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/80">
              <p className="text-xs text-slate-500">No pending feedback items found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbackQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm text-slate-200 font-medium">
                      {item.message || item.content || item.feedback_text || "No message content"}
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      Submitted: {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Unknown"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteFeedback(item.id)}
                    disabled={actionLoading === item.id}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition disabled:opacity-50"
                  >
                    {actionLoading === item.id ? "Dismissing..." : "Dismiss"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
