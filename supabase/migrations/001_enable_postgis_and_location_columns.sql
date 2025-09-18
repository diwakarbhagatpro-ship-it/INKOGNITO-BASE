-- This migration is now handled in 000_initial_schema.sql
-- PostGIS and location columns are created in the initial schema

-- Create index on location_point for better performance
CREATE INDEX IF NOT EXISTS idx_users_location_point ON users USING GIST (location_point);
CREATE INDEX IF NOT EXISTS idx_requests_location_point ON scribe_requests USING GIST (location_point);

-- Create index on matched_volunteer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_requests_matched_volunteer ON scribe_requests (matched_volunteer_id);

-- Create index on user role for faster volunteer filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Create index on request status for faster filtering
CREATE INDEX IF NOT EXISTS idx_requests_status ON scribe_requests (status);

-- Create index on scheduled_date for time-based queries
CREATE INDEX IF NOT EXISTS idx_requests_scheduled_date ON scribe_requests (scheduled_date);

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

-- Update existing records to populate location_point
UPDATE users 
SET location_point = ST_SetSRID(
  ST_MakePoint(
    (location->>'lng')::float,
    (location->>'lat')::float
  ),
  4326
)
WHERE location IS NOT NULL 
  AND location ? 'lat' 
  AND location ? 'lng'
  AND location_point IS NULL;

UPDATE scribe_requests 
SET location_point = ST_SetSRID(
  ST_MakePoint(
    (location->>'lng')::float,
    (location->>'lat')::float
  ),
  4326
)
WHERE location IS NOT NULL 
  AND location ? 'lat' 
  AND location ? 'lng'
  AND location_point IS NULL;
