"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

export default function ShopPage() {
  const supabase = createClientComponentClient();

  const [profile, setProfile] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Search State
  const [showTargetBoostModal, setShowTargetBoostModal] = useState(false);
  const [targetSearchQuery, setTargetSearchQuery] = useState("");

  useEffect(() => {
    loadShopData();
  }, [supabase]);

  const loadShopData = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(prof);

      const { data: students } = await supabase.from("profiles").select("*");
      if (students) setAllStudents(students);
    }
    setLoading(false);
  };

  const handleBuyPfpBoost = async () => {
    if (!profile) return;
    if ((profile.aura || 0) < 2000) {
      alert("You need at least 2,000 Aura points to buy a PFP Boost!");
      return;
    }

    const newAura = profile.aura - 2000;
    const { error } = await supabase
      .from("profiles")
      .update({ aura: newAura, is_boosted: true })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, aura: newAura, is_boosted: true });
      alert("🚀 PFP Boost Activated! Your avatar will appear more frequently at the top of classmate polls.");
    }
  };

  const handleTargetedBoost = async (targetStudent: any) => {
    if (!profile) return;
    if ((profile.aura || 0) < 1500) {
      alert("You need at least 1,500 Aura points for a Targeted Boost!");
      return;
    }

    const newAura = profile.aura - 1500;
    
    await supabase.from("targeted_boosts").insert({
      buyer_id: profile.id,
      target_id: targetStudent.id,
    });

    await supabase
      .from("profiles")
      .update({ aura: newAura })
      .eq("id", profile.id);

    setProfile({ ...profile, aura: newAura });
    setShowTargetBoostModal(false);
    alert(`🎯 Targeted Boost active! You'll appear in ${targetStudent.first_name}'s next poll set.`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 flex items-center justify-center font-bold">
        Loading Boost Store...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* HEADER */}
        <div className="flex justify-between items-center bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs text-slate-400 font-bold hover:underline">
              ← Back
            </Link>
            <h1 className="text-sm font-black tracking-wide">AURA BOOST STORE</h1>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-black text-amber-400">
            ⚡ {profile?.aura || 0} Aura
          </div>
        </div>

        {/* STORE ITEMS */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h2 className="text-xs font-extrabold uppercase text-slate-400">Available Boosts</h2>

          <button
            onClick={handleBuyPfpBoost}
            className="w-full p-4 rounded-2xl border border-indigo-500/40 bg-indigo-600/20 hover:bg-indigo-600/30 flex justify-between items-center text-xs font-bold transition text-left"
          >
            <div>
              <p className="text-sm font-black text-indigo-300">🚀 PFP Boost</p>
              <p className="text-[10px] text-slate-400">Top priority in Classmate Polls</p>
            </div>
            <span className="text-amber-400 font-black">2000 Aura</span>
          </button>

          <button
            onClick={() => setShowTargetBoostModal(true)}
            className="w-full p-4 rounded-2xl border border-pink-500/40 bg-pink-600/20 hover:bg-pink-600/30 flex justify-between items-center text-xs font-bold transition text-left"
          >
            <div>
              <p className="text-sm font-black text-pink-300">🎯 Targeted Boost</p>
              <p className="text-[10px] text-slate-400">Appear in a specific friend's poll</p>
            </div>
            <span className="text-amber-400 font-black">1500 Aura</span>
          </button>
        </div>

      </div>

      {/* TARGETED BOOST MODAL */}
      {showTargetBoostModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-pink-400">🎯 Choose Target Student</h3>
              <button onClick={() => setShowTargetBoostModal(false)} className="text-slate-400">✕</button>
            </div>

            <input
              type="text"
              placeholder="Search by name..."
              value={targetSearchQuery}
              onChange={(e) => setTargetSearchQuery(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs"
            />

            <div className="max-h-60 overflow-y-auto space-y-2">
              {allStudents
                .filter((s) => s.id !== profile?.id && (`${s.first_name} ${s.last_name}`).toLowerCase().includes(targetSearchQuery.toLowerCase()))
                .map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleTargetedBoost(s)}
                    className="p-3 rounded-xl border border-slate-700 bg-slate-800/80 flex items-center justify-between cursor-pointer hover:border-pink-500/50 transition"
                  >
                    <span className="font-bold text-xs">{s.first_name} {s.last_name}</span>
                    <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-1 rounded-md font-bold">Target</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
