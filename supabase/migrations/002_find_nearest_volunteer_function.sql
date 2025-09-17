-- Function to find the nearest available volunteer for a request
CREATE OR REPLACE FUNCTION find_nearest_volunteer(
  request_location geography(Point, 4326),
  request_time timestamp with time zone,
  max_distance_km integer DEFAULT 50
)
RETURNS TABLE (
  volunteer_id uuid,
  volunteer_name varchar,
  volunteer_email varchar,
  volunteer_phone varchar,
  distance_km numeric,
  reliability_score numeric,
  languages text[],
  availability jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as volunteer_id,
    u.name as volunteer_name,
    u.email as volunteer_email,
    u.phone_number as volunteer_phone,
    ROUND(
      ST_Distance(
        u.location_point::geography,
        request_location
      ) / 1000.0, 2
    ) as distance_km,
    u.reliability_score,
    u.languages,
    u.availability
  FROM users u
  WHERE 
    u.role = 'volunteer'
    AND u.is_active = true
    AND u.location_point IS NOT NULL
    AND ST_DWithin(
      u.location_point::geography,
      request_location,
      max_distance_km * 1000  -- Convert km to meters
    )
    AND is_volunteer_available(u.id, request_time)
  ORDER BY 
    ST_Distance(u.location_point::geography, request_location)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if volunteer is available at specific time
CREATE OR REPLACE FUNCTION is_volunteer_available(
  volunteer_id uuid,
  request_time timestamp with time zone
)
RETURNS boolean AS $$
DECLARE
  volunteer_availability jsonb;
  day_of_week text;
  time_slot text;
  available_hours text;
  start_hour int;
  end_hour int;
  request_hour int;
BEGIN
  -- Get volunteer's availability
  SELECT availability INTO volunteer_availability
  FROM users
  WHERE id = volunteer_id;
  
  -- If no availability data, assume available
  IF volunteer_availability IS NULL THEN
    RETURN true;
  END IF;
  
  -- Get day of week (lowercase)
  day_of_week := LOWER(TO_CHAR(request_time, 'Day'));
  
  -- Get the availability for this day
  available_hours := volunteer_availability->>day_of_week;
  
  -- If no availability for this day, not available
  IF available_hours IS NULL OR available_hours = '' THEN
    RETURN false;
  END IF;
  
  -- Parse time range (e.g., "9am-5pm" or "09:00-17:00")
  IF available_hours ~ '^\d{1,2}(am|pm)-\d{1,2}(am|pm)$' THEN
    -- Handle 12-hour format
    DECLARE
      time_parts text[];
      start_time_str text;
      end_time_str text;
    BEGIN
      time_parts := string_to_array(available_hours, '-');
      start_time_str := trim(time_parts[1]);
      end_time_str := trim(time_parts[2]);
      
      -- Convert to 24-hour format
      start_hour := CASE 
        WHEN start_time_str ~ 'pm$' AND start_time_str !~ '^12' THEN
          (regexp_replace(start_time_str, '[^0-9]', '', 'g')::int + 12)
        WHEN start_time_str ~ 'am$' AND start_time_str ~ '^12' THEN 0
        ELSE regexp_replace(start_time_str, '[^0-9]', '', 'g')::int
      END;
      
      end_hour := CASE 
        WHEN end_time_str ~ 'pm$' AND end_time_str !~ '^12' THEN
          (regexp_replace(end_time_str, '[^0-9]', '', 'g')::int + 12)
        WHEN end_time_str ~ 'am$' AND end_time_str ~ '^12' THEN 0
        ELSE regexp_replace(end_time_str, '[^0-9]', '', 'g')::int
      END;
    END;
  ELSIF available_hours ~ '^\d{2}:\d{2}-\d{2}:\d{2}$' THEN
    -- Handle 24-hour format
    DECLARE
      time_parts text[];
    BEGIN
      time_parts := string_to_array(available_hours, '-');
      start_hour := split_part(time_parts[1], ':', 1)::int;
      end_hour := split_part(time_parts[2], ':', 1)::int;
    END;
  ELSE
    -- If format not recognized, assume available
    RETURN true;
  END IF;
  
  -- Get request hour
  request_hour := EXTRACT(hour FROM request_time);
  
  -- Check if request time falls within available hours
  RETURN request_hour >= start_hour AND request_hour < end_hour;
END;
$$ LANGUAGE plpgsql;

-- Function to get volunteer availability in a readable format
CREATE OR REPLACE FUNCTION get_volunteer_availability_summary(volunteer_id uuid)
RETURNS text AS $$
DECLARE
  availability jsonb;
  result text := '';
  day text;
  hours text;
BEGIN
  SELECT u.availability INTO availability
  FROM users u
  WHERE u.id = volunteer_id;
  
  IF availability IS NULL THEN
    RETURN 'No availability data';
  END IF;
  
  FOR day IN SELECT unnest(ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
  LOOP
    hours := availability->>day;
    IF hours IS NOT NULL AND hours != '' THEN
      IF result != '' THEN
        result := result || ', ';
      END IF;
      result := result || INITCAP(day) || ': ' || hours;
    END IF;
  END LOOP;
  
  RETURN COALESCE(result, 'No availability');
END;
$$ LANGUAGE plpgsql;

-- Function to find multiple volunteers within distance (for backup options)
CREATE OR REPLACE FUNCTION find_available_volunteers(
  request_location geography(Point, 4326),
  request_time timestamp with time zone,
  max_distance_km integer DEFAULT 50,
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  volunteer_id uuid,
  volunteer_name varchar,
  volunteer_email varchar,
  volunteer_phone varchar,
  distance_km numeric,
  reliability_score numeric,
  languages text[],
  availability_summary text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as volunteer_id,
    u.name as volunteer_name,
    u.email as volunteer_email,
    u.phone_number as volunteer_phone,
    ROUND(
      ST_Distance(
        u.location_point::geography,
        request_location
      ) / 1000.0, 2
    ) as distance_km,
    u.reliability_score,
    u.languages,
    get_volunteer_availability_summary(u.id) as availability_summary
  FROM users u
  WHERE 
    u.role = 'volunteer'
    AND u.is_active = true
    AND u.location_point IS NOT NULL
    AND ST_DWithin(
      u.location_point::geography,
      request_location,
      max_distance_km * 1000
    )
    AND is_volunteer_available(u.id, request_time)
  ORDER BY 
    ST_Distance(u.location_point::geography, request_location),
    u.reliability_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
