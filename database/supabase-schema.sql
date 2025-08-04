-- Supabase Database Schema for Challenge Management System
-- This schema supports the complete challenge lifecycle from creation to completion

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (employees, managers, admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Employee', 'Management', 'Admin')),
  total_points INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id VARCHAR(50) PRIMARY KEY, -- Keep existing format like 'ch1754040356417'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  full_description TEXT,
  expected_outcome TEXT,
  tags TEXT[], -- Array of technology tags
  status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Draft')),
  points INTEGER NOT NULL DEFAULT 500,
  penalty_points INTEGER DEFAULT 50,
  deadline DATE,
  created_by_id UUID REFERENCES users(id),
  created_by_name VARCHAR(100) NOT NULL, -- Denormalized for display
  attachments TEXT[], -- Array of attachment URLs/names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Challenge acceptances table
CREATE TABLE IF NOT EXISTS challenge_acceptances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL, -- Denormalized for easy querying
  challenge_id VARCHAR(50) REFERENCES challenges(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'Accepted' CHECK (
    status IN ('Accepted', 'Submitted', 'Pending Review', 'Under Review', 'Approved', 'Rejected', 'Needs Rework', 'Withdrawn', 'Completed')
  ),
  committed_date DATE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active acceptance per user at a time
  UNIQUE(user_id, challenge_id)
);

-- 4. Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL, -- Denormalized
  challenge_id VARCHAR(50) REFERENCES challenges(id) ON DELETE CASCADE,
  acceptance_id UUID REFERENCES challenge_acceptances(id) ON DELETE CASCADE,
  
  -- Submission content
  solution_description TEXT NOT NULL,
  short_description VARCHAR(500),
  github_url TEXT,
  demo_url TEXT,
  technologies TEXT, -- Comma-separated list
  files_attached TEXT[], -- Array of file URLs
  
  -- Status and timing
  status VARCHAR(20) DEFAULT 'Submitted' CHECK (
    status IN ('Submitted', 'Under Review', 'Approved', 'Rejected', 'Needs Rework')
  ),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_submitted BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one submission per user per challenge
  UNIQUE(user_id, challenge_id)
);

-- 5. Submission reviews table
CREATE TABLE IF NOT EXISTS submission_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name VARCHAR(100) NOT NULL, -- Denormalized
  
  -- Review details
  status VARCHAR(20) NOT NULL CHECK (
    status IN ('Pending Review', 'Approved', 'Rejected', 'Needs Rework')
  ),
  review_comment TEXT,
  points_awarded INTEGER DEFAULT 0,
  
  -- Timing analysis
  is_on_time BOOLEAN DEFAULT true,
  submission_date DATE NOT NULL,
  commitment_date DATE NOT NULL,
  
  -- Metadata
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one review per submission
  UNIQUE(submission_id)
);

-- 6. User points history table (for tracking point changes)
CREATE TABLE IF NOT EXISTS user_points_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge_id VARCHAR(50) REFERENCES challenges(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  
  -- Point change details
  points_change INTEGER NOT NULL, -- Can be positive or negative
  reason VARCHAR(100) NOT NULL, -- 'challenge_approved', 'late_penalty', 'rework_penalty', etc.
  previous_total INTEGER NOT NULL,
  new_total INTEGER NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_challenge_acceptances_user_status ON challenge_acceptances(user_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_acceptances_challenge ON challenge_acceptances(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_challenge ON submissions(user_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON submission_reviews(status);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points_history ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you can customize based on your auth requirements)
-- Users can read all user data, but only update their own
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Challenges are readable by all authenticated users
CREATE POLICY "Authenticated users can view challenges" ON challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Management can manage challenges" ON challenges FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('Management', 'Admin'))
);

-- Challenge acceptances: users can manage their own
CREATE POLICY "Users can view all acceptances" ON challenge_acceptances FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own acceptances" ON challenge_acceptances FOR ALL TO authenticated USING (
  user_id = auth.uid()
);

-- Submissions: users can manage their own, management can view all
CREATE POLICY "Users can view all submissions" ON submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own submissions" ON submissions FOR ALL TO authenticated USING (
  user_id = auth.uid()
);

-- Reviews: management can manage, others can view
CREATE POLICY "Users can view reviews" ON submission_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Management can manage reviews" ON submission_reviews FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('Management', 'Admin'))
);

-- Points history: users can view their own, management can view all
CREATE POLICY "Users can view own points history" ON user_points_history FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('Management', 'Admin'))
);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acceptances_updated_at BEFORE UPDATE ON challenge_acceptances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON submission_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user total points when points history is added
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET total_points = NEW.new_total
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_points_trigger 
    AFTER INSERT ON user_points_history
    FOR EACH ROW EXECUTE FUNCTION update_user_total_points();

-- Views for common queries
CREATE OR REPLACE VIEW user_challenge_status AS
SELECT 
    u.username,
    u.display_name,
    c.id as challenge_id,
    c.title as challenge_title,
    ca.status as acceptance_status,
    ca.accepted_at,
    ca.committed_date,
    s.status as submission_status,
    s.submitted_at,
    sr.status as review_status,
    sr.points_awarded,
    sr.reviewed_at
FROM users u
LEFT JOIN challenge_acceptances ca ON u.id = ca.user_id
LEFT JOIN challenges c ON ca.challenge_id = c.id
LEFT JOIN submissions s ON ca.id = s.acceptance_id
LEFT JOIN submission_reviews sr ON s.id = sr.submission_id;

-- View for active challenges per user
CREATE OR REPLACE VIEW active_user_challenges AS
SELECT 
    username,
    challenge_id,
    status,
    accepted_at,
    committed_date
FROM challenge_acceptances
WHERE status IN ('Accepted', 'Submitted', 'Pending Review', 'Under Review')
ORDER BY accepted_at DESC;
