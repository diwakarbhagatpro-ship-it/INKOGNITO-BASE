import { supabase } from './supabase';

// API service for making authenticated requests
class ApiService {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    };
  }

  // User API methods
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUser(updates: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getVolunteers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'volunteer')
      .eq('is_active', true);

    if (error) throw error;
    return data;
  }

  // Scribe Request API methods
  async getScribeRequests(userId?: string, status?: string) {
    let query = supabase
      .from('scribe_requests')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getScribeRequest(id: string) {
    const { data, error } = await supabase
      .from('scribe_requests')
      .select(`
        *,
        user:users(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createScribeRequest(requestData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('scribe_requests')
      .insert({
        ...requestData,
        user_id: user.id,
      })
      .select(`
        *,
        user:users(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateScribeRequest(id: string, updates: any) {
    const { data, error } = await supabase
      .from('scribe_requests')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user:users(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteScribeRequest(id: string) {
    const { error } = await supabase
      .from('scribe_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Session API methods
  async getSessions(userId?: string, volunteerId?: string) {
    let query = supabase
      .from('scribe_sessions')
      .select(`
        *,
        request:scribe_requests(*),
        user:users(*),
        volunteer:users(*)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (volunteerId) {
      query = query.eq('volunteer_id', volunteerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getSession(id: string) {
    const { data, error } = await supabase
      .from('scribe_sessions')
      .select(`
        *,
        request:scribe_requests(*),
        user:users(*),
        volunteer:users(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateSession(id: string, updates: any) {
    const { data, error } = await supabase
      .from('scribe_sessions')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        request:scribe_requests(*),
        user:users(*),
        volunteer:users(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Volunteer Application API methods
  async getApplicationsForRequest(requestId: string) {
    const { data, error } = await supabase
      .from('volunteer_applications')
      .select(`
        *,
        volunteer:users(*)
      `)
      .eq('request_id', requestId)
      .order('match_score', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createVolunteerApplication(applicationData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('volunteer_applications')
      .insert({
        ...applicationData,
        volunteer_id: user.id,
      })
      .select(`
        *,
        volunteer:users(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateApplicationStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('volunteer_applications')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        volunteer:users(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Chat API methods
  async getChatHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async createChatEntry(chatData: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        ...chatData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Analytics API methods
  async getAnalytics() {
    const { data, error } = await supabase
      .from('scribe_requests')
      .select('status');

    if (error) throw error;

    const totalRequests = data.length;
    const pendingRequests = data.filter(r => r.status === 'pending').length;
    const completedSessions = data.filter(r => r.status === 'completed').length;

    // Get active volunteers count
    const { data: volunteers, error: volunteerError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'volunteer')
      .eq('is_active', true);

    if (volunteerError) throw volunteerError;

    return {
      totalRequests,
      pendingRequests,
      completedSessions,
      activeVolunteers: volunteers.length,
    };
  }

  // Matching API methods
  async findNearbyVolunteers(location: { lat: number; lng: number }, radiusKm = 50) {
    const { data, error } = await supabase
      .rpc('find_available_volunteers', {
        request_location: `POINT(${location.lng} ${location.lat})`,
        request_time: new Date().toISOString(),
        max_distance_km: radiusKm,
        limit_count: 10
      });

    if (error) throw error;
    return data;
  }

  async calculateMatchScore(requestId: string, volunteerId: string) {
    // This would typically be done server-side
    // For now, return a mock score
    return Math.floor(Math.random() * 100);
  }

  // Real-time subscriptions
  subscribeToRequests(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('user_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scribe_requests',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToSessions(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('user_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scribe_sessions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToVolunteerSessions(volunteerId: string, callback: (payload: any) => void) {
    return supabase
      .channel('volunteer_sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scribe_sessions',
          filter: `volunteer_id=eq.${volunteerId}`
        },
        callback
      )
      .subscribe();
  }
}

// Export singleton instance
export const api = new ApiService();