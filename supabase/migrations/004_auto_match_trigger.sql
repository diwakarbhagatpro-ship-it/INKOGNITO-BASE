-- ============================================
-- AUTO-MATCH TRIGGER SETUP
-- Triggers Edge Function when new request is created
-- ============================================

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION trigger_auto_match()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  response TEXT;
BEGIN
  -- Only process new pending requests
  IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
    
    -- Get the webhook URL for the auto-match function
    webhook_url := 'https://your-project-id.supabase.co/functions/v1/auto-match';
    
    -- Prepare payload
    payload := jsonb_build_object(
      'record', to_jsonb(NEW),
      'type', 'INSERT'
    );
    
    -- Call the Edge Function asynchronously
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload::text
    );
    
    -- Log the trigger
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      new_values
    ) VALUES (
      NEW.user_id,
      'auto_match_triggered',
      'scribe_requests',
      NEW.id,
      jsonb_build_object('webhook_called', true)
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_match_trigger ON scribe_requests;
CREATE TRIGGER auto_match_trigger
  AFTER INSERT OR UPDATE OF status ON scribe_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_match();

-- Enable the http extension for webhook calls
CREATE EXTENSION IF NOT EXISTS http;

-- Create a function to handle match status updates
CREATE OR REPLACE FUNCTION handle_match_update()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
BEGIN
  -- Only process status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    webhook_url := 'https://your-project-id.supabase.co/functions/v1/auto-match';
    
    payload := jsonb_build_object(
      'record', to_jsonb(NEW),
      'type', 'UPDATE'
    );
    
    -- Call the Edge Function
    PERFORM net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload::text
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for match updates
DROP TRIGGER IF EXISTS match_update_trigger ON matches;
CREATE TRIGGER match_update_trigger
  AFTER UPDATE OF status ON matches
  FOR EACH ROW
  EXECUTE FUNCTION handle_match_update();

-- Add push notification tokens to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}';

-- Create index for push tokens
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token) WHERE push_token IS NOT NULL;

-- Create a function to get notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  preferences JSONB;
BEGIN
  SELECT notification_preferences INTO preferences
  FROM users
  WHERE id = user_id;
  
  RETURN COALESCE(preferences, '{"email": true, "sms": true, "push": true}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create a function to update volunteer availability
CREATE OR REPLACE FUNCTION update_volunteer_availability(
  volunteer_id UUID,
  is_available BOOLEAN,
  availability_hours JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET 
    is_available = update_volunteer_availability.is_available,
    availability_hours = COALESCE(update_volunteer_availability.availability_hours, availability_hours),
    updated_at = NOW()
  WHERE id = volunteer_id AND role = 'volunteer';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get volunteer statistics
CREATE OR REPLACE FUNCTION get_volunteer_stats(volunteer_id UUID)
RETURNS TABLE (
  total_requests INTEGER,
  accepted_requests INTEGER,
  completed_requests INTEGER,
  average_rating NUMERIC,
  response_time_minutes NUMERIC,
  acceptance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_requests,
    COUNT(*) FILTER (WHERE m.status = 'accepted')::INTEGER as accepted_requests,
    COUNT(*) FILTER (WHERE m.status = 'completed')::INTEGER as completed_requests,
    ROUND(AVG(m.user_rating), 2) as average_rating,
    ROUND(AVG(EXTRACT(EPOCH FROM (m.responded_at - m.notified_at)) / 60), 2) as response_time_minutes,
    ROUND(
      COUNT(*) FILTER (WHERE m.status = 'accepted')::NUMERIC / 
      NULLIF(COUNT(*) FILTER (WHERE m.status IN ('accepted', 'declined')), 0), 
      2
    ) as acceptance_rate
  FROM matches m
  WHERE m.volunteer_id = volunteer_id;
END;
$$ LANGUAGE plpgsql;
