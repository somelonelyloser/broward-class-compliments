"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Auth & Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({ users: 0, votes: 0, posts: 0 });

  // App Settings
  const [requireIdVerification, setRequireIdVerification] = useState(false);

  // Poll Creation Form
  const [newQuestion, setNewQuestion] = useState("");
  const [pollDate, setPollDate] = useState(new Date().toISOString().split("T")[0]);
  const [pollStatus, setPollStatus] = useState("");

  // Aura Granting / Streak Management
  const [targetUsername, setTargetUsername] = useState("");
  const [auraAmount, setAuraAmount] = useState(50);
  const [userStatus, setUserStatus] = useState("");

  // Global Announcement
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementStatus, setAnnouncementStatus] = useState("");

  // Feed Moderation Queue
  const [feedItems, setFeedItems] = useState<any[]>([]);

  useEffect(() => {
    async function checkAdminAndLoadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }

      setIsAdmin(true);

      // Fetch Platform Stats
      const { count: uCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: vCount } = await supabase.from("votes").select("*", { count: "exact", head: true });
      const { count: pCount } = await supabase.from("polls").select("*", { count: "exact", head: true });
      setStats({ users: uCount || 0, votes: vCount || 0, posts: pCount || 0 });

      // Fetch Settings
      const { data: settings } = await supabase.from("app_settings").select("require_id_verification").single();
      if (settings) setRequireIdVerification(settings.require_id_verification);

      // Fetch Recent Feed Posts
      const { data: posts } = await supabase.from("feed").select("*").order("created_at", { ascending: false }).limit(10);
      if (posts) setFeedItems(posts);

      setLoading(false);
    }

    checkAdminAndLoadData();
  }, [supabase, router]);

  // Toggle ID Verification
  const handleToggleIdVerification = async () => {
    const nextState = !requireIdVerification;
    const { error } = await supabase.from("app_settings").update({ require_id_verification: nextState }).eq("id", 1);
    if (!error) setRequireIdVerification(nextState);
  };

  // Create New Daily Poll
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion) return;

    const { error } = await supabase.from("polls").insert({
      question: newQuestion,
      active_date: pollDate,
    });

    if (error) {
      setPollStatus(`❌ Error: ${error.message}`);
    } else {
      setPollStatus("✅ Poll scheduled successfully!");
      setNewQuestion("");
    }
  };

  // Give Aura to a User
  const handleGiveAura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername) return;

    const { data: userProfile, error: fetchErr } = await supabase
      .from("profiles")
      .select("id, aura_points")
      .ilike("username", targetUsername)
      .single();

    if (fetchErr || !userProfile) {
      setUserStatus("❌ User not found!");
      return;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ aura_points: (userProfile.aura_points || 0) + Number(auraAmount) })
      .eq("id", userProfile.id);

    if (updateErr) {
      setUserStatus(`❌ Failed to add Aura: ${updateErr.message}`);
    } else {
      setUserStatus(`✨ Added +${auraAmount} Aura to ${targetUsername}!`);
      setTargetUsername("");
    }
  };

  // Post Global Announcement
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText) return;

    const { error } = await supabase.from("announcements").insert({ message: announcementText });

    if (error) {
      setAnnouncementStatus(`❌ Error: ${error.message}`);
    } else {
      setAnnouncementStatus("📢 Announcement live across all feeds!");
      setAnnouncementText("");
    }
  };

  // Delete Feed Post
  const handleDeletePost = async (id: string) => {
    const { error } = await supabase.from("feed").delete().eq("id", id);
    if (!error) {
      setFeedItems((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400 font-bold">
        Loading Command Center...
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
              Admin Command Center ⚡
            </h1>
            <p className="text-xs text-slate-400 mt-1">Full administrative access & content moderation control panel.</p>
          </div>
          <span className="mt-4 sm:mt-0 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full">
            ● System Admin Active
          </span>
        </div>

        {/* Live Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Users</span>
            <p className="text-3xl font-black text-cyan-400 mt-1">{stats.users}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold uppercase">Votes Cast</span>
            <p className="text-3xl font-black text-indigo-400 mt-1">{stats.votes}</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold uppercase">Daily Polls</span>
            <p className="text-3xl font-black text-pink-400 mt-1">{stats.posts}</p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Schedule Daily Poll */}
          <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
              📝 Schedule Daily Poll
            </h2>
            <form onSubmit={handleCreatePoll} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Question Prompt</label>
                <input
                  type="text"
                  placeholder="Who has the cleanest drip today?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Schedule Date</label>
                <input
                  type="date"
                  value={pollDate}
                  onChange={(e) => setPollDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-xs transition"
              >
                Publish Daily Poll →
              </button>
            </form>
            {pollStatus && <p className="text-xs text-indigo-300 font-semibold mt-2">{pollStatus}</p>}
          </div>

          {/* 2. Aura Generator & User Mod */}
          <div className="bg-slate-900 border border-pink-500/30 p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-pink-400 flex items-center gap-2">
              ✨ Grant Aura Points
            </h2>
            <form onSubmit={handleGiveAura} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Username</label>
                <input
                  type="text"
                  placeholder="Bryan"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Aura Amount</label>
                <input
                  type="number"
                  value={auraAmount}
                  onChange={(e) => setAuraAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-pink-600 hover:bg-pink-500 font-bold rounded-xl text-xs transition"
              >
                Inject Aura Points 🚀
              </button>
            </form>
            {userStatus && <p className="text-xs text-pink-300 font-semibold mt-2">{userStatus}</p>}
          </div>

          {/* 3. Broadcast Global Banner Announcement */}
          <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              📢 Live Broadcast Alert
            </h2>
            <form onSubmit={handleBroadcastAnnouncement} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Announcement Message</label>
                <input
                  type="text"
                  placeholder="🔥 Double Aura Weekend is now active!"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 font-bold rounded-xl text-xs transition text-black"
              >
                Broadcast to Platform →
              </button>
            </form>
            {announcementStatus && <p className="text-xs text-amber-300 font-semibold mt-2">{announcementStatus}</p>}
          </div>

          {/* 4. Global Settings & Security Toggles */}
          <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-3xl space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-2">
                ⚙️ Platform Controls
              </h2>
              <p className="text-xs text-slate-400 mb-6">Instantly toggle platform-wide security restrictions and requirements.</p>

              <div className="flex items-center justify-between p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                <div>
                  <p className="text-sm font-bold text-slate-200">ID Verification Lock</p>
                  <p className="text-[10px] text-slate-400">Force new users to verify ID before voting.</p>
                </div>
                <button
                  onClick={handleToggleIdVerification}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    requireIdVerification
                      ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {requireIdVerification ? "ENABLED" : "DISABLED"}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 5. Live Feed Moderation Desk */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            🛡️ Live Feed Moderation Desk
          </h2>
          
          {feedItems.length === 0 ? (
            <p className="text-xs text-slate-500">No recent feed items found.</p>
          ) : (
            <div className="space-y-3">
              {feedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-slate-200">{item.content || item.question || "Feed Post"}</p>
                    <span className="text-[10px] text-slate-500 block">
                      Posted: {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeletePost(item.id)}
                    className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold rounded-xl transition"
                  >
                    Delete Post
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
