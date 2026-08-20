"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Onboarding() {
  const supabase = createClientComponentClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [grade, setGrade] = useState("");
  const [highSchool, setHighSchool] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          first_name: firstName,
          last_name: lastName,
          grade: grade,
          high_school: highSchool,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        alert("Error saving profile: " + error.message);
      } else {
        window.location.reload();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
      <form 
        onSubmit={handleSubmit} 
        className="relative bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 p-8 rounded-3xl w-full max-w-md flex flex-col gap-5 shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)]"
      >
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
            Setup Your Profile
          </h2>
          <p className="text-slate-400 text-sm">Enter your details to join your school feed</p>
        </div>
        
        <div className="space-y-3 mt-2">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all placeholder:text-slate-500"
          />
          
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all placeholder:text-slate-500"
          />

          <input
            type="text"
            placeholder="Grade (e.g. 10)"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
            className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all placeholder:text-slate-500"
          />

          <input
            type="text"
            placeholder="High School"
            value={highSchool}
            onChange={(e) => setHighSchool(e.target.value)}
            required
            className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all placeholder:text-slate-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-[0.98]"
        >
          {loading ? "Saving..." : "Get Started →"}
        </button>
      </form>
    </div>
  );
}
