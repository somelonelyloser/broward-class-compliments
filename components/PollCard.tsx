"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

export default function PollCard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [currentPoll, setCurrentPoll] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [auraGained, setAuraGained] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPollAndProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

      const { data: pollData, error: pollError } = await supabase
        .from("polls")
        .select("*")
        .eq("active_date", new Date().toISOString().split("T")[0])
        .single();

      if (pollError) {
        console.error("Error fetching poll:", pollError);
      } else if (pollData) {
        setCurrentPoll(pollData);
      }
      setLoading(false);
    }

    fetchPollAndProfile();
  }, [supabase, router]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#38bdf8", "#818cf8", "#c084fc", "#f472b6"],
    });
  };

  const handleVote = async () => {
    if (!selectedOption || !profile || !currentPoll || hasVoted) return;

    const gained = 10 * (profile.aura_multiplier || 1);

    const { error } = await supabase.from("votes").insert({
      poll_id: currentPoll.id,
      voter_id: profile.id,
      recipient_id: selectedOption,
    });

    if (error) {
      console.error("Error casting vote:", error);
    } else {
      triggerConfetti();
      setHasVoted(true);
      setAuraGained(gained);

      const today = new Date().toISOString().split("T")[0];
      const lastVoteDate = profile.last_vote_date;
      let newStreak = profile.voting_streak + 1;

      if (lastVoteDate) {
        const lastVoteDay = new Date(lastVoteDate);
        const todayDate = new Date(today);
        const diffTime = Math.abs(todayDate.getTime() - lastVoteDay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          newStreak = 1;
        }
      }

      const updatedAura = (profile.aura_points || 0) + gained;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          aura_points: updatedAura,
          voting_streak: newStreak,
          last_vote_date: today,
        })
        .eq("id", profile.id);

      if (updateError) {
        console.error("Error updating profile Aura/streak:", updateError);
      } else {
        setProfile({
          ...profile,
          aura_points: updatedAura,
          voting_streak: newStreak,
        });
      }
    }
  };

  const generateReferralLink = async () => {
    if (!profile) return;

    const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const { data, error } = await supabase.from("referral_links").insert({
      referrer_id: profile.id,
      code: code,
    }).select().single();

    if (error) {
      console.error("Error generating referral link:", error);
    } else if (data) {
      setReferralLink(`${window.location.origin}/invite/${data.code}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-pulse text-indigo-400 font-bold">Loading Polls...</div>
      </div>
    );
  }

  if (!profile || (profile.verification_status !== "approved" && profile.require_id_verification)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-md">
          <p className="text-slate-300">Please complete your profile and verify your ID to access polls.</p>
        </div>
      </div>
    );
  }

  const options = [
    { id: "student1_id", name: "Student 1" },
    { id: "student2_id", name: "Student 2" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Profile Aura Header */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-indigo-500/20 p-4 rounded-2xl backdrop-blur-md">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Your Aura</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                {profile?.aura_points || 0}
              </span>
              {auraGained && (
                <span className="animate-bounce text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  +{auraGained} Aura!
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Streak</span>
            <p className="text-lg font-extrabold text-amber-400">🔥 {profile?.voting_streak || 0} days</p>
          </div>
        </div>

        {/* Daily Poll Card */}
        {currentPoll ? (
          <div className="relative bg-slate-900/90 border border-indigo-500/30 p-6 rounded-3xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)]">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Daily Question</span>
              {auraGained && (
                <span className="animate-fade-in text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/30">
                  +10 Aura Earned
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-6">
              {currentPoll.question}
            </h2>

            {/* Interactive Option Cards */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              {options.map((option) => {
                const isSelected = selectedOption === option.id;

                return (
                  <button
                    key={option.id}
                    disabled={hasVoted}
                    onClick={() => setSelectedOption(option.id)}
                    className={`relative w-full p-4 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                      isSelected
                        ? "bg-indigo-600/30 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] text-white"
                        : "bg-slate-800/60 border-slate-700/80 hover:border-slate-500 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base">{option.name}</span>
                      {isSelected && (
                        <div className="flex items-center gap-1.5">
                          {hasVoted && (
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-cyan-400 opacity-75"></span>
                          )}
                          <span className="text-cyan-400 text-xs font-black bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-400/40">
                            +Aura
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleVote}
              disabled={!selectedOption || hasVoted}
              className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-40 transition active:scale-[0.98] text-sm sm:text-base"
            >
              {hasVoted ? "Vote Recorded! ✨" : "Submit Vote →"}
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl text-center space-y-4">
            <p className="text-slate-400 text-sm">No active poll today. Check back later!</p>
            <button
              onClick={generateReferralLink}
              className="py-3 px-6 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition text-xs sm:text-sm"
            >
              Generate Referral Link to Unlock Early
            </button>
            {referralLink && (
              <p className="text-xs text-indigo-400 break-all select-all">
                Share: {referralLink}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
