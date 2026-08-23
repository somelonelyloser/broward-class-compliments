"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function SubmitQuestion() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [questionText, setQuestionText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      alert("You must be logged in to submit a question.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("standard_questions").insert({
      question_text: questionText.trim(),
      created_by: session.user.id,
    });

    setLoading(false);

    if (error) {
      alert("Failed to submit question. Please try again.");
    } else {
      alert("Question submitted successfully!");
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-black text-cyan-400">Submit a Question</h1>
          <button
            onClick={() => router.back()}
            className="text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              YOUR POLL QUESTION
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g., Most likely to start their own tech business?"
              className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 resize-none h-28"
              maxLength={120}
              required
            />
            <span className="text-[10px] text-slate-500 float-right">
              {120 - questionText.length} characters left
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || !questionText.trim()}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-xl font-extrabold text-sm text-white shadow-lg disabled:opacity-50 transition"
          >
            {loading ? "Submitting..." : "Submit for Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
