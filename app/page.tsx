"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Onboarding from "@/components/Onboarding";

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

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Broward Class Compliments</h1>
        <button
          onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
          className="bg-blue-600 px-4 py-2 rounded font-semibold"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // Check if profile is missing first/last name, grade, or high school
  const needsOnboarding =
    !profile ||
    !profile.first_name ||
    !profile.last_name ||
    !profile.grade ||
    !profile.high_school;

  if (needsOnboarding) {
    return <Onboarding onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">
        Welcome, {profile.first_name} {profile.last_name}!
      </h1>
      <p className="text-gray-400">
        {profile.high_school} • Grade {profile.grade}
      </p>
      <button
        onClick={() => supabase.auth.signOut()}
        className="bg-red-600 px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
