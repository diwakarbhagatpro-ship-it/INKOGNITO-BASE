-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add PostGIS geography(Point,4326) column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'location_point') THEN
    ALTER TABLE users ADD COLUMN location_point geography(Point,4326);
  END IF;
END $$;

-- Add PostGIS geography(Point,4326) column to volunteers table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'volunteers') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'volunteers' 
                  AND column_name = 'location_point') THEN
      ALTER TABLE volunteers ADD COLUMN location_point geography(Point,4326);
    END IF;
  END IF;
END $$;

-- Create function to sync location_point from JSONB location
CREATE OR REPLACE FUNCTION sync_location_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location IS NOT NULL AND 
     NEW.location ? 'lat' AND 
     NEW.location ? 'lng' THEN
    
    NEW.location_point := ST_SetSRID(
      ST_MakePoint(
        (NEW.location->>'lng')::float, 
        (NEW.location->>'lat')::float
      ), 
      4326
    )::geography;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_location_sync_trigger') THEN
    CREATE TRIGGER users_location_sync_trigger
    BEFORE INSERT OR UPDATE OF location ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_location_point();
  END IF;
END $$;

-- Create trigger on volunteers table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'volunteers') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'volunteers_location_sync_trigger') THEN
      CREATE TRIGGER volunteers_location_sync_trigger
      BEFORE INSERT OR UPDATE OF location ON volunteers
      FOR EACH ROW
      EXECUTE FUNCTION sync_location_point();
    END IF;
  END IF;
END $$;

-- Create function to find available volunteers within a radius
CREATE OR REPLACE FUNCTION find_available_volunteers(
  user_location text,
  max_distance_km float DEFAULT 10,
  preferred_language text DEFAULT NULL,
  request_id uuid DEFAULT NULL
)
RETURNS TABLE (
  volunteer_id uuid,
  volunteer_name text,
  distance_km float,
  reliability_score float,
  languages text[],
  match_score float
) AS $$
DECLARE
  point_geog geography;
BEGIN
  -- Convert text point to geography
  point_geog := ST_GeographyFromText(user_location);
  
  RETURN QUERY
  SELECT 
    u.id as volunteer_id,
    u.name as volunteer_name,
    ST_Distance(u.location_point, point_geog) / 1000 as distance_km,
    u.reliability_score,
    u.languages,
    -- Calculate match score based on distance and reliability
    -- Distance is inversely weighted (closer is better)
    -- Reliability is directly weighted
    -- Language match adds a bonus
    (1 - LEAST(ST_Distance(u.location_point, point_geog) / 1000 / max_distance_km, 1)) * 0.6 + 
    (u.reliability_score / 5) * 0.4 +
    CASE WHEN preferred_language IS NULL THEN 0
         WHEN preferred_language = ANY(u.languages) THEN 0.2
         ELSE 0
    END as match_score
  FROM 
    users u
  WHERE 
    u.role = 'volunteer' AND
    u.is_active = true AND
    -- Only include volunteers within the specified radius
    ST_DWithin(u.location_point, point_geog, max_distance_km * 1000) AND
    -- Exclude volunteers who are already matched with this request
    (request_id IS NULL OR 
     NOT EXISTS (SELECT 1 FROM matches m WHERE m.volunteer_id = u.id AND m.request_id = request_id))
  ORDER BY 
    match_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to find the best volunteer for a request
CREATE OR REPLACE FUNCTION find_best_volunteer(
  request_id uuid
)
RETURNS TABLE (
  volunteer_id uuid,
  match_score float,
  distance_km float
) AS $$
DECLARE
  req_record RECORD;
BEGIN
  -- Get request details
  SELECT r.*, u.location, u.languages
  INTO req_record
  FROM scribe_requests r
  JOIN users u ON r.user_id = u.id
  WHERE r.id = request_id;
  
  IF req_record.location IS NULL OR 
     NOT (req_record.location ? 'lat') OR 
     NOT (req_record.location ? 'lng') THEN
    RAISE EXCEPTION 'Invalid location data for request %', request_id;
  END IF;
  
  RETURN QUERY
  SELECT 
    v.id as volunteer_id,
    -- Calculate match score based on multiple factors
    (1 - LEAST(ST_Distance(v.location_point, ST_SetSRID(ST_MakePoint(
      (req_record.location->>'lng')::float, 
      (req_record.location->>'lat')::float
    ), 4326)::geography) / 1000 / 50, 1)) * 0.5 + -- Distance (50km max radius)
    (v.reliability_score / 5) * 0.3 + -- Reliability score
    CASE WHEN req_record.languages && v.languages THEN 0.2 -- Language match
         ELSE 0
    END as match_score,
    ST_Distance(v.location_point, ST_SetSRID(ST_MakePoint(
      (req_record.location->>'lng')::float, 
      (req_record.location->>'lat')::float
    ), 4326)::geography) / 1000 as distance_km
  FROM 
    users v
  WHERE 
    v.role = 'volunteer' AND
    v.is_active = true AND
    -- Only include volunteers within 50km
    ST_DWithin(
      v.location_point, 
      ST_SetSRID(ST_MakePoint(
        (req_record.location->>'lng')::float, 
        (req_record.location->>'lat')::float
      ), 4326)::geography, 
      50000
    ) AND
    -- Exclude volunteers who are already matched or unavailable
    NOT EXISTS (
      SELECT 1 
      FROM matches m 
      JOIN scribe_requests sr ON m.request_id = sr.id
      WHERE 
        m.volunteer_id = v.id AND
        m.status IN ('accepted', 'in_progress') AND
        -- Check for time conflicts
        (req_record.scheduled_date, req_record.scheduled_date + (req_record.duration || ' minutes')::interval) OVERLAPS
        (sr.scheduled_date, sr.scheduled_date + (sr.duration || ' minutes')::interval)
    )
  ORDER BY 
    match_score DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;