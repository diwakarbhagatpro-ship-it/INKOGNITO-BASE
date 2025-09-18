-- Add PostGIS geography(Point,4326) column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_point geography(Point,4326);

-- Sync trigger from JSONB location to location_point
CREATE OR REPLACE FUNCTION sync_location_point()
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

-- Create trigger to automatically update location_point
DROP TRIGGER IF EXISTS trigger_sync_users_location_point ON users;
CREATE TRIGGER trigger_sync_users_location_point
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_location_point();

-- Create GIST index for spatial queries
CREATE INDEX IF NOT EXISTS idx_users_location_point ON users USING GIST (location_point);

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