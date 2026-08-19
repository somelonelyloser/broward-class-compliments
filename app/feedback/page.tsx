
"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function FeedbackPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      feedback_text: feedbackText,
    });

    if (error) {
      console.error("Error submitting feedback:", error);
      setMessage("Failed to submit feedback. Please try again.");
    } else {
      setMessage("Feedback submitted successfully! Thank you.");
      setFeedbackText("");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Submit Feedback</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <div className="mb-4">
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-300">Your Feedback</label>
          <textarea
            id="feedback"
            className="mt-1 block w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white h-32"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Tell us what you think..."
          ></textarea>
        </div>

        <button
          onClick={handleSubmitFeedback}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={submitting || feedbackText.trim() === ""}
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>

        {message && <p className="mt-4 text-sm text-green-400">{message}</p>}
      </div>
    </div>
  );
}
