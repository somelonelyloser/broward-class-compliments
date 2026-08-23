"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function SubmitQuestion() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [questionText, setQuestionText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("You must be logged in to submit a question.");
      setLoading(false);
      return;
    }

    let imageUrl = null;

    // Handle Image Upload if selected
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("question-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        alert("Failed to upload image.");
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("question-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    // Insert Question record into Database
    const { error } = await supabase.from("submitted_questions").insert({
      question_text: questionText.trim(),
      submitter_id: session.user.id,
      status: "pending",
      is_anonymous: isAnonymous,
      image_url: imageUrl,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Failed to submit question. Check database fields.");
    } else {
      alert("Question submitted for review!");
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
            type="button"
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
              className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 resize-none h-24"
              maxLength={120}
              required
            />
          </div>

          {/* Optional Image Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              ATTACH IMAGE (OPTIONAL)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700"
            />
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
            />
            <label htmlFor="anonymous" className="text-xs font-bold text-slate-300 cursor-pointer">
              Submit Anonymously (Hide your handle)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !questionText.trim()}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-xl font-extrabold text-sm text-white shadow-lg disabled:opacity-50 transition hover:opacity-90"
          >
            {loading ? "Submitting..." : "Submit for Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
