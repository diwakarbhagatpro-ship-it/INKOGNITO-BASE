-- ============================================
-- INITIAL SCHEMA SETUP
-- Create all required tables with proper relationships
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table - supports blind users, volunteers, and admins
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('blind_user', 'volunteer', 'admin')),
  phone_number VARCHAR(20),
  location JSONB, -- { lat: number, lng: number, address: string }
  location_point GEOGRAPHY(Point, 4326), -- PostGIS point for spatial queries
  languages TEXT[] DEFAULT '{}', -- Supported languages for volunteers
  availability JSONB, -- Volunteer availability schedule
  reliability_score DECIMAL(3, 2) DEFAULT 5.00 CHECK (reliability_score >= 0 AND reliability_score <= 5), -- For volunteers
  preferences JSONB, -- User preferences and accessibility settings
  is_active BOOLEAN DEFAULT true,
  push_token TEXT, -- For push notifications
  notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scribe requests table
CREATE TABLE scribe_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  exam_type VARCHAR(100),
  subject VARCHAR(100),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 480), -- Duration in minutes (max 8 hours)
  location JSONB NOT NULL, -- { lat: number, lng: number, address: string }
  location_point GEOGRAPHY(Point, 4326), -- PostGIS point for spatial queries
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'in_progress', 'completed', 'cancelled')),
  special_requirements TEXT,
  estimated_difficulty INTEGER DEFAULT 3 CHECK (estimated_difficulty >= 1 AND estimated_difficulty <= 5),
  matched_volunteer_id UUID REFERENCES users(id), -- Direct reference to matched volunteer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table - tracks volunteer applications and matching
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES scribe_requests(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  match_score DECIMAL(5, 2) CHECK (match_score >= 0 AND match_score <= 100),
  distance_km DECIMAL(8, 2) CHECK (distance_km >= 0),
  notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, volunteer_id) -- Prevent duplicate applications
);

-- Scribe sessions table - tracks actual sessions between users and volunteers
CREATE TABLE scribe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES scribe_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER CHECK (actual_duration >= 0), -- Actual duration in minutes
  notes TEXT,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  volunteer_rating INTEGER CHECK (volunteer_rating >= 1 AND volunteer_rating <= 5),
  user_feedback TEXT,
  volunteer_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer applications - tracks who applied for which requests
CREATE TABLE volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES scribe_requests(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  match_score DECIMAL(5, 2) CHECK (match_score >= 0 AND match_score <= 100),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, volunteer_id) -- Prevent duplicate applications
);

-- AI Chat History for INSEE assistant
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES scribe_sessions(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB, -- Additional context for the conversation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table for tracking all actions
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_location_point ON users USING GIST (location_point);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_active = true;

CREATE INDEX idx_requests_user_id ON scribe_requests(user_id);
CREATE INDEX idx_requests_status ON scribe_requests(status);
CREATE INDEX idx_requests_scheduled_date ON scribe_requests(scheduled_date);
CREATE INDEX idx_requests_location_point ON scribe_requests USING GIST (location_point);
CREATE INDEX idx_requests_matched_volunteer ON scribe_requests(matched_volunteer_id);

CREATE INDEX idx_matches_request_id ON matches(request_id);
CREATE INDEX idx_matches_volunteer_id ON matches(volunteer_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created_at ON matches(created_at);

CREATE INDEX idx_sessions_user_id ON scribe_sessions(user_id);
CREATE INDEX idx_sessions_volunteer_id ON scribe_sessions(volunteer_id);
CREATE INDEX idx_sessions_status ON scribe_sessions(status);
CREATE INDEX idx_sessions_request_id ON scribe_sessions(request_id);

CREATE INDEX idx_applications_request_id ON volunteer_applications(request_id);
CREATE INDEX idx_applications_volunteer_id ON volunteer_applications(volunteer_id);
CREATE INDEX idx_applications_status ON volunteer_applications(status);

CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_requests_updated_at
  BEFORE UPDATE ON scribe_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_sessions_updated_at
  BEFORE UPDATE ON scribe_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_applications_updated_at
  BEFORE UPDATE ON volunteer_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update location_point from lat/lng coordinates
CREATE OR REPLACE FUNCTION update_location_point()
RETURNS TRIGGER AS $$
BEGIN
  -- Update location_point from location JSONB if it exists
  IF NEW.location IS NOT NULL AND NEW.location ? 'lat' AND NEW.location ? 'lng' THEN
    NEW.location_point = ST_SetSRID(
      ST_MakePoint(
        (NEW.location->>'lng')::float,
        (NEW.location->>'lat')::float
      ),
      4326
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update location_point
CREATE TRIGGER trigger_update_users_location_point
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_location_point();

CREATE TRIGGER trigger_update_requests_location_point
  BEFORE INSERT OR UPDATE ON scribe_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_location_point();