'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  Profile,
  School,
  Poll,
  Vote,
  LeaderboardStat,
  MOCK_SCHOOLS,
  MOCK_POLLS,
  getLocalData,
  saveLocalData,
  subscribeToChanges,
  broadcastChange
} from './supabase';

interface AppContextType {
  currentUser: Profile | null;
  schools: School[];
  polls: Poll[];
  votes: Vote[];
  profiles: Profile[];
  isSupabase: boolean;
  loading: boolean;
  signUp: (fullName: string, username: string, grade: number, schoolId: string, role?: 'student' | 'admin') => Promise<Profile>;
  login: (username: string) => Promise<Profile>;
  logout: () => void;
  castVote: (pollId: string, recipientId: string) => Promise<boolean>;
  getLeaderboard: (filterSchoolId?: string, filterGrade?: number, showCounty?: boolean) => LeaderboardStat[];
  getReceivedCompliments: (userId: string) => { id: string; question: string; category: string; created_at: string }[];
  getAdminVotes: () => (Vote & { voter_name: string; recipient_name: string; question: string })[];
  togglePerks: (profileId: string) => void;
  deleteProfile: (profileId: string) => void;
  deleteVote: (voteId: string) => void;
  editProfile: (profileId: string, updates: Partial<Profile>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_PROFILES_KEY = 'bcc_profiles';
const LOCAL_VOTES_KEY = 'bcc_votes';
const LOCAL_CURRENT_USER_KEY = 'bcc_current_user';

const DEFAULT_PROFILES: Profile[] = [
  { id: 'user-1', full_name: 'Sophia Martinez', username: 'sophiam', grade: 12, school_id: 'pompano_beach_high', role: 'student', perks_enabled: true, created_at: new Date().toISOString() },
  { id: 'user-2', full_name: 'Marcus Chen', username: 'marcus_codes', grade: 11, school_id: 'pompano_beach_high', role: 'student', perks_enabled: false, created_at: new Date().toISOString() },
  { id: 'user-3', full_name: 'Emma Johnson', username: 'emma_j', grade: 10, school_id: 'pompano_beach_high', role: 'student', perks_enabled: false, created_at: new Date().toISOString() },
  { id: 'user-4', full_name: 'Tyler Broward', username: 'tyler_b', grade: 9, school_id: 'pompano_beach_high', role: 'student', perks_enabled: false, created_at: new Date().toISOString() },
  { id: 'user-admin', full_name: 'Admin Principal Ramirez', username: 'admin', grade: 12, school_id: 'pompano_beach_high', role: 'admin', perks_enabled: false, created_at: new Date().toISOString() },
  { id: 'user-5', full_name: 'Isabella Rossi', username: 'isabella_r', grade: 12, school_id: 'cypress_bay_high', role: 'student', perks_enabled: true, created_at: new Date().toISOString() },
  { id: 'user-6', full_name: 'Lucas Silva', username: 'lucas_silva', grade: 11, school_id: 'cypress_bay_high', role: 'student', perks_enabled: false, created_at: new Date().toISOString() },
];

const DEFAULT_VOTES: Vote[] = [
  { id: 'v-1', poll_id: 'poll-1', voter_id: 'user-2', recipient_id: 'user-1', created_at: new Date().toISOString() },
  { id: 'v-2', poll_id: 'poll-2', voter_id: 'user-3', recipient_id: 'user-2', created_at: new Date().toISOString() },
  { id: 'v-3', poll_id: 'poll-3', voter_id: 'user-1', recipient_id: 'user-3', created_at: new Date().toISOString() },
  { id: 'v-4', poll_id: 'poll-1', voter_id: 'user-4', recipient_id: 'user-1', created_at: new Date().toISOString() },
  { id: 'v-5', poll_id: 'poll-2', voter_id: 'user-1', recipient_id: 'user-2', created_at: new Date().toISOString() },
  { id: 'v-6', poll_id: 'poll-1', voter_id: 'user-6', recipient_id: 'user-5', created_at: new Date().toISOString() },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [schools] = useState<School[]>(MOCK_SCHOOLS);
  const [polls] = useState<Poll[]>(MOCK_POLLS);
  const [loading, setLoading] = useState(true);

  // Initialize data from localStorage or mock defaults
  useEffect(() => {
    const localProfiles = getLocalData<Profile[]>(LOCAL_PROFILES_KEY, DEFAULT_PROFILES);
    const localVotes = getLocalData<Vote[]>(LOCAL_VOTES_KEY, DEFAULT_VOTES);
    const savedUser = getLocalData<Profile | null>(LOCAL_CURRENT_USER_KEY, null);

    setProfiles(localProfiles);
    setVotes(localVotes);
    if (savedUser) {
      // Find latest version of current user in the profiles list
      const latestUser = localProfiles.find(p => p.id === savedUser.id) || savedUser;
      setCurrentUser(latestUser);
    }
    setLoading(false);

    // Setup simulated realtime listeners
    const unsubscribeVotes = subscribeToChanges('votes', (newVotes) => {
      setVotes(newVotes);
    });

    const unsubscribeProfiles = subscribeToChanges('profiles', (newProfiles) => {
      setProfiles(newProfiles);
      if (currentUser) {
        const updated = newProfiles.find((p: Profile) => p.id === currentUser.id);
        if (updated) {
          setCurrentUser(updated);
          saveLocalData(LOCAL_CURRENT_USER_KEY, updated);
        }
      }
    });

    return () => {
      unsubscribeVotes();
      unsubscribeProfiles();
    };
  }, [currentUser?.id]);

  // Handle Sign Up
  const signUp = async (
    fullName: string,
    username: string,
    grade: number,
    schoolId: string,
    role: 'student' | 'admin' = 'student'
  ): Promise<Profile> => {
    const normalizedUsername = username.toLowerCase().trim();
    
    // Check if username taken
    if (profiles.some(p => p.username === normalizedUsername)) {
      throw new Error('Username already exists. Please choose another.');
    }

    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      full_name: fullName,
      username: normalizedUsername,
      grade,
      school_id: schoolId,
      role,
      perks_enabled: false,
      created_at: new Date().toISOString()
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    saveLocalData(LOCAL_PROFILES_KEY, updatedProfiles);
    setCurrentUser(newProfile);
    saveLocalData(LOCAL_CURRENT_USER_KEY, newProfile);
    
    broadcastChange('profiles', updatedProfiles);

    return newProfile;
  };

  // Handle Login
  const login = async (username: string): Promise<Profile> => {
    const normalizedUsername = username.toLowerCase().trim();
    const user = profiles.find(p => p.username === normalizedUsername);
    if (!user) {
      throw new Error('User not found. Check your username or register a new profile.');
    }
    setCurrentUser(user);
    saveLocalData(LOCAL_CURRENT_USER_KEY, user);
    return user;
  };

  // Handle Logout
  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
    }
  };

