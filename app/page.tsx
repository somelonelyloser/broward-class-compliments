"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Onboarding from "../components/Onboarding";

export default function Home() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"choose" | "email_login" | "email_signup">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

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

  const handleOAuth = async (provider: "google" | "apple") => {
    setAuthError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setAuthError(error.message);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    if (authMode === "email_login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
    } else if (authMode === "email_signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 flex flex-col items-center justify-center gap-3 font-semibold">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">Loading application...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
        <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 p-6 sm:p-8 lg:p-10 rounded-3xl text-center shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] transition-all duration-300">
          
          <div className="space-y-2 mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent animate-pulse">
              Broward Class Compliments
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">Connect, compliment, and see top polls in your school</p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm">
              {authError}
            </div>
          )}

          {authMode === "choose" ? (
            <div className="space-y-3">
              <button
                onClick={() => handleOAuth("google")}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-sm sm:text-base"
              >
                <span>Sign in with Google</span>
              </button>

              <button
                onClick={() => handleOAuth("apple")}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-sm sm:text-base"
              >
                <span>Sign in with Apple</span>
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-widest absolute">Or</span>
              </div>

              <button
                onClick={() => setAuthMode("email_login")}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-[0.98] text-sm sm:text-base"
              >
                Continue with Email
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@school.com"
                  className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all placeholder:text-slate-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all placeholder:text-slate-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-[0.98] text-sm sm:text-base mt-2"
              >
                {authLoading ? "Processing..." : authMode === "email_login" ? "Sign In" : "Create Account"}
              </button>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "email_login" ? "email_signup" : "email_login")}
                  className="hover:text-cyan-400 underline transition"
                >
                  {authMode === "email_login" ? "Need an account? Sign Up" : "Have an account? Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("choose")}
                  className="hover:text-slate-200 transition"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
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

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 p-6 sm:p-8 lg:p-10 rounded-3xl text-center shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] space-y-6 transition-all duration-300">
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
            Welcome, {profile.first_name}!
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">
            @{profile.username} • {profile.high_school} • Grade {profile.grade}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-left space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-slate-400">Verification Status:</span>
            <span className={`font-semibold ${
              profile.verification_status === "verified" ? "text-emerald-400" :
              profile.verification_status === "pending" ? "text-amber-400" : "text-slate-400"
            }`}>
              {profile.verification_status === "verified" ? "Verified" :
               profile.verification_status === "pending" ? "Pending Approval (Up to 72h)" : "Unverified (Poll Creation Locked)"}
            </span>
          </div>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="py-2.5 px-6 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all text-sm active:scale-95"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
