# Matchmaking System Testing Guide

## 🧪 Testing the Complete Matchmaking Flow

### Prerequisites
1. **Supabase Setup**: Ensure all migrations are applied
2. **Environment Variables**: Configure Supabase and Gemini API keys
3. **Test Data**: Create test users and volunteers

### Test Data Setup

#### 1. Create Test Users in Supabase

```sql
-- Insert test blind user
INSERT INTO users (id, email, name, role, location, location_point, is_active)
VALUES (
  'test-blind-user-1',
  'student@test.com',
  'Test Student',
  'blind_user',
  '{"lat": 28.6139, "lng": 77.2090, "address": "New Delhi, India"}',
  ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326),
  true
);

-- Insert test volunteers
INSERT INTO users (id, email, name, role, location, location_point, languages, availability, reliability_score, is_active)
VALUES 
(
  'test-volunteer-1',
  'volunteer1@test.com',
  'Sarah Johnson',
  'volunteer',
  '{"lat": 28.6140, "lng": 77.2091, "address": "Near Delhi University"}',
  ST_SetSRID(ST_MakePoint(77.2091, 28.6140), 4326),
  ARRAY['English', 'Hindi'],
  '{"monday": "9am-5pm", "tuesday": "9am-5pm", "wednesday": "9am-5pm"}',
  4.8,
  true
),
(
  'test-volunteer-2',
  'volunteer2@test.com',
  'Michael Chen',
  'volunteer',
  '{"lat": 28.6150, "lng": 77.2100, "address": "Delhi Metro Station"}',
  ST_SetSRID(ST_MakePoint(77.2100, 28.6150), 4326),
  ARRAY['English', 'Mandarin'],
  '{"thursday": "10am-6pm", "friday": "10am-6pm", "saturday": "10am-6pm"}',
  4.9,
  true
),
(
  'test-volunteer-3',
  'volunteer3@test.com',
  'Emily Rodriguez',
  'volunteer',
  '{"lat": 28.6200, "lng": 77.2200, "address": "Far from center"}',
  ST_SetSRID(ST_MakePoint(77.2200, 28.6200), 4326),
  ARRAY['English', 'Spanish'],
  '{"sunday": "8am-4pm"}',
  4.7,
  true
);
```

### Test Scenarios

#### Scenario 1: Successful Match
1. **Login as blind user** (`student@test.com`)
2. **Create a request** for Monday 2:00 PM
3. **Expected Result**: Sarah Johnson should be matched (closest, available Monday)

#### Scenario 2: No Available Volunteers
1. **Login as blind user**
2. **Create a request** for Sunday 10:00 PM
3. **Expected Result**: No volunteers available (outside availability hours)

#### Scenario 3: Distance-based Matching
1. **Login as blind user**
2. **Create a request** for Thursday 2:00 PM
3. **Expected Result**: Michael Chen should be matched (available Thursday, closer than Emily)

#### Scenario 4: Backup Volunteers
1. **Login as blind user**
2. **Create a request** with very small radius (1km)
3. **Expected Result**: No primary match, but backup volunteers shown

### Manual Testing Steps

#### 1. Test SQL Functions Directly

```sql
-- Test finding nearest volunteer
SELECT * FROM find_nearest_volunteer(
  ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326),
  '2024-01-15 14:00:00+05:30'::timestamp with time zone,
  50
);

-- Test finding multiple volunteers
SELECT * FROM find_available_volunteers(
  ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326),
  '2024-01-15 14:00:00+05:30'::timestamp with time zone,
  50,
  5
);

-- Test availability checking
SELECT is_volunteer_available('test-volunteer-1', '2024-01-15 14:00:00+05:30'::timestamp with time zone);
```

#### 2. Test Edge Function

```bash
# Test the matchVolunteer edge function
curl -X POST 'https://your-project.supabase.co/functions/v1/matchVolunteer' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "requestId": "test-request-1",
    "userId": "test-blind-user-1",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    },
    "scheduledDate": "2024-01-15T14:00:00+05:30",
    "maxDistanceKm": 50
  }'
```