  // Cast a vote/compliment
  const castVote = async (pollId: string, recipientId: string): Promise<boolean> => {
    if (!currentUser) return false;

    // Check if already voted on this poll
    const alreadyVoted = votes.some(v => v.poll_id === pollId && v.voter_id === currentUser.id);
    if (alreadyVoted) {
      throw new Error('You have already voted on this positive prompt today!');
    }

    if (currentUser.id === recipientId) {
      throw new Error('You cannot vote for yourself!');
    }

    const newVote: Vote = {
      id: `vote-${Date.now()}`,
      poll_id: pollId,
      voter_id: currentUser.id,
      recipient_id: recipientId,
      created_at: new Date().toISOString()
    };

    const updatedVotes = [...votes, newVote];
    setVotes(updatedVotes);
    saveLocalData(LOCAL_VOTES_KEY, updatedVotes);

    broadcastChange('votes', updatedVotes);

    return true;
  };

  // Calculate Leaderboards dynamically based on local state (very high performance)
  const getLeaderboard = (
    filterSchoolId?: string,
    filterGrade?: number,
    showCounty: boolean = false
  ): LeaderboardStat[] => {
    return profiles
      .map(p => {
        const school = schools.find(s => s.id === p.school_id);
        const complimentCount = votes.filter(v => v.recipient_id === p.id).length;
        return {
          profile_id: p.id,
          full_name: p.full_name,
          username: p.username,
          grade: p.grade,
          school_id: p.school_id,
          school_name: school ? school.name : 'Unknown School',
          perks_enabled: p.perks_enabled,
          compliment_count: complimentCount
        };
      })
      .filter(stat => {
        if (showCounty) return true; // Show all
        if (filterSchoolId && stat.school_id !== filterSchoolId) return false;
        if (filterGrade && stat.grade !== filterGrade) return false;
        return true;
      })
      .sort((a, b) => b.compliment_count - a.compliment_count);
  };

