"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Onboarding from "../components/Onboarding";
import AvatarSelector from "../components/AvatarSelector";
import InstallPWA from "../components/InstallPWA";
import AnnouncementBanner from "../components/AnnouncementBanner";
import RevealModal from "../components/RevealModal";
import StreakModal from "../components/StreakModal";
import NotificationPrompt from "../components/NotificationPrompt";
import { playSound } from "../lib/audio";

export default function Home() {
  const supabase = createClientComponentClient();

  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Styling & Theme ("dark" | "light")
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Bottom Navigation Tabs ("feed" | "play" | "profile")
  const [mainTab, setMainTab] = useState<"feed" | "play" | "profile">("play");

  // Feed Sub-tabs ("inbox" | "school" | "leaderboard")
  const [feedTab, setFeedTab] = useState<"inbox" | "school" | "leaderboard">("inbox");

  // Play Tab State
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [options, setOptions] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [skipsRemaining, setSkipsRemaining] = useState(3);
  const [cooldownTime, setCooldownTime] = useState<number | null>(null);

  // Feed Data
  const [myInbox, setMyInbox] = useState<any[]>([]);
  const [schoolActivity, setSchoolActivity] = useState<any[]>([]);
  const [auraLeaderboard, setAuraLeaderboard] = useState<any[]>([]);
  const [revealedLetters, setRevealedLetters] = useState<Record<string, string>>({});

  // Modals & Inputs
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackText, setFeedbackText] = useState("");

  // New Enhancement Modal States
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [isStreakOpen, setIsStreakOpen] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<{ hint: string; grade?: string }>({ hint: "", grade: "" });

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
        loadPlayData(prof.id);
        loadFeedData(prof.id);
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

  const loadPlayData = async (currentUserId: string) => {
    const { data: students } = await supabase.from("profiles").select("*");
    if (students) setAllStudents(students);

    const { data: stdQ } = await supabase.from("standard_questions").select("*");
    if (stdQ) {
      const shuffled = [...stdQ].sort(() => 0.5 - Math.random()).slice(0, 15);
      setQuestions(shuffled);
      if (shuffled.length > 0 && students) {
        generateFourOptions(shuffled[0].id, students, currentUserId);
      }
    }
  };

  const loadFeedData = async (currentUserId: string) => {
    const { data: inbox } = await supabase
      .from("standard_votes")
      .select("*, voter:profiles!standard_votes_voter_id_fkey(*), question:standard_questions(*)")
      .eq("target_id", currentUserId)
      .order("created_at", { ascending: false });

    if (inbox) setMyInbox(inbox);

    const { data: activity } = await supabase
      .from("standard_votes")
      .select("*, voter:profiles!standard_votes_voter_id_fkey(*), question:standard_questions(*)")
      .order("created_at", { ascending: false })
      .limit(30);

    if (activity) setSchoolActivity(activity);

    const { data: leaders } = await supabase
      .from("profiles")
      .select("*")
      .order("aura", { ascending: false })
      .limit(20);

    if (leaders) setAuraLeaderboard(leaders);

    const { data: hints } = await supabase
      .from("revealed_hints")
      .select("*")
      .eq("user_id", currentUserId);

    if (hints) {
      const map: Record<string, string> = {};
      hints.forEach((h: any) => { map[h.vote_id] = h.revealed_letter; });
      setRevealedLetters(map);
    }
  };

  const generateFourOptions = async (questionId: number, students: any[], currentUserId: string) => {
    const pool = students.filter((s) => s.id !== currentUserId);
    const randomPicks = [...pool].sort(() => 0.5 - Math.random()).slice(0, 4);
    setOptions(randomPicks);
  };

  const handleVote = async (targetId: string) => {
    // Sound & Haptic Feedback on vote
    playSound("vote");

    const pointsPerQ = Math.round(250 / 15);

    await supabase.from("standard_votes").insert({
      voter_id: profile.id,
      voter_gender: profile.gender,
      target_id: targetId,
      question_id: questions[currentQIndex].id,
    });

    const targetUser = allStudents.find((s) => s.id === targetId);
    if (targetUser) {
      await supabase
        .from("profiles")
        .update({ total_votes_received: (targetUser.total_votes_received || 0) + 1 })
        .eq("id", targetId);
    }

    const updatedAura = (profile.aura || 0) + pointsPerQ;
    await supabase.from("profiles").update({ aura: updatedAura }).eq("id", profile.id);
    setProfile({ ...profile, aura: updatedAura });

    if (currentQIndex + 1 < questions.length) {
      const nextIndex = currentQIndex + 1;
      setCurrentQIndex(nextIndex);
      generateFourOptions(questions[nextIndex].id, allStudents, profile.id);
    } else {
      const nowISO = new Date().toISOString();
      await supabase
        .from("profiles")
        .update({ last_set_completed_at: nowISO })
        .eq("id", profile.id);

      setProfile({ ...profile, last_set_completed_at: nowISO });
      checkCooldown(nowISO);
      
      // Trigger streak milestone popup upon set completion
      setIsStreakOpen(true);
    }
  };

  const handleSkip = () => {
    if (skipsRemaining <= 0) return;
    setSkipsRemaining((prev) => prev - 1);

    if (currentQIndex + 1 < questions.length) {
      const nextIndex = currentQIndex + 1;
      setCurrentQIndex(nextIndex);
      generateFourOptions(questions[nextIndex].id, allStudents, profile.id);
    }
  };

  const handleRevealFirstLetter = async (voteItem: any) => {
    if ((profile.aura || 0) < 5000) {
      alert("You need 5,000 Aura points to reveal the first letter!");
      return;
    }

    playSound("boost");

    const firstLetter = voteItem.voter?.first_name?.[0]?.toUpperCase() || "?";

    await supabase.from("revealed_hints").insert({
      user_id: profile.id,
      vote_id: voteItem.id,
      revealed_letter: firstLetter,
    });

    const newAura = profile.aura - 5000;
    await supabase.from("profiles").update({ aura: newAura }).eq("id", profile.id);

    setProfile({ ...profile, aura: newAura });
    setRevealedLetters({ ...revealedLetters, [voteItem.id]: firstLetter });

    // Open Reveal Modal with animation
    setSelectedVoter({
      hint: `Name starts with "${firstLetter}"`,
      grade: `${voteItem.voter?.grade || "Classmate"} • ${getGraduationClass(voteItem.voter?.grade)}`,
    });
    setIsRevealOpen(true);
  };

  const handleLeaveFeedback = async () => {
    if (!feedbackText.trim()) return;
    await supabase.from("feedback").insert({
      user_id: profile.id,
      message: feedbackText,
    });
    setFeedbackText("");
    alert("Feedback sent! Thanks for making the app better.");
  };

  const getGraduationClass = (grade: string) => {
    if (grade?.includes("9") || grade?.toLowerCase().includes("freshman")) return "C/O 2029";
    if (grade?.includes("10") || grade?.toLowerCase().includes("sophomore")) return "C/O 2028";
    if (grade?.includes("11") || grade?.toLowerCase().includes("junior")) return "C/O 2027";
    if (grade?.includes("12") || grade?.toLowerCase().includes("senior")) return "C/O 2026";
    return "High School";
  };

  const timeAgo = (dateISO: string) => {
    if (!dateISO) return "";
    const seconds = Math.floor((new Date().getTime() - new Date(dateISO).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-cyan-400 flex items-center justify-center font-bold">
        Loading...
      </div>
    );
  }

  if (!profile || !profile.first_name || !profile.username) {
    return <Onboarding />;
  }

  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900";
  const cardBg = isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const innerCardBg = isDark ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200";

  return (
    <div className={`min-h-screen pb-24 ${bgClass} transition-colors duration-300 font-sans`}>
      <InstallPWA />
      <div className="max-w-md mx-auto p-4 space-y-4">

        {/* TOP BAR */}
        <div className={`flex justify-between items-center p-4 rounded-2xl border ${cardBg}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <div>
              <span className="font-extrabold text-sm">{profile.streak || 1} Day Streak</span>
              <p className="text-[10px] text-emerald-400 font-bold">+{(profile.streak || 1) * 5}% Aura Boost</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="p-2 rounded-xl bg-slate-700/30 text-xs font-bold"
            >
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <Link
              href="/shop"
              className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-black text-amber-400 hover:bg-amber-500/20 transition"
            >
              ⚡ {profile.aura || 0}
            </Link>
          </div>
        </div>

        {/* TAB 1: FEED */}
        {mainTab === "feed" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            
            {/* Feed Sub Tabs */}
            <div className={`flex p-1 rounded-2xl border ${cardBg}`}>
              <button
                onClick={() => setFeedTab("inbox")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${feedTab === "inbox" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                📥 Inbox ({myInbox.length})
              </button>
              <button
                onClick={() => setFeedTab("school")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${feedTab === "school" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                🏫 School
              </button>
              <button
                onClick={() => setFeedTab("leaderboard")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${feedTab === "leaderboard" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                🏆 Aura Leaders
              </button>
            </div>

            {/* INBOX SUB-TAB */}
            {feedTab === "inbox" && (
              <div className="space-y-3">
                <AnnouncementBanner />

                {myInbox.length === 0 ? (
                  <div className={`p-8 text-center rounded-2xl border ${cardBg} text-slate-400 text-xs`}>
                    No votes received yet. Play more polls to get noticed!
                  </div>
                ) : (
                  myInbox.map((item) => {
                    const isGirl = item.voter_gender === "girl";
                    const heart = isGirl ? "💖" : "💙";
                    const revealedLetter = revealedLetters[item.id];

                    return (
                      <div key={item.id} className={`p-4 rounded-2xl border space-y-3 ${cardBg}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                              {timeAgo(item.created_at)}
                            </span>
                            <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wide">You Got Voted!</span>
                            <h3 className="font-extrabold text-base mt-0.5">"{item.question?.question_text}"</h3>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-slate-800">
                          <span className="font-semibold">
                            from {item.voter?.grade || "Classmate"} {heart} • {getGraduationClass(item.voter?.grade)}
                          </span>

                          {revealedLetter ? (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-black">
                              Starts with "{revealedLetter}"
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRevealFirstLetter(item)}
                              className="bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg font-extrabold text-[11px]"
                            >
                              🔍 First Letter (5000 Aura)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* SCHOOL SUB-TAB */}
            {feedTab === "school" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Recent Activity</span>
                  <Link
                    href="/submit-question"
                    className="px-3 py-1.5 text-xs font-extrabold rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow hover:opacity-90 transition-all flex items-center gap-1"
                  >
                    <span>+</span> Submit Question
                  </Link>
                </div>

                {schoolActivity.map((item) => (
                  <div key={item.id} className={`p-4 rounded-2xl border space-y-2 ${cardBg}`}>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Someone voted for a classmate</span>
                      <span className="text-[10px]">{timeAgo(item.created_at)}</span>
                    </div>
                    <p className="font-bold text-sm">"{item.question?.question_text}"</p>
                    <p className="text-xs text-slate-400">
                      • {item.voter_gender === "girl" ? "👧 Girl" : "👦 Boy"} from {getGraduationClass(item.voter?.grade)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* AURA LEADERBOARD SUB-TAB */}
            {feedTab === "leaderboard" && (
              <div className="space-y-2">
                {auraLeaderboard.map((student, rank) => (
                  <div key={student.id} className={`p-3 rounded-2xl border flex items-center justify-between ${cardBg}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm w-5">{rank + 1}</span>
                      <img src={student.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=default"} className="w-9 h-9 rounded-full bg-slate-950" />
                      <div>
                        <p className="font-bold text-xs">{student.first_name} {student.last_name}</p>
                        <p className="text-[10px] text-slate-400">@{student.username} • {student.high_school}</p>
                      </div>
                    </div>
                    <span className="font-black text-xs text-amber-400">⚡ {student.aura || 0}</span>
                  </div>
                ))}
              </div>
            )}

          </motion.div>
        )}

        {/* TAB 2: PLAY */}
        {mainTab === "play" && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            {cooldownTime !== null ? (
              <div className={`p-8 text-center rounded-3xl border space-y-3 ${cardBg}`}>
                <h2 className="text-2xl font-black text-cyan-400">Set Completed! 🎉</h2>
                <p className="text-xs text-slate-400">Next 15-question set unlocks in:</p>
                <div className="text-4xl font-mono font-black text-amber-400">{formatSeconds(cooldownTime)}</div>
              </div>
            ) : (
              questions.length > 0 && (
                <div className={`p-6 rounded-3xl border space-y-6 ${cardBg}`}>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>Q {currentQIndex + 1} of 15</span>
                    <div className="flex gap-3">
                      <button onClick={handleSkip} disabled={skipsRemaining <= 0} className="text-amber-400 hover:underline disabled:opacity-40">
                        ⏭️ Skip ({skipsRemaining} left)
                      </button>
                      <button onClick={() => generateFourOptions(questions[currentQIndex].id, allStudents, profile.id)} className="text-cyan-400 hover:underline">
                        🔄 Shuffle
                      </button>
                    </div>
                  </div>

                  <h2 className="text-xl font-extrabold text-center text-cyan-400 min-h-[60px] flex items-center justify-center">
                    "{questions[currentQIndex]?.question_text}"
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    {options.map((option) => (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        key={option.id}
                        onClick={() => handleVote(option.id)}
                        className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition ${innerCardBg}`}
                      >
                        <img src={option.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=default"} className="w-12 h-12 rounded-full bg-slate-950 p-1 object-cover" />
                        <div className="text-center">
                          <p className="font-bold text-xs">{option.first_name} {option.last_name}</p>
                          <p className="text-[10px] text-slate-400">@{option.username}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      playSound("boost");
                      setShowNominateModal(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl font-bold transition-all shadow-md bg-amber-400 hover:bg-amber-500 text-slate-950 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300 dark:border dark:border-amber-500/40 text-xs"
                  >
                    ⭐ Nominate Classmate (100 Aura)
                  </button>
                </div>
              )
            )}
          </motion.div>
        )}

        {/* TAB 3: PROFILE */}
        {mainTab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div className="flex items-center gap-4">
                <AvatarSelector
                  currentAvatar={profile.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=default"}
                  userId={profile.id}
                  onSelectAvatar={(url) => setProfile({ ...profile, avatar_url: url })}
                />
                <div>
                  <h2 className="text-lg font-black">{profile.first_name} {profile.last_name}</h2>
                  <p className="text-xs text-slate-400">@{profile.username} • {profile.high_school}</p>
                  <p className="text-xs text-slate-400">{profile.grade} • {getGraduationClass(profile.grade)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className={`p-3 rounded-2xl border text-center ${innerCardBg}`}>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Votes Received</p>
                  <p className="text-xl font-black text-cyan-400">{profile.total_votes_received || 0}</p>
                </div>
                <div className={`p-3 rounded-2xl border text-center ${innerCardBg}`}>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Aura Balance</p>
                  <p className="text-xl font-black text-amber-400">⚡ {profile.aura || 0}</p>
                </div>
              </div>

              {/* AURA BOOST STORE LINK */}
              <div className="pt-2 border-t border-slate-800">
                <Link
                  href="/shop"
                  className="w-full py-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold flex justify-center items-center gap-2 hover:bg-indigo-600/30 transition"
                >
                  🛒 Open Aura Boost Store
                </Link>
              </div>

              {/* FEEDBACK */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h3 className="text-xs font-extrabold uppercase text-slate-400">App Feedback</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tell us what to improve..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className={`flex-1 p-2.5 rounded-xl border text-xs ${innerCardBg}`}
                  />
                  <button onClick={handleLeaveFeedback} className="px-4 py-2.5 bg-slate-700 rounded-xl text-xs font-bold text-white">
                    Submit
                  </button>
                </div>
              </div>

              <button onClick={() => supabase.auth.signOut()} className="w-full py-2.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold">
                Logout
              </button>
            </div>
          </motion.div>
        )}

      </div>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t ${cardBg} p-2 flex justify-around items-center z-40 backdrop-blur-lg`}>
        <button
          onClick={() => setMainTab("feed")}
          className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl font-bold transition ${mainTab === "feed" ? "text-indigo-400" : "text-slate-500"}`}
        >
          <span className="text-lg">📥</span>
          <span className="text-[10px]">Feed</span>
        </button>

        <button
          onClick={() => setMainTab("play")}
          className={`flex flex-col items-center gap-1 px-6 py-1.5 rounded-2xl font-bold transition ${mainTab === "play" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-slate-500"}`}
        >
          <span className="text-xl">🎮</span>
          <span className="text-[10px]">Play</span>
        </button>

        <button
          onClick={() => setMainTab("profile")}
          className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl font-bold transition ${mainTab === "profile" ? "text-indigo-400" : "text-slate-500"}`}
        >
          <span className="text-lg">👤</span>
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>

      {/* NOMINATE MODAL */}
      {showNominateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl w-full max-w-md space-y-4 border ${cardBg}`}>
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-amber-400">⭐ Nominate Classmate (100 Aura)</h3>
              <button onClick={() => setShowNominateModal(false)} className="text-slate-400">✕</button>
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs ${innerCardBg}`}
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {allStudents
                .filter((s) => s.id !== profile.id && (`${s.first_name} ${s.last_name}`).toLowerCase().includes(searchQuery.toLowerCase()))
                .map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      alert(`${s.first_name} nominated!`);
                      setShowNominateModal(false);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${innerCardBg}`}
                  >
                    <span className="font-bold text-xs">{s.first_name} {s.last_name}</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md font-bold">Select</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ENHANCEMENT COMPONENTS */}
      <NotificationPrompt />

      <RevealModal
        isOpen={isRevealOpen}
        onClose={() => setIsRevealOpen(false)}
        voterInfo={selectedVoter}
      />

      <StreakModal
        isOpen={isStreakOpen}
        onClose={() => setIsStreakOpen(false)}
        streakCount={profile?.streak || 1}
        auraBonus={250}
      />

    </div>
  );
}
