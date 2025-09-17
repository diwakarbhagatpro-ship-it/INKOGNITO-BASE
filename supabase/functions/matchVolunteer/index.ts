import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestData {
  requestId: string
  userId: string
  location: {
    lat: number
    lng: number
  }
  language?: string
  maxDistanceKm?: number
}

interface MatchResult {
  success: boolean
  matched: boolean
  volunteer?: {
    id: string
    name: string
    email: string
    distance_km: number
    reliability_score: number
    languages: string[]
    match_score: number
  }
  backup_volunteers?: any[]
  message: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { requestId, userId, location, language = 'en', maxDistanceKm = 50 }: RequestData = await req.json()

    if (!requestId || !userId || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestId, userId, location' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create geography point
    const locationPoint = `POINT(${location.lng} ${location.lat})`

    // Call the auto_match_volunteer function
    const { data: matchedVolunteerId, error: matchError } = await supabaseClient
      .rpc('auto_match_volunteer', { request_id: requestId })

    if (matchError) {
      console.error('Error in auto_match_volunteer:', matchError)
      return new Response(
        JSON.stringify({ error: 'Failed to find volunteers', details: matchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: MatchResult

    if (matchedVolunteerId) {
      // Get volunteer details
      const { data: volunteer, error: volunteerError } = await supabaseClient
        .from('users')
        .select('id, full_name, email, reliability_score, languages')
        .eq('id', matchedVolunteerId)
        .single()

      if (volunteerError) {
        console.error('Error fetching volunteer details:', volunteerError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch volunteer details' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get match details
      const { data: match, error: matchDetailsError } = await supabaseClient
        .from('matches')
        .select('distance_km, match_score')
        .eq('request_id', requestId)
        .eq('volunteer_id', matchedVolunteerId)
        .single()

      if (matchDetailsError) {
        console.error('Error fetching match details:', matchDetailsError)
      }

      result = {
        success: true,
        matched: true,
        volunteer: {
          id: volunteer.id,
          name: volunteer.full_name,
          email: volunteer.email,
          distance_km: match?.distance_km || 0,
          reliability_score: volunteer.reliability_score,
          languages: volunteer.languages || [],
          match_score: match?.match_score || 0
        },
        message: `Found volunteer: ${volunteer.full_name} (${match?.distance_km || 0}km away)`
      }

      // Send notification to volunteer
      await sendVolunteerNotification(volunteer.email, volunteer.full_name, requestId)

    } else {
      // Get backup volunteers for fallback
      const { data: backupVolunteers, error: backupError } = await supabaseClient
        .rpc('find_best_volunteers', {
          request_location: locationPoint,
          request_language: language,
          max_results: 3
        })

      result = {
        success: true,
        matched: false,
        backup_volunteers: backupVolunteers || [],
        message: 'No volunteers available nearby. We have some backup options for you.'
      }
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error in matchVolunteer function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to send notifications
async function sendVolunteerNotification(email: string, name: string, requestId: string) {
  try {
    // Send email notification
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: 'New Scribe Request - InscribeMate'
        }],
        from: { email: 'noreply@inscribemate.com' },
        content: [{
          type: 'text/html',
          value: `
            <h2>New Scribe Request Available!</h2>
            <p>Hello ${name},</p>
            <p>A new scribe request has been matched with you. Please check your dashboard to view details and respond.</p>
            <p>Request ID: ${requestId}</p>
            <p>Best regards,<br>InscribeMate Team</p>
          `
        }]
      })
    })

    if (!emailResponse.ok) {
      console.error('Failed to send email notification')
    }

    // Send SMS notification if phone number available
    // This would require additional volunteer phone number lookup
    // Implementation depends on your SMS provider (Twilio, etc.)

  } catch (error) {
    console.error('Error sending notification:', error)
  }
}