
"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.unsubscribe();
    };
  }, [supabase.auth]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Login</h2>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["google"]}
            redirectTo="http://localhost:3000/dashboard"
          />
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Welcome!</h2>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setSession(null);
          }}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>
    );
  }
}
