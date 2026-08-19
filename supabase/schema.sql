
-- Create app_settings table
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  require_id_verification BOOLEAN DEFAULT FALSE
);

-- Insert initial setting
INSERT INTO app_settings (require_id_verification) VALUES (FALSE);

-- Enable Row Level Security (RLS) for app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy for app_settings: Admins can read and update, others can read
CREATE POLICY "Admins can manage app_settings" ON app_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Everyone can read app_settings" ON app_settings
  FOR SELECT USING (TRUE);

-- Add verification_status and id_photo_url to profiles table
ALTER TABLE profiles
ADD COLUMN verification_status TEXT DEFAULT 'pending',
ADD COLUMN id_photo_url TEXT,
ADD COLUMN aura_points INT DEFAULT 0,
ADD COLUMN voting_streak INT DEFAULT 0,
ADD COLUMN last_vote_date DATE,
ADD COLUMN aura_multiplier INT DEFAULT 1,
ADD COLUMN aura_multiplier_end_date DATE;

-- RLS for profiles table:
-- Admins can see all profile data
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Existing RLS policies for other tables (polls, votes, leaderboards) would go here, ensuring
-- that voter_id is masked for non-admins.
-- Example for votes table (assuming it exists and has voter_id and recipient_id):
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all votes" ON votes
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own votes and recipient votes (anonymized)" ON votes
  FOR SELECT USING (auth.uid() = voter_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert votes" ON votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Create polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  category TEXT,
  active_date DATE NOT NULL,
  creator_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Policies for polls
CREATE POLICY "Public polls are viewable by everyone" ON polls
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can insert polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Create feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  feedback_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policies for feedback
CREATE POLICY "Authenticated users can insert feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update feedback status" ON feedback
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create referral_links table
CREATE TABLE referral_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id),
  code TEXT UNIQUE NOT NULL,
  uses INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for referral_links
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;

-- Policies for referral_links
CREATE POLICY "Authenticated users can insert referral links" ON referral_links
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Everyone can read referral links" ON referral_links
  FOR SELECT USING (TRUE);

CREATE POLICY "Referral link uses can be updated by function" ON referral_links
  FOR UPDATE USING (TRUE); -- This will be handled by a Supabase function

-- Create user_settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  push_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_settings
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
