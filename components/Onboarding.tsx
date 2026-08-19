
"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [username, setUsername] = useState("");
  const [schools, setSchools] = useState<any[]>([]);
  const [requireIdVerification, setRequireIdVerification] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setGrade(data.grade || "");
        setSchoolId(data.school_id || "");
        setUsername(data.username || "");
      }
      setLoading(false);
    }

    async function fetchSchools() {
      // This would ideally fetch from a "schools" table in Supabase
      // For now, a placeholder array
      setSchools([
        { id: "1", name: "Pompano Beach High School" },
        { id: "2", name: "Blanche Ely High School" },
        { id: "3", name: "Fort Lauderdale High School" },
      ]);
    }

    async function fetchAppSettings() {
      const { data, error } = await supabase
        .from("app_settings")
        .select("require_id_verification")
        .single();

      if (error) {
        console.error("Error fetching app settings:", error);
      } else if (data) {
        setRequireIdVerification(data.require_id_verification);
      }
    }

    fetchProfile();
    fetchSchools();
    fetchAppSettings();
  }, [supabase, router]);

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        grade: grade,
        school_id: schoolId,
        username: username,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
    } else {
      alert("Profile updated successfully!");
      // Redirect to dashboard or home page after onboarding
      router.push("/dashboard");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (profile && profile.username && (!requireIdVerification || profile.verification_status === "approved")) {
    // If profile is complete and ID verification is not required or approved, redirect to dashboard
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Complete Your Profile</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <div className="mb-4">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">Full Name</label>
          <input
            type="text"
            id="fullName"
            className="mt-1 block w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
          <input
            type="text"
            id="username"
            className="mt-1 block w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="grade" className="block text-sm font-medium text-gray-300">Grade</label>
          <select
            id="grade"
            className="mt-1 block w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="">Select Grade</option>
            <option value="9">9th Grade</option>
            <option value="10">10th Grade</option>
            <option value="11">11th Grade</option>
            <option value="12">12th Grade</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="school" className="block text-sm font-medium text-gray-300">High School</label>
          <select
            id="school"
            className="mt-1 block w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
          >
            <option value="">Select School</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        {requireIdVerification && profile?.verification_status !== "approved" && (
          <div className="mb-4 p-4 bg-yellow-800 rounded-md">
            <p className="text-yellow-200">ID Verification Required:</p>
            <p className="text-yellow-200 text-sm">Please upload a photo of your student ID to continue using interactive features.</p>
            {/* Placeholder for ID upload component */}
            <button className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Upload ID</button>
          </div>
        )}

        <button
          onClick={handleSaveProfile}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