  // Fetch compliments received for profile page / notification list
  const getReceivedCompliments = (userId: string) => {
    return votes
      .filter(v => v.recipient_id === userId)
      .map(v => {
        const poll = polls.find(p => p.id === v.poll_id);
        return {
          id: v.id,
          question: poll ? poll.question : 'A positive compliment',
          category: poll ? poll.category : 'General',
          created_at: v.created_at
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Admin vote unmasking data
  const getAdminVotes = () => {
    return votes.map(v => {
      const voter = profiles.find(p => p.id === v.voter_id);
      const recipient = profiles.find(p => p.id === v.recipient_id);
      const poll = polls.find(p => p.id === v.poll_id);
      return {
        ...v,
        voter_name: voter ? `${voter.full_name} (@${voter.username})` : 'Unknown',
        recipient_name: recipient ? `${recipient.full_name} (@${recipient.username})` : 'Unknown',
        question: poll ? poll.question : 'General Compliment'
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Toggle perks
  const togglePerks = (profileId: string) => {
    const updated = profiles.map(p => {
      if (p.id === profileId) {
        return { ...p, perks_enabled: !p.perks_enabled };
      }
      return p;
    });
    setProfiles(updated);
    saveLocalData(LOCAL_PROFILES_KEY, updated);
    broadcastChange('profiles', updated);
  };

  // Delete profile
  const deleteProfile = (profileId: string) => {
    const updated = profiles.filter(p => p.id !== profileId);
    setProfiles(updated);
    saveLocalData(LOCAL_PROFILES_KEY, updated);

    // Also delete associated votes
    const updatedVotes = votes.filter(v => v.voter_id !== profileId && v.recipient_id !== profileId);
    setVotes(updatedVotes);
    saveLocalData(LOCAL_VOTES_KEY, updatedVotes);

    broadcastChange('profiles', updated);
    broadcastChange('votes', updatedVotes);

    if (currentUser?.id === profileId) {
      logout();
    }
  };

  // Delete inappropriate vote / compliment
  const deleteVote = (voteId: string) => {
    const updatedVotes = votes.filter(v => v.id !== voteId);
    setVotes(updatedVotes);
    saveLocalData(LOCAL_VOTES_KEY, updatedVotes);
    broadcastChange('votes', updatedVotes);
  };

  // Edit profile (moderation)
  const editProfile = (profileId: string, updates: Partial<Profile>) => {
    const updated = profiles.map(p => {
      if (p.id === profileId) {
        return { ...p, ...updates };
      }
      return p;
    });
    setProfiles(updated);
    saveLocalData(LOCAL_PROFILES_KEY, updated);
    broadcastChange('profiles', updated);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        schools,
        polls,
        votes,
        profiles,
        isSupabase: isSupabaseConfigured,
        loading,
        signUp,
        login,
        logout,
        castVote,
        getLeaderboard,
        getReceivedCompliments,
        getAdminVotes,
        togglePerks,
        deleteProfile,
        deleteVote,
        editProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
