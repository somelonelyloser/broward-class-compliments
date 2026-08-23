"use client";

import InstallPWA from "./InstallPWA";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Step = 1 | 2 | 3 | 4;

interface OnboardingProps {
  onSuccess?: () => void;
}

export default function Onboarding({ onSuccess }: OnboardingProps) {
  const supabase = createClientComponentClient();
  const [mode, setMode] = useState<"onboarding" | "signin">("onboarding");

  // Sign In State
  const [signInMethod, setSignInMethod] = useState<"name" | "email">("name");
  const [signInFirstName, setSignInFirstName] = useState("");
  const [signInLastName, setSignInLastName] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState("");

  // Onboarding Wizard State
  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [grade, setGrade] = useState("");
  const [highSchool, setHighSchool] = useState("");

  const [idImage, setIdImage] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Debounced Username Availability Check
  useEffect(() => {
    if (!username.trim() || username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const cleanUsername = username.trim().toLowerCase();
      
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", cleanUsername)
        .maybeSingle();

      setIsUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [username, supabase]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");
    setSignInLoading(true);

    try {
      let targetEmail = signInEmail.trim();

      // Look up email if signing in with First + Last Name
      if (signInMethod === "name") {
        const { data: userProfile, error: profileErr } = await supabase
          .from("profiles")
          .select("email")
          .ilike("first_name", signInFirstName.trim())
          .ilike("last_name", signInLastName.trim())
          .maybeSingle();

        if (profileErr || !userProfile?.email) {
          throw new Error("No account found matching that first and last name.");
        }

        targetEmail = userProfile.email;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: signInPassword,
      });

      if (authError) throw authError;

      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setSignInError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setSignInLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIdImage(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  const handleCompleteOnboarding = async (skipVerification: boolean) => {
    setLoading(true);
    setErrorMsg("");

    let { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError || !anonData.session) {
        setErrorMsg("Could not establish a connection session. Please try again.");
        setLoading(false);
        return;
      }
      session = anonData.session;
    }

    let verificationUrl = null;
    let verificationStatus = "unverified";

    if (!skipVerification && idImage) {
      const fileExt = idImage.name.split(".").pop();
      const filePath = `${session.user.id}/school_id.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("verifications")
        .upload(filePath, idImage, { upsert: true });

      if (uploadError) {
        setErrorMsg("Failed to upload ID badge: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("verifications")
        .getPublicUrl(filePath);

      verificationUrl = publicUrlData.publicUrl;
      verificationStatus = "pending";
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: session.user.id,
        email: session.user.email ?? null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim().toLowerCase(),
        grade,
        high_school: highSchool,
        verification_status: verificationStatus,
        verification_image_url: verificationUrl,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      setErrorMsg(profileError.message);
      setLoading(false);
    } else {
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950">
      <InstallPWA />
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 p-6 sm:p-8 lg:p-10 rounded-3xl shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)] transition-all duration-300">
        
        {/* Top Toggle Switch */}
        <div className="flex p-1 bg-slate-800/80 rounded-2xl mb-6 border border-slate-700/50">
          <button
            onClick={() => { setSignInError(""); setMode("signin"); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === "signin" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setErrorMsg(""); setMode("onboarding"); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === "onboarding" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* SIGN IN VIEW */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4 animate-fadeIn">
            <div className="text-center space-y-1 mb-4">
              <h2 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                Welcome Back
              </h2>
              <p className="text-slate-400 text-xs">Sign in to access your polls and aura</p>
            </div>

            {signInError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {signInError}
              </div>
            )}

            <div className="flex gap-2 p-1 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <button
                type="button"
                onClick={() => setSignInMethod("name")}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                  signInMethod === "name" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "text-slate-400"
                }`}
              >
                First & Last Name
              </button>
              <button
                type="button"
                onClick={() => setSignInMethod("email")}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
                  signInMethod === "email" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "text-slate-400"
                }`}
              >
                Email
              </button>
            </div>

            {signInMethod === "name" ? (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={signInFirstName}
                  onChange={(e) => setSignInFirstName(e.target.value)}
                  className="p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-xs"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  value={signInLastName}
                  onChange={(e) => setSignInLastName(e.target.value)}
                  className="p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-xs"
                />
              </div>
            ) : (
              <input
                type="email"
                placeholder="Email Address"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-xs"
              />
            )}

            <input
              type="password"
              placeholder="Password"
              required
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-xs"
            />

            <button
              type="submit"
              disabled={signInLoading}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-40 transition text-sm"
            >
              {signInLoading ? "Signing In..." : "Sign In →"}
            </button>
          </form>
        )}

        {/* ONBOARDING WIZARD VIEW */}
        {mode === "onboarding" && (
          <>
            {/* Step Indicator Bar */}
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full mx-1 transition-all duration-500 ${
                    i <= step ? "bg-gradient-to-r from-cyan-400 to-indigo-500" : "bg-slate-800"
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm">
                {errorMsg}
              </div>
            )}

            {/* STEP 1: Name & Unique Username */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                    Identity & Handle
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Let's start with who you are</p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all text-sm placeholder:text-slate-500"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all text-sm placeholder:text-slate-500"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Username (e.g. iAMZAYDII)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      className="w-full p-3 rounded-xl bg-slate-800/80 text-white border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:outline-none transition-all text-sm placeholder:text-slate-500"
                    />
                    
                    <div className="min-h-[20px] mt-1.5 px-1 flex items-center text-xs">
                      {checkingUsername && <span className="text-slate-400 animate-pulse">Checking availability...</span>}
                      {!checkingUsername && isUsernameAvailable === true && (
                        <span className="text-emerald-400 font-medium">✓ Username available</span>
                      )}
                      {!checkingUsername && isUsernameAvailable === false && (
                        <span className="text-rose-400 font-medium">✗ Username is taken</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!firstName.trim() || !lastName.trim() || !isUsernameAvailable}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] text-sm sm:text-base"
                >
                  Next →
                </button>
              </div>
            )}

            {/* STEP 2: Grade Selection */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                    Select Your Class
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Choose your graduation year</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "9th Grade", classOf: "C/O 30'" },
                    { label: "10th Grade", classOf: "C/O 29'" },
                    { label: "11th Grade", classOf: "C/O 28'" },
                    { label: "12th Grade", classOf: "C/O 27'" },
                  ].map((g) => (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => setGrade(g.label)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                        grade === g.label
                          ? "bg-indigo-600/30 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                          : "bg-slate-800/60 border-slate-700/80 hover:border-slate-500"
                      }`}
                    >
                      <p className="font-bold text-sm sm:text-base text-white">{g.label}</p>
                      <p className="text-xs text-cyan-400 font-medium">{g.classOf}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!grade}
                    className="w-2/3 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-40 transition text-sm sm:text-base"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: High School Selection */}
            {step === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                    Choose High School
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Select your active Broward campus</p>
                </div>

                <div className="space-y-3">
                  {[
                    "Pompano Beach High School",
                    "Blanche Ely High School",
                    "Coconut Creek High School",
                  ].map((school) => (
                    <button
                      key={school}
                      type="button"
                      onClick={() => setHighSchool(school)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 ${
                        highSchool === school
                          ? "bg-indigo-600/30 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                          : "bg-slate-800/60 border-slate-700/80 hover:border-slate-500"
                      }`}
                    >
                      <p className="font-bold text-sm sm:text-base text-white">{school}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="w-1/3 py-3 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!highSchool}
                    className="w-2/3 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-40 transition text-sm sm:text-base"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Poll Creator Verification */}
            {step === 4 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500 bg-clip-text text-transparent">
                    Poll Creator Verification
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Upload your Student ID badge (Name, Photo & School must be visible) to create custom polls.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="block w-full cursor-pointer p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-400 bg-slate-800/40 text-center transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {idPreview ? (
                      <img
                        src={idPreview}
                        alt="ID Preview"
                        className="max-h-36 mx-auto rounded-xl border border-slate-600 object-cover"
                      />
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-300">Tap to upload School ID</p>
                        <p className="text-xs text-slate-500">PNG, JPG or WEBP accepted</p>
                      </div>
                    )}
                  </label>

                  {idImage && (
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs text-center">
                      ⏳ Verification approval takes up to 72 hours.
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleCompleteOnboarding(false)}
                    disabled={loading || !idImage}
                    className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-40 transition text-sm sm:text-base"
                  >
                    {loading ? "Submitting..." : "Submit for Verification →"}
                  </button>

                  <button
                    onClick={() => handleCompleteOnboarding(true)}
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-slate-400 hover:text-slate-200 transition text-xs sm:text-sm"
                  >
                    Skip for now (Can't create polls yet)
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
