import { Request, Response } from 'express';
import { supabaseServer } from '../lib/supabaseServer';
import { z } from 'zod';

// Validation schema for matchmaking request
const matchmakingRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().min(0).max(100).default(10),
  language: z.string().optional(),
  requestId: z.string().uuid().optional(),
});

/**
 * Find nearby available volunteers based on location
 */
export async function getNearbyVolunteers(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = matchmakingRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: validationResult.error.errors
      });
    }
    
    const { lat, lng, radiusKm, language, requestId } = validationResult.data;
    
    // Call the Supabase stored procedure for finding volunteers
    const { data, error } = await supabaseServer.rpc('find_available_volunteers', {
      user_location: `POINT(${lng} ${lat})`,
      max_distance_km: radiusKm,
      preferred_language: language || null,
      request_id: requestId || null
    });
    
    if (error) {
      console.error('Error finding volunteers:', error);
      return res.status(500).json({
        error: 'Failed to find volunteers',
        details: error.message
      });
    }
    
    return res.status(200).json({
      volunteers: data,
      count: data?.length || 0,
      searchParams: {
        location: { lat, lng },
        radiusKm,
        language
      }
    });
    
  } catch (error: any) {
    console.error('Matchmaking error:', error);
    return res.status(500).json({
      error: 'Matchmaking service error',
      details: error.message || 'An unexpected error occurred'
    });
  }
}

/**
 * Match a user with the best available volunteer
 */
export async function matchWithVolunteer(req: Request, res: Response) {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        details: 'You must be logged in to request a match'
      });
    }
    
    // Validate request body
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'requestId is required'
      });
    }
    
    // Get the request details
    const { data: requestData, error: requestError } = await supabaseServer
      .from('scribe_requests')
      .select('*')
      .eq('id', requestId)
      .single();
      
    if (requestError || !requestData) {
      return res.status(404).json({
        error: 'Request not found',
        details: requestError?.message || 'The specified request does not exist'
      });
    }
    
    // Verify the request belongs to the authenticated user
    if (requestData.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        details: 'You can only match your own requests'
      });
    }
    
    // Call the Supabase function to find the best volunteer
    const { data: matchResult, error: matchError } = await supabaseServer.rpc('find_best_volunteer', {
      request_id: requestId
    });
    
    if (matchError) {
      console.error('Error finding best volunteer:', matchError);
      return res.status(500).json({
        error: 'Failed to find a volunteer',
        details: matchError.message
      });
    }
    
    if (!matchResult || !matchResult.volunteer_id) {
      // No volunteer found, update request status
      await supabaseServer
        .from('scribe_requests')
        .update({ status: 'waiting' })
        .eq('id', requestId);
        
      return res.status(200).json({
        matched: false,
        message: 'No volunteers available at this time'
      });
    }
    
    // Create a match record
    const { data: match, error: createMatchError } = await supabaseServer
      .from('matches')
      .insert({
        request_id: requestId,
        volunteer_id: matchResult.volunteer_id,
        status: 'pending',
        match_score: matchResult.match_score,
        distance_km: matchResult.distance_km
      })
      .select()
      .single();
      
    if (createMatchError) {
      console.error('Error creating match:', createMatchError);
      return res.status(500).json({
        error: 'Failed to create match',
        details: createMatchError.message
      });
    }
    
    // Update request status
    await supabaseServer
      .from('scribe_requests')
      .update({ status: 'matched' })
      .eq('id', requestId);
      
    // Get volunteer details
    const { data: volunteer, error: volunteerError } = await supabaseServer
      .from('users')
      .select('id, name, languages, reliability_score')
      .eq('id', matchResult.volunteer_id)
      .single();
      
    return res.status(200).json({
      matched: true,
      match: match,
      volunteer: volunteer,
      distance_km: matchResult.distance_km,
      match_score: matchResult.match_score
    });
    
  } catch (error: any) {
    console.error('Match creation error:', error);
    return res.status(500).json({
      error: 'Match creation failed',
      details: error.message || 'An unexpected error occurred'
    });
  }
}