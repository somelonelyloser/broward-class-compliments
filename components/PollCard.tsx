
"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function PollCard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [currentPoll, setCurrentPoll] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);

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
        .eq("active_date", new Date().toISOString().split("T")[0]) // Today's poll
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

  const handleVote = async () => {
    if (!selectedOption || !profile || !currentPoll) return;

    const { error } = await supabase.from("votes").insert({
      poll_id: currentPoll.id,
      voter_id: profile.id,
      recipient_id: selectedOption,
    });

    if (error) {
      console.error("Error casting vote:", error);
    } else {
      alert("Vote cast successfully!");
      // Update Aura points and streak
      const today = new Date().toISOString().split("T")[0];
      const lastVoteDate = profile.last_vote_date;
      let newStreak = profile.voting_streak + 1;

      if (lastVoteDate) {
        const lastVoteDay = new Date(lastVoteDate);
        const todayDate = new Date(today);
        const diffTime = Math.abs(todayDate.getTime() - lastVoteDay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          newStreak = 1; // Reset streak if not consecutive
        }
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          aura_points: profile.aura_points + (10 * profile.aura_multiplier),
          voting_streak: newStreak,
          last_vote_date: today,
        })
        .eq("id", profile.id);

      if (updateError) {
        console.error("Error updating profile Aura/streak:", updateError);
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (!profile || (profile.verification_status !== "approved" && profile.require_id_verification)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Please complete your profile and verify your ID to access polls.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Daily Poll</h1>

      {currentPoll ? (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">{currentPoll.question}</h2>
          <div className="space-y-4">
            {/* Placeholder for poll options - ideally fetched from another table */}
            <label className="flex items-center bg-gray-700 p-3 rounded-md">
              <input
                type="radio"
                name="pollOption"
                value="student1_id"
                checked={selectedOption === "student1_id"}
                onChange={() => setSelectedOption("student1_id")}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-3">Student 1</span>
            </label>
            <label className="flex items-center bg-gray-700 p-3 rounded-md">
              <input
                type="radio"
                name="pollOption"
                value="student2_id"
                checked={selectedOption === "student2_id"}
                onChange={() => setSelectedOption("student2_id")}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-3">Student 2</span>
            </label>
          </div>
          <button
            onClick={handleVote}
            className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={!selectedOption}
          >
            Submit Vote
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <p>No active poll today. Check back later!</p>
          <button
            onClick={generateReferralLink}
            className="mt-4 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Generate Referral Link to Unlock Early
          </button>
          {referralLink && (
            <p className="mt-4 text-sm text-gray-400">Share this link: {referralLink}</p>
          )}
        </div>
      )}

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Your Aura: {profile?.aura_points || 0}</h2>
        <p>Voting Streak: {profile?.voting_streak || 0} days</p>
        {profile?.aura_multiplier > 1 && (
          <p>Aura Multiplier: {profile.aura_multiplier}x (ends {new Date(profile.aura_multiplier_end_date).toLocaleDateString()})</p>
        )}
        {/* Aura utility and power-ups will be implemented here */}
      </div>
    </div>
  );
}
