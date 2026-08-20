"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Onboarding from "../components/Onboarding";

export default function Home() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()
            .then(({ data }) => setProfile(data));
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
      <div className="min-h-screen bg-slate-950 text-indigo-400 flex items-center justify-center font-bold text-lg">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 p-8 rounded-3xl text-center shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] space-y-6 max-w-sm w-full">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
            Broward Class Compliments
          </h1>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-[0.98]"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const needsOnboarding =
    !profile ||
    !profile.first_name ||
    !profile.last_name ||
    !profile.grade ||
    !profile.high_school;

  if (needsOnboarding) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 p-8 rounded-3xl text-center shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] space-y-4 max-w-md w-full">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
          Welcome, {profile.first_name}!
        </h1>
        <p className="text-slate-400 font-medium">
          {profile.high_school} • Grade {profile.grade}
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-4 py-2 px-6 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
