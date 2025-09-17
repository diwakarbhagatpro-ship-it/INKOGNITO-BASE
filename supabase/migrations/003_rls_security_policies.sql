-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scribe_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE scribe_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

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
-- Users can view their own requests
CREATE POLICY "Users can view own requests" ON scribe_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own requests" ON scribe_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own requests
CREATE POLICY "Users can update own requests" ON scribe_requests
  FOR UPDATE USING (auth.uid() = user_id);

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

-- Scribe sessions policies
-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON scribe_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Volunteers can view their own sessions
CREATE POLICY "Volunteers can view own sessions" ON scribe_sessions
  FOR SELECT USING (auth.uid() = volunteer_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON scribe_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Volunteers can update their own sessions
CREATE POLICY "Volunteers can update own sessions" ON scribe_sessions
  FOR UPDATE USING (auth.uid() = volunteer_id);

-- System can create sessions (for automated matching)
CREATE POLICY "System can create sessions" ON scribe_sessions
  FOR INSERT WITH CHECK (true);

-- Volunteer applications policies
-- Volunteers can view their own applications
CREATE POLICY "Volunteers can view own applications" ON volunteer_applications
  FOR SELECT USING (auth.uid() = volunteer_id);

-- Users can view applications for their requests
CREATE POLICY "Users can view request applications" ON volunteer_applications
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM scribe_requests WHERE user_id = auth.uid()
    )
  );

-- Volunteers can create applications
CREATE POLICY "Volunteers can create applications" ON volunteer_applications
  FOR INSERT WITH CHECK (auth.uid() = volunteer_id);

-- Users can update application status for their requests
CREATE POLICY "Users can update application status" ON volunteer_applications
  FOR UPDATE USING (
    request_id IN (
      SELECT id FROM scribe_requests WHERE user_id = auth.uid()
    )
  );

-- Chat history policies
-- Users can view their own chat history
CREATE POLICY "Users can view own chat history" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own chat entries
CREATE POLICY "Users can create own chat entries" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get anonymized volunteer info for matching
CREATE OR REPLACE FUNCTION get_anonymized_volunteer_info(volunteer_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  reliability_score numeric,
  languages text[],
  distance_km numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.reliability_score,
    u.languages,
    0 as distance_km  -- Distance will be calculated by the calling function
  FROM users u
  WHERE u.id = volunteer_id
    AND u.role = 'volunteer'
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get anonymized user info for volunteers
CREATE OR REPLACE FUNCTION get_anonymized_user_info(user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  exam_preferences jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.preferences as exam_preferences
  FROM users u
  WHERE u.id = user_id
    AND u.role = 'blind_user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION find_nearest_volunteer TO authenticated;
GRANT EXECUTE ON FUNCTION find_available_volunteers TO authenticated;
GRANT EXECUTE ON FUNCTION is_volunteer_available TO authenticated;
GRANT EXECUTE ON FUNCTION get_volunteer_availability_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_anonymized_volunteer_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_anonymized_user_info TO authenticated;
