-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scribe_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scribe_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Volunteers can view basic info of matched users (anonymized)
CREATE POLICY "Volunteers can view matched user basic info" ON users
  FOR SELECT USING (
    id IN (
      SELECT sr.user_id 
      FROM scribe_sessions ss
      JOIN scribe_requests sr ON ss.request_id = sr.id
      WHERE ss.volunteer_id = auth.uid()
        AND ss.status IN ('scheduled', 'active')
    )
  );

-- Scribe requests policies
CREATE POLICY "Users can view own requests" ON scribe_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own requests" ON scribe_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests" ON scribe_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own requests" ON scribe_requests
  FOR DELETE USING (auth.uid() = user_id);

-- Volunteers can view requests they're matched with
CREATE POLICY "Volunteers can view matched requests" ON scribe_requests
  FOR SELECT USING (
    matched_volunteer_id = auth.uid()
    OR id IN (
      SELECT request_id 
      FROM scribe_sessions 
      WHERE volunteer_id = auth.uid()
    )
  );

-- Volunteers can view pending requests for matching (anonymized)
CREATE POLICY "Volunteers can view pending requests" ON scribe_requests
  FOR SELECT USING (
    status = 'pending'
    AND user_id != auth.uid()  -- Can't see own requests
  );

-- Matches table policies
CREATE POLICY "Users can view matches for their requests" ON matches
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM scribe_requests WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Volunteers can view their own matches" ON matches
  FOR SELECT USING (auth.uid() = volunteer_id);

CREATE POLICY "System can create matches" ON matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update matches" ON matches
  FOR UPDATE WITH CHECK (true);

-- Volunteer applications policies
CREATE POLICY "Volunteers can view own applications" ON volunteer_applications
  FOR SELECT USING (auth.uid() = volunteer_id);

CREATE POLICY "Users can view request applications" ON volunteer_applications
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM scribe_requests WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Volunteers can create applications" ON volunteer_applications
  FOR INSERT WITH CHECK (auth.uid() = volunteer_id);

CREATE POLICY "Users can update application status" ON volunteer_applications
  FOR UPDATE USING (
    request_id IN (
      SELECT id FROM scribe_requests WHERE user_id = auth.uid()
    )
  );

-- Scribe sessions policies
CREATE POLICY "Users can view own sessions" ON scribe_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Volunteers can view own sessions" ON scribe_sessions
  FOR SELECT USING (auth.uid() = volunteer_id);

CREATE POLICY "Users can update own sessions" ON scribe_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Volunteers can update own sessions" ON scribe_sessions
  FOR UPDATE USING (auth.uid() = volunteer_id);

CREATE POLICY "System can create sessions" ON scribe_sessions
  FOR INSERT WITH CHECK (true);

-- Chat history policies
CREATE POLICY "Users can view own chat history" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat entries" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit logs policies (admin only)
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);