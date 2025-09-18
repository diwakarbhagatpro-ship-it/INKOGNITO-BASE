import { Request, Response } from 'express';
import { supabaseServer } from '../lib/supabaseServer';

export async function getNearbyVolunteers(req: Request, res: Response) {
  try {
    const { lat, lng, radiusKm = 50, requestId } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Use Supabase PostGIS function to find nearby volunteers
    const { data, error } = await supabaseServer.rpc('find_available_volunteers', {
      request_location: `POINT(${lng} ${lat})`,
      request_time: new Date().toISOString(),
      max_distance_km: radiusKm,
      limit_count: 10
    });

    if (error) {
      console.error('Error finding volunteers:', error);
      return res.status(500).json({ error: 'Failed to find volunteers' });
    }

    // Calculate match scores for each volunteer
    const volunteersWithScores = await Promise.all(
      data.map(async (volunteer: any) => {
        let matchScore = 0;
        
        if (requestId) {
          // Calculate match score based on request requirements
          const { data: request } = await supabaseServer
            .from('scribe_requests')
            .select('*')
            .eq('id', requestId)
            .single();

          if (request) {
            // Base score from distance
            matchScore += Math.max(0, 100 - (volunteer.distance_km * 2));
            
            // Add reliability score
            matchScore += (volunteer.reliability_score || 5) * 10;
            
            // Add language match bonus
            if (volunteer.languages && request.languages) {
              const commonLanguages = volunteer.languages.filter((lang: string) => 
                request.languages.includes(lang)
              );
              matchScore += commonLanguages.length * 5;
            }
          }
        } else {
          // Default scoring
          matchScore = Math.max(0, 100 - (volunteer.distance_km * 2)) + (volunteer.reliability_score || 5) * 10;
        }

        return {
          ...volunteer,
          matchScore: Math.min(100, Math.max(0, matchScore))
        };
      })
    );

    // Sort by match score descending
    volunteersWithScores.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      volunteers: volunteersWithScores,
      total: volunteersWithScores.length,
      searchRadius: radiusKm
    });

  } catch (error) {
    console.error('Matchmaking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createMatch(req: Request, res: Response) {
  try {
    const { requestId, volunteerId, message } = req.body;

    if (!requestId || !volunteerId) {
      return res.status(400).json({ error: 'Request ID and volunteer ID are required' });
    }

    // Create volunteer application
    const { data: application, error: applicationError } = await supabaseServer
      .from('volunteer_applications')
      .insert({
        request_id: requestId,
        volunteer_id: volunteerId,
        message: message || 'I would like to help with this request.',
        status: 'pending'
      })
      .select()
      .single();

    if (applicationError) {
      console.error('Error creating application:', applicationError);
      return res.status(500).json({ error: 'Failed to create application' });
    }

    // Create match record
    const { data: match, error: matchError } = await supabaseServer
      .from('matches')
      .insert({
        request_id: requestId,
        volunteer_id: volunteerId,
        status: 'pending',
        match_score: 0 // Will be calculated later
      })
      .select()
      .single();

    if (matchError) {
      console.error('Error creating match:', matchError);
      // Don't fail the request, just log the error
    }

    res.status(201).json({
      application,
      match,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateMatchStatus(req: Request, res: Response) {
  try {
    const { matchId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'declined', 'expired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be accepted, declined, or expired' });
    }

    const { data: match, error } = await supabaseServer
      .from('matches')
      .update({ 
        status,
        responded_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      console.error('Error updating match:', error);
      return res.status(500).json({ error: 'Failed to update match' });
    }

    // If accepted, update the request status and create a session
    if (status === 'accepted') {
      const { data: request } = await supabaseServer
        .from('scribe_requests')
        .select('*')
        .eq('id', match.request_id)
        .single();

      if (request) {
        // Update request status
        await supabaseServer
          .from('scribe_requests')
          .update({ 
            status: 'matched',
            matched_volunteer_id: match.volunteer_id
          })
          .eq('id', match.request_id);

        // Create scribe session
        await supabaseServer
          .from('scribe_sessions')
          .insert({
            request_id: match.request_id,
            user_id: request.user_id,
            volunteer_id: match.volunteer_id,
            status: 'scheduled'
          });
      }
    }

    res.json(match);

  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}