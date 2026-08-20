"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Onboarding from "../components/Onboarding";

export default function Home() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile(data);
      }
      setLoading(false);
    }

    loadUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          setProfile(data);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 flex flex-col items-center justify-center gap-3 font-semibold">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">Loading feed...</p>
      </div>
    );
  }

  const needsOnboarding =
    !profile ||
    !profile.first_name ||
    !profile.last_name ||
    !profile.username ||
    !profile.grade ||
    !profile.high_school;

  if (needsOnboarding) {
    return <Onboarding />;
  }

  const isVerified = profile.verification_status === "verified";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Navigation Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 p-5 rounded-2xl shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)]">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
              Welcome, {profile.first_name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              @{profile.username} • {profile.high_school} • Grade {profile.grade}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                if (isVerified) {
                  setShowCreatePollModal(true);
                } else {
                  alert("You must verify your Student ID badge to create new polls. You can still vote on active polls below!");
                }
              }}
              className={`flex-1 sm:flex-none py-2.5 px-4 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${
                isVerified
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-95 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/80"
              }`}
            >
              + Create Poll {!isVerified && "🔒"}
            </button>

            <button
              onClick={() => supabase.auth.signOut()}
              className="py-2.5 px-4 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all text-sm active:scale-95"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Verification Alert Banner for Unverified Users */}
        {!isVerified && (
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs sm:text-sm text-slate-300">
            <span>
              ℹ️ Status: <strong className="text-amber-400">{profile.verification_status === "pending" ? "Pending Approval (Up to 72h)" : "Unverified"}</strong>. You can vote on all school polls below!
            </span>
          </div>
        )}

        {/* Active Polls Feed */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200">Active School Polls</h2>

          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800/80 text-slate-400 space-y-2">
            <p className="text-base font-semibold text-slate-300">No active polls right now</p>
            <p className="text-xs text-slate-500">Check back soon or ask a verified classmate to create one!</p>
          </div>
        </section>

      </div>
    </div>
  );
}
