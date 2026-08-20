"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Onboarding from "../components/Onboarding";
import AvatarSelector from "../components/AvatarSelector";

export default function Home() {
  const supabase = createClientComponentClient();

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Poll Mode: 'standard' | 'weekly' | 'leaderboard'
  const [mode, setMode] = useState<"standard" | "weekly" | "leaderboard">("standard");

  // Standard 15-Question Set States
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [options, setOptions] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [cooldownTime, setCooldownTime] = useState<number | null>(null);

  // Nomination Modal
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Weekly Polls & Leaderboard State
  const [weeklyQuestions, setWeeklyQuestions] = useState<any[]>([]);
  const [selectedWeeklyQ, setSelectedWeeklyQ] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

  useEffect(() => {
    loadUserData();
  }, [supabase]);

  const loadUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);

    if (session?.user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(prof);

      if (prof) {
        checkCooldown(prof.last_set_completed_at);
        loadStudentsAndQuestions(prof.id);
      }
    }
    setLoading(false);
  };

  const checkCooldown = (lastCompletedISO: string | null) => {
    if (!lastCompletedISO) return;
    const lastCompleted = new Date(lastCompletedISO).getTime();
    const now = new Date().getTime();
    const diffMs = now - lastCompleted;
    const sixtyMinsMs = 60 * 60 * 1000;

    if (diffMs < sixtyMinsMs) {
      setCooldownTime(Math.ceil((sixtyMinsMs - diffMs) / 1000));
    } else {
      setCooldownTime(null);
    }
  };

  useEffect(() => {
    if (cooldownTime === null || cooldownTime <= 0) return;
    const timer = setInterval(() => {
      setCooldownTime((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownTime]);

  const loadStudentsAndQuestions = async (currentUserId: string) => {
    // Fetch all profiles
    const { data: students } = await supabase.from("profiles").select("*");
    if (students) setAllStudents(students);

    // Fetch Standard Questions
    const { data: stdQ } = await supabase.from("standard_questions").select("*");
    if (stdQ) {
      const shuffled = [...stdQ].sort(() => 0.5 - Math.random()).slice(0, 15);
      setQuestions(shuffled);
      if (shuffled.length > 0 && students) {
        generateFourOptions(shuffled[0].id, students, currentUserId);
      }
    }

    // Fetch Weekly Questions
    const { data: wkQ } = await supabase.from("weekly_questions").select("*");
    if (wkQ) {
      setWeeklyQuestions(wkQ);
      if (wkQ.length > 0) setSelectedWeeklyQ(wkQ[0]);
    }
  };

  const generateFourOptions = async (questionId: number, students: any[], currentUserId: string) => {
    const pool = students.filter((s) => s.id !== currentUserId);

    // Check for active nominations for this question
    const { data: activeNoms } = await supabase
      .from("nominations")
      .select("*, profiles(*)")
      .eq("question_id", questionId)
      .gt("uses_remaining", 0);

    let chosen: any[] = [];

    if (activeNoms && activeNoms.length > 0) {
      const nominatedUser = activeNoms[0].profiles;
      if (nominatedUser && pool.some((p) => p.id === nominatedUser.id)) {
        chosen.push(nominatedUser);
        // Decrement nomination uses
        await supabase
          .from("nominations")
          .update({ uses_remaining: activeNoms[0].uses_remaining - 1 })
          .eq("id", activeNoms[0].id);
      }
    }

    const remainingPool = pool.filter((p) => !chosen.some((c) => c.id === p.id));
    const randomPicks = [...remainingPool].sort(() => 0.5 - Math.random()).slice(0, 4 - chosen.length);

    setOptions([...chosen, ...randomPicks]);
  };

  const handleGenderSelect = async (gender: "boy" | "girl") => {
    const { error } = await supabase
      .from("profiles")
      .update({ gender })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, gender });
    }
  };

  const handleAvatarChange = async (url: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", profile.id);

    if (!error) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  const handleShuffle = () => {
    generateFourOptions(questions[currentQIndex].id, allStudents, profile.id);
  };

  const handleVote = async (targetId: string) => {
    await supabase.from("standard_votes").insert({
      voter_id: profile.id,
      voter_gender: profile.gender,
      target_id: targetId,
      question_id: questions[currentQIndex].id,
    });

    if (currentQIndex + 1 < questions.length) {
      const nextIndex = currentQIndex + 1;
      setCurrentQIndex(nextIndex);
      generateFourOptions(questions[nextIndex].id, allStudents, profile.id);
    } else {
      // Completed 15 set!
      const nowISO = new Date().toISOString();
      await supabase
        .from("profiles")
        .update({
          last_set_completed_at: nowISO,
          aura: (profile.aura || 0) + 100, // Reward 100 aura for completion
        })
        .eq("id", profile.id);

      setProfile({
        ...profile,
        last_set_completed_at: nowISO,
        aura: (profile.aura || 0) + 100,
      });

      checkCooldown(nowISO);
    }
  };

  const handleNominate = async (targetStudent: any) => {
    if ((profile.aura || 0) < 100) {
      alert("You need at least 100 Aura points to nominate someone!");
      return;
    }

    const currentQ = questions[currentQIndex];

    await supabase.from("nominations").insert({
      nominated_profile_id: targetStudent.id,
      question_id: currentQ.id,
      uses_remaining: 3,
    });

    const newAura = profile.aura - 100;
    await supabase.from("profiles").update({ aura: newAura }).eq("id", profile.id);

    setProfile({ ...profile, aura: newAura });
    setShowNominateModal(false);
    alert(`${targetStudent.first_name} nominated! They will appear in the next options.`);
    generateFourOptions(currentQ.id, allStudents, profile.id);
  };

  // Weekly Leaderboards
  const fetchLeaderboard = async (questionId: number) => {
    const { data: votes } = await supabase
      .from("weekly_votes")
      .select("target_id, profiles!weekly_votes_target_id_fkey(*)")
      .eq("weekly_question_id", questionId);

    if (votes) {
      const counts: Record<string, { profile: any; count: number }> = {};
      votes.forEach((v: any) => {
        if (!counts[v.target_id]) {
          counts[v.target_id] = { profile: v.profiles, count: 0 };
        }
        counts[v.target_id].count += 1;
      });

      const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
      setLeaderboardData(sorted);
    }
  };

  const handleWeeklyVote = async (targetId: string) => {
    const weekIdentifier = "2026-W34"; // Fixed current week tag

    const { error } = await supabase.from("weekly_votes").insert({
      voter_id: profile.id,
      target_id: targetId,
      weekly_question_id: selectedWeeklyQ.id,
      week_identifier: weekIdentifier,
    });

    if (error) {
      alert("You have already voted on this weekly poll!");
    } else {
      alert("Weekly vote submitted!");
      fetchLeaderboard(selectedWeeklyQ.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 flex items-center justify-center font-bold">
        Loading Broward Compliments...
      </div>
    );
  }

  if (!profile || !profile.first_name || !profile.username) {
    return <Onboarding />;
  }

  // Gender Selection Screen
  if (!profile.gender || profile.gender === "unspecified") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-indigo-500/30 p-8 rounded-3xl text-center space-y-6">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
            One Quick Thing!
          </h2>
          <p className="text-sm text-slate-300">Are you a Boy or a Girl? (So classmates know who voted for them!)</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleGenderSelect("boy")}
              className="py-4 bg-indigo-600/30 border border-indigo-500/50 hover:bg-indigo-600 rounded-2xl font-bold text-lg"
            >
              Boy 👦
            </button>
            <button
              onClick={() => handleGenderSelect("girl")}
              className="py-4 bg-pink-600/30 border border-pink-500/50 hover:bg-pink-600 rounded-2xl font-bold text-lg"
            >
              Girl 👧
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Top Profile & Aura Bar */}
        <header className="flex justify-between items-center bg-slate-900 border border-indigo-500/30 p-4 rounded-2xl">
          <div className="flex items-center gap-3">
           <AvatarSelector
  currentAvatar={profile.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=default"}
  userId={profile.id}
  onSelectAvatar={handleAvatarChange}
/>
            <div>
              <h1 className="font-bold text-sm sm:text-base">{profile.first_name} {profile.last_name}</h1>
              <p className="text-xs text-slate-400">@{profile.username} • {profile.gender === "boy" ? "👦 Boy" : "👧 Girl"}</p>
            </div>
          </div>

          <div className="bg-slate-800 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-extrabold text-amber-400">
            ⚡ {profile.aura || 0} Aura
          </div>
        </header>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setMode("standard")}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              mode === "standard" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Standard Polls (15 Set)
          </button>
          <button
            onClick={() => setMode("weekly")}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              mode === "weekly" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Weekly Polls
          </button>
          <button
            onClick={() => {
              setMode("leaderboard");
              if (selectedWeeklyQ) fetchLeaderboard(selectedWeeklyQ.id);
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              mode === "leaderboard" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            🏆 Leaderboards
          </button>
        </div>

        {/* MODE 1: STANDARD 15-QUESTION SET */}
        {mode === "standard" && (
          cooldownTime !== null ? (
            <div className="bg-slate-900/90 border border-indigo-500/30 p-8 rounded-3xl text-center space-y-4">
              <h2 className="text-2xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text">
                Set Completed! 🎉
              </h2>
              <p className="text-sm text-slate-300">Take a break! Next 15-question set unlocks in:</p>
              <div className="text-4xl font-mono font-black text-amber-400">{formatSeconds(cooldownTime)}</div>
            </div>
          ) : (
            questions.length > 0 && (
              <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-3xl space-y-6">
                <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                  <span>Question {currentQIndex + 1} of 15</span>
                  <button onClick={handleShuffle} className="text-cyan-400 hover:underline">
                    🔄 Shuffle Picks
                  </button>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-center text-cyan-300">
                  "{questions[currentQIndex]?.question_text}"
                </h2>

                {/* 4 Voting Option Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleVote(option.id)}
                      className="p-4 bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700 hover:border-cyan-400 rounded-2xl flex flex-col items-center gap-2 transition active:scale-95"
                    >
                      <img
                        src={option.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=default"}
                        alt={option.first_name}
                        className="w-12 h-12 rounded-full bg-slate-950 p-1"
                      />
                      <div className="text-center">
                        <p className="font-bold text-sm text-white">{option.first_name} {option.last_name}</p>
                        <p className="text-[10px] text-slate-400">@{option.username} • {option.grade}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Nominate Button */}
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setShowNominateModal(true)}
                    className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-4 py-2 rounded-xl font-bold transition"
                  >
                    ⭐ Nominate a Classmate (100 Aura)
                  </button>
                </div>
              </div>
            )
          )
        )}

        {/* MODE 2: WEEKLY POLLS */}
        {mode === "weekly" && (
          <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-3xl space-y-6">
            <h2 className="text-lg font-bold text-cyan-300">Weekly School Polls</h2>
            <select
              value={selectedWeeklyQ?.id}
              onChange={(e) => {
                const q = weeklyQuestions.find((item) => item.id === Number(e.target.value));
                setSelectedWeeklyQ(q);
              }}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-cyan-400"
            >
              {weeklyQuestions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.question_text}
                </option>
              ))}
            </select>

            <div className="space-y-3">
              <p className="text-xs text-slate-400 font-medium">Select anyone in school to vote for them:</p>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {allStudents.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleWeeklyVote(s.id)}
                    className="p-3 bg-slate-800/60 hover:bg-indigo-600/30 border border-slate-700/80 rounded-xl flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <img src={s.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=default"} className="w-8 h-8 rounded-full bg-slate-950" />
                      <div>
                        <p className="font-bold text-sm">{s.first_name} {s.last_name}</p>
                        <p className="text-[10px] text-slate-400">@{s.username} • {s.grade}</p>
                      </div>
                    </div>
                    <span className="text-xs text-cyan-400 font-bold">Vote</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: WEEKLY LEADERBOARDS */}
        {mode === "leaderboard" && (
          <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-3xl space-y-6">
            <h2 className="text-lg font-bold text-cyan-300">Weekly Leaderboards</h2>
            <select
              value={selectedWeeklyQ?.id}
              onChange={(e) => {
                const q = weeklyQuestions.find((item) => item.id === Number(e.target.value));
                setSelectedWeeklyQ(q);
                if (q) fetchLeaderboard(q.id);
              }}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-cyan-400"
            >
              {weeklyQuestions.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.question_text}
                </option>
              ))}
            </select>

            <div className="space-y-3">
              {leaderboardData.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">No votes recorded for this poll yet!</p>
              ) : (
                leaderboardData.map((item, rank) => {
                  let rewardBadge = null;
                  if (rank === 0) rewardBadge = "🥇 1st Place (+1000 Aura)";
                  else if (rank === 1) rewardBadge = "🥈 2nd Place (+750 Aura)";
                  else if (rank === 2) rewardBadge = "🥉 3rd Place (+500 Aura)";

                  return (
                    <div
                      key={item.profile.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between ${
                        rank === 0
                          ? "bg-amber-500/10 border-amber-500/40"
                          : rank === 1
                          ? "bg-slate-400/10 border-slate-400/40"
                          : rank === 2
                          ? "bg-amber-700/10 border-amber-700/40"
                          : "bg-slate-800/40 border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-base w-6">{rank + 1}</span>
                        <img src={item.profile.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=default"} className="w-10 h-10 rounded-full bg-slate-950" />
                        <div>
                          <p className="font-bold text-sm">{item.profile.first_name} {item.profile.last_name}</p>
                          <p className="text-[10px] text-slate-400">@{item.profile.username} • {item.profile.grade}</p>
                          {rewardBadge && <p className="text-[10px] font-bold text-amber-400 mt-0.5">{rewardBadge}</p>}
                        </div>
                      </div>
                      <div className="font-black text-sm text-cyan-400">{item.count} Votes</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* NOMINATE SEARCH MODAL */}
      {showNominateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-3xl w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-amber-400">⭐ Nominate (Costs 100 Aura)</h3>
              <button onClick={() => setShowNominateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <input
              type="text"
              placeholder="Search classmate by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
            />

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {allStudents
                .filter(
                  (s) =>
                    s.id !== profile.id &&
                    (`${s.first_name} ${s.last_name} ${s.username}`).toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleNominate(s)}
                    className="p-3 bg-slate-800 hover:bg-indigo-600/30 border border-slate-700/80 rounded-xl flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <img src={s.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=default"} className="w-8 h-8 rounded-full bg-slate-950" />
                      <div>
                        <p className="font-bold text-sm">{s.first_name} {s.last_name}</p>
                        <p className="text-[10px] text-slate-400">
                          @{s.username} • {s.grade} • {s.gender === "boy" ? "👦 Boy" : "👧 Girl"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold">
                      Nominate
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