#### 3. Test Frontend Integration

1. **Start the application**: `npm run dev`
2. **Login as test user**
3. **Navigate to Request page**
4. **Fill out the form**:
   - Title: "Test Exam Request"
   - Description: "Need help with mathematics exam"
   - Exam Type: "Final Exam"
   - Subject: "Mathematics"
   - Date: Select a Monday at 2:00 PM
   - Duration: 2 hours
5. **Submit the request**
6. **Verify**: Volunteer match appears with correct information

### Expected Results

#### Successful Match Response
```json
{
  "success": true,
  "matched": true,
  "volunteer": {
    "volunteer_id": "test-volunteer-1",
    "volunteer_name": "Sarah Johnson",
    "volunteer_email": "volunteer1@test.com",
    "volunteer_phone": null,
    "distance_km": 0.14,
    "reliability_score": 4.8,
    "languages": ["English", "Hindi"],
    "availability": {"monday": "9am-5pm", "tuesday": "9am-5pm", "wednesday": "9am-5pm"}
  },
  "backup_volunteers": [
    {
      "volunteer_id": "test-volunteer-2",
      "volunteer_name": "Michael Chen",
      "distance_km": 1.24,
      "reliability_score": 4.9
    }
  ],
  "message": "Found nearest volunteer: Sarah Johnson (0.14km away)"
}
```

#### No Match Response
```json
{
  "success": true,
  "matched": false,
  "volunteer": null,
  "backup_volunteers": [],
  "message": "No volunteers available within the specified distance. Consider expanding search radius or trying a different time."
}
```

### Performance Testing

#### 1. Database Performance
```sql
-- Test query performance with EXPLAIN
EXPLAIN ANALYZE SELECT * FROM find_nearest_volunteer(
  ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326),
  '2024-01-15 14:00:00+05:30'::timestamp with time zone,
  50
);
```

#### 2. Edge Function Performance
- **Response Time**: Should be < 2 seconds
- **Concurrent Requests**: Test with 10+ simultaneous requests
- **Error Handling**: Test with invalid data

### Security Testing

#### 1. RLS Policies
```sql
-- Test that volunteers can't see all user data
-- Login as volunteer and try to access user data
SELECT * FROM users WHERE role = 'blind_user';

-- Test that users can only see their own requests
SELECT * FROM scribe_requests WHERE user_id != 'current-user-id';
```

#### 2. Authentication
- Test with invalid JWT tokens
- Test with expired tokens
- Test with missing authentication

### Troubleshooting

#### Common Issues

1. **PostGIS not enabled**
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

2. **Location point not updating**
   - Check trigger functions
   - Verify JSONB structure

3. **Edge function not found**
   - Deploy function to Supabase
   - Check function permissions

4. **RLS blocking queries**
   - Verify RLS policies
   - Check user authentication

#### Debug Queries

```sql
-- Check if location points are set correctly
SELECT id, name, location, location_point 
FROM users 
WHERE location_point IS NOT NULL;

-- Check volunteer availability
SELECT id, name, availability 
FROM users 
WHERE role = 'volunteer' AND is_active = true;

-- Check request status
SELECT id, title, status, matched_volunteer_id 
FROM scribe_requests 
ORDER BY created_at DESC;
```

### Success Criteria

✅ **Geolocation Matching**: Nearest volunteer found based on distance  
✅ **Availability Filtering**: Only available volunteers are considered  
✅ **Real-time Updates**: Request status updates immediately  
✅ **Security**: RLS policies prevent unauthorized access  
✅ **Performance**: Matching completes in < 2 seconds  
✅ **Error Handling**: Graceful handling of edge cases  
✅ **Backup Options**: Alternative volunteers shown when no primary match  

### Production Readiness Checklist

- [ ] All migrations applied to production database
- [ ] Edge function deployed to production
- [ ] RLS policies tested and verified
- [ ] Performance benchmarks met
- [ ] Error monitoring configured
- [ ] Backup and recovery procedures tested
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Documentation updated
- [ ] Team training completed
