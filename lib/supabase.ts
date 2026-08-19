import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase Client. If env variables are missing, we will use mock modes.
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

// Mock Database Types & Implementation
export interface Profile {
  id: string;
  full_name: string;
  username: string;
  grade: number;
  school_id: string;
  role: 'student' | 'admin';
  perks_enabled: boolean;
  created_at: string;
  aura_points?: number;
  voting_streak?: number;
  last_vote_date?: string | null;
  aura_multiplier?: number;
  aura_multiplier_end_date?: string | null;
  require_id_verification?: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected';
  id_photo_url?: string | null;
  push_notifications?: boolean;
  in_app_notifications?: boolean;
}

export interface School {
  id: string;
  name: string;
  city: string;
}

export interface Poll {
  id: string;
  question: string;
  category: string;
  active_date: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  voter_id: string;
  recipient_id: string;
  created_at: string;
}

export interface LeaderboardStat {
  profile_id: string;
  full_name: string;
  username: string;
  grade: number;
  school_id: string;
  school_name: string;
  perks_enabled: boolean;
  compliment_count: number;
}

// Preloaded mock data
export const MOCK_SCHOOLS: School[] = [
  { id: 'pompano_beach_high', name: 'Pompano Beach High School', city: 'Pompano Beach' },
  { id: 'cypress_bay_high', name: 'Cypress Bay High School', city: 'Weston' },
  { id: 'fort_lauderdale_high', name: 'Fort Lauderdale High School', city: 'Fort Lauderdale' },
  { id: 'marjory_stoneman_douglas_high', name: 'Marjory Stoneman Douglas High School', city: 'Parkland' },
  { id: 'coral_springs_high', name: 'Coral Springs High School', city: 'Coral Springs' },
  { id: 'deerfield_beach_high', name: 'Deerfield Beach High School', city: 'Deerfield Beach' },
  { id: 'nova_high', name: 'Nova High School', city: 'Davie' },
  { id: 'west_broward_high', name: 'West Broward High School', city: 'Pembroke Pines' },
  { id: 'western_high', name: 'Western High School', city: 'Davie' },
  { id: 'south_broward_high', name: 'South Broward High School', city: 'Hollywood' },
];

export const MOCK_POLLS: Poll[] = [
  { id: 'poll-1', question: 'Most likely to brighten your day', category: 'Kindness', active_date: new Date().toISOString().split('T')[0] },
  { id: 'poll-2', question: 'Best tech builder & coder', category: 'STEM', active_date: new Date().toISOString().split('T')[0] },
  { id: 'poll-3', question: 'Most creative writer or artist', category: 'Creative', active_date: new Date().toISOString().split('T')[0] },
  { id: 'poll-4', question: 'Future community leader / class president', category: 'Leadership', active_date: new Date().toISOString().split('T')[0] },
];

const DEFAULT_PROFILES: Profile[] = [
  { id: 'user-1', full_name: 'Sophia Martinez', username: 'sophiam', grade: 12, school_id: 'pompano_beach_high', role: 'student', perks_enabled: true, created_at: new Date().toISOString() },
  { id: 'user-2', full_name: 'Marcus Chen', username: 'marcus_codes', grade: 11, school_id: 'pompano_beach_high', role: 'student', perks_enabled: false, created_at: new Date().toISOString() },
  { id: 'user-3', full_name: 'Emma Johnson', username: 'emma_j', grade: 10, school_id: 'pompano_beach_high', role: 'student', perks_enabled: false, created_at: new Date().toISOString() },
  { id: 'user-4', full_name: 'Tyler Broward', username: 'tyler_b', grade: 9, school_id: 'pompano_beach_high', role: 'student', perks_enabled: false, created_at: new Date().toISOString() },
  { id: 'user-admin', full_name: 'Principal Ramirez', username: 'admin_ramirez', grade: 12, school_id: 'pompano_beach_high', role: 'admin', perks_enabled: false, created_at: new Date().toISOString() },
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

// Helper to load/save state in localstorage for persistent mock data
const isClient = typeof window !== 'undefined';

export function getLocalData<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
}

export function saveLocalData<T>(key: string, data: T): void {
  if (!isClient) return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Real-time notification callbacks setup
type EventCallback = (payload: any) => void;
const subscribers: { [key: string]: EventCallback[] } = {};

export function subscribeToChanges(table: string, callback: EventCallback) {
  if (!subscribers[table]) {
    subscribers[table] = [];
  }
  subscribers[table].push(callback);
  return () => {
    subscribers[table] = subscribers[table].filter(cb => cb !== callback);
  };
}

export function broadcastChange(table: string, payload: any) {
  if (subscribers[table]) {
    subscribers[table].forEach(cb => cb(payload));
  }
}
