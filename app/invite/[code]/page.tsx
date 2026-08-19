'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '../../../lib/context';
import { Profile, getLocalData, saveLocalData, broadcastChange } from '../../../lib/supabase';
import { Sparkles, UserPlus, Gift, Landmark } from 'lucide-react';
import Onboarding from '../../../components/Onboarding';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const { profiles, schools } = useApp();
  
  const [referrer, setReferrer] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!code) return;

    // In a full Supabase DB we would fetch the referral_link and the profile.
    // In our robust combined state manager, we find the link in local storage:
    const referralLinks = getLocalData<any[]>('bcc_referral_links', []);
    const link = referralLinks.find(l => l.code === code);
    
    if (link) {
      const foundReferrer = profiles.find(p => p.id === link.referrer_id);
      if (foundReferrer) {
        setReferrer(foundReferrer);
      }
    }
    setLoading(false);
  }, [code, profiles]);

  const handleOnboardingSuccess = () => {
    // Increment the referrer's invite usage
    const referralLinks = getLocalData<any[]>('bcc_referral_links', []);
    const linkIndex = referralLinks.findIndex(l => l.code === code);
    
    if (linkIndex !== -1) {
      referralLinks[linkIndex].uses = (referralLinks[linkIndex].uses || 0) + 1;
      saveLocalData('bcc_referral_links', referralLinks);

      // Reward the referrer with 100 Aura points for each successful referral!
      const allProfiles = getLocalData<Profile[]>('bcc_profiles', []);
      const refIndex = allProfiles.findIndex(p => p.id === referralLinks[linkIndex].referrer_id);
      if (refIndex !== -1) {
        allProfiles[refIndex].aura_points = (allProfiles[refIndex].aura_points || 0) + 100;
        saveLocalData('bcc_profiles', allProfiles);
        broadcastChange('profiles', allProfiles);
      }
    }

    setJoined(true);
    setTimeout(() => {
      router.push('/');
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const schoolName = referrer 
    ? schools.find(s => s.id === referrer.school_id)?.name || 'Broward High School'
    : 'Broward High School';

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4 flex flex-col items-center justify-center">
      {joined ? (
        <div className="max-w-md text-center p-8 bg-card backdrop-blur-glass border border-emerald-500/20 rounded-3xl shadow-glass animate-fadeIn">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500/15 rounded-full mb-4">
            <Gift className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Welcome Aboard!</h2>
          <p className="text-gray-400 text-sm mb-4">
            You successfully joined using {referrer?.full_name || 'your classmate'}'s invitation! We're redirecting you to your main dashboard.
          </p>
          <div className="text-xs text-primary font-bold animate-pulse">
            Booting up Broward Compliments Platform...
          </div>
        </div>
      ) : (
        <div className="w-full max-w-lg space-y-6 animate-fadeIn">
          {referrer && (
            <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-card backdrop-blur-glass border border-white/10 rounded-3xl p-6 text-center shadow-glass relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-white mb-1 flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                You've been invited!
              </h2>
              <p className="text-gray-300 text-sm">
                <span className="font-extrabold text-primary">{referrer.full_name}</span> (@{referrer.username}) from <span className="font-semibold text-secondary">{schoolName}</span> invited you to join the positive-polling platform.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 bg-yellow-400/15 text-yellow-300 text-xs font-bold px-3 py-1.5 rounded-full border border-yellow-400/25">
                🎁 Creating an account unlocks +100 Aura points for them!
              </div>
            </div>
          )}

          {/* Onboarding component */}
          <Onboarding onSuccess={handleOnboardingSuccess} />
        </div>
      )}
    </div>
  );
}
