"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [requireIdVerification, setRequireIdVerification] = useState(false);
  const [feedbackQueue, setFeedbackQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFeedbackQueue() {
    const { data, error } = await supabase.from("feedback").select("*");
    if (error) {
      console.error("Error fetching feedback queue:", error);
    } else if (data) {
      setFeedbackQueue(data);
    }
  }

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!profile?.is_admin) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      await fetchFeedbackQueue();
      setLoading(false);
    }

    checkAdmin();
  }, []);

  if (loading) return <p className="p-4 text-white">Loading...</p>;
  if (!isAdmin) return null;

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p>Feedback Queue Items: {feedbackQueue.length}</p>
    </div>
  );
}
