-- Enable Row Level Security on all tables

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Scribe requests table
ALTER TABLE scribe_requests ENABLE ROW LEVEL SECURITY;

-- Matches table
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Audit logs table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'audit_logs') THEN
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Chat history table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'chat_history') THEN
    ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies

-- Users table policies
-- 1. Users can read their own profile
DROP POLICY IF EXISTS users_read_own ON users;
CREATE POLICY users_read_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can update their own profile
DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- 3. Admins can read all users
DROP POLICY IF EXISTS users_admin_read ON users;
CREATE POLICY users_admin_read ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Admins can update all users
DROP POLICY IF EXISTS users_admin_update ON users;
CREATE POLICY users_admin_update ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Volunteers can be read by blind users for matchmaking
DROP POLICY IF EXISTS users_volunteer_read ON users;
CREATE POLICY users_volunteer_read ON users
  FOR SELECT
  USING (
    role = 'volunteer' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'blind_user'
    )
  );

-- Scribe requests table policies
-- 1. Users can read their own requests
DROP POLICY IF EXISTS requests_read_own ON scribe_requests;
CREATE POLICY requests_read_own ON scribe_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Users can update their own requests
DROP POLICY IF EXISTS requests_update_own ON scribe_requests;
CREATE POLICY requests_update_own ON scribe_requests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Users can delete their own requests
DROP POLICY IF EXISTS requests_delete_own ON scribe_requests;
CREATE POLICY requests_delete_own ON scribe_requests
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Admins can read all requests
DROP POLICY IF EXISTS requests_admin_read ON scribe_requests;
CREATE POLICY requests_admin_read ON scribe_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Volunteers can read requests they are matched with
DROP POLICY IF EXISTS requests_volunteer_read ON scribe_requests;
CREATE POLICY requests_volunteer_read ON scribe_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE request_id = scribe_requests.id
      AND volunteer_id = auth.uid()
    )
  );

-- Matches table policies
-- 1. Users can read their own matches
DROP POLICY IF EXISTS matches_user_read ON matches;
CREATE POLICY matches_user_read ON matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scribe_requests
      WHERE id = matches.request_id
      AND user_id = auth.uid()
    )
  );

-- 2. Volunteers can read and update matches assigned to them
DROP POLICY IF EXISTS matches_volunteer_read ON matches;
CREATE POLICY matches_volunteer_read ON matches
  FOR SELECT
  USING (volunteer_id = auth.uid());

DROP POLICY IF EXISTS matches_volunteer_update ON matches;
CREATE POLICY matches_volunteer_update ON matches
  FOR UPDATE
  USING (volunteer_id = auth.uid());

-- 3. Admins can read and update all matches
DROP POLICY IF EXISTS matches_admin_read ON matches;
CREATE POLICY matches_admin_read ON matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS matches_admin_update ON matches;
CREATE POLICY matches_admin_update ON matches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Chat history policies (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'chat_history') THEN
    -- 1. Users can read their own chat history
    DROP POLICY IF EXISTS chat_user_read ON chat_history;
    CREATE POLICY chat_user_read ON chat_history
      FOR SELECT
      USING (user_id = auth.uid() OR recipient_id = auth.uid());
    
    -- 2. Users can insert their own messages
    DROP POLICY IF EXISTS chat_user_insert ON chat_history;
    CREATE POLICY chat_user_insert ON chat_history
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Audit logs policies (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'audit_logs') THEN
    -- Only admins can read audit logs
    DROP POLICY IF EXISTS audit_admin_read ON audit_logs;
    CREATE POLICY audit_admin_read ON audit_logs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;