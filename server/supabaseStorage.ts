import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  type User, 
  type NewUser, 
  type ScribeRequest, 
  type NewScribeRequest,
  type ScribeSession,
  type NewScribeSession,
  type VolunteerApplication,
  type NewVolunteerApplication,
  type ChatHistory,
  type NewChatHistory,
  type ScribeRequestWithUser,
  type ScribeSessionWithDetails,
  type UserRole,
  type RequestStatus,
  type ApplicationStatus
} from "@shared/schema";

export class SupabaseStorage {
  private supabase: SupabaseClient;

  constructor() {
    // Load environment variables with fallbacks for Vercel
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                       process.env.SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables:', {
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        SUPABASE_URL: process.env.SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'present' : 'missing'
      });
      throw new Error('Missing Supabase environment variables. Please check your Vercel environment variables.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // User management methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found
        throw error;
      }

      return data as User;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found
        throw error;
      }

      return data as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async createUser(newUser: NewUser): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<NewUser>): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .eq('is_active', true);

      if (error) throw error;
      return data as User[];
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  async getAvailableVolunteers(): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('role', 'volunteer')
        .eq('is_active', true);

      if (error) throw error;
      return data as User[];
    } catch (error) {
      console.error('Error getting available volunteers:', error);
      throw error;
    }
  }

  // Scribe request methods
  async getScribeRequest(id: string): Promise<ScribeRequestWithUser | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('scribe_requests')
        .select(`
          *,
          user:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found
        throw error;
      }

      return data as ScribeRequestWithUser;
    } catch (error) {
      console.error('Error getting scribe request:', error);
      throw error;
    }
  }

  async getScribeRequestsByUser(userId: string): Promise<ScribeRequestWithUser[]> {
    try {
      const { data, error } = await this.supabase
        .from('scribe_requests')
        .select(`
          *,
          user:users(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ScribeRequestWithUser[];
    } catch (error) {
      console.error('Error getting scribe requests by user:', error);
      throw error;
    }
  }

  async getScribeRequestsByStatus(status: RequestStatus): Promise<ScribeRequestWithUser[]> {
    try {
      const { data, error } = await this.supabase
        .from('scribe_requests')
        .select(`
          *,
          user:users(*)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ScribeRequestWithUser[];
    } catch (error) {
      console.error('Error getting scribe requests by status:', error);
      throw error;
    }
  }

  async createScribeRequest(newRequest: NewScribeRequest): Promise<ScribeRequest> {
    try {
      const { data, error } = await this.supabase
        .from('scribe_requests')
        .insert(newRequest)
        .select()
        .single();

      if (error) throw error;
      return data as ScribeRequest;
    } catch (error) {
      console.error('Error creating scribe request:', error);
      throw error;
    }
  }

  async updateScribeRequest(id: string, updates: Partial<NewScribeRequest & { status: RequestStatus }>): Promise<ScribeRequest> {
    try {
      const { data, error } = await this.supabase
        .from('scribe_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ScribeRequest;
    } catch (error) {
      console.error('Error updating scribe request:', error);
      throw error;
    }
  }

  async deleteScribeRequest(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('scribe_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting scribe request:', error);
      throw error;
    }
  }

  // Session management methods
  async getScribeSession(id: string): Promise<ScribeSessionWithDetails | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('scribe_sessions')
        .select(`
          *,
          request:scribe_requests(*),
          user:users(*),
          volunteer:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found
        throw error;
      }

      return data as ScribeSessionWithDetails;
    } catch (error) {
      console.error('Error getting scribe session:', error);
      throw error;
    }
  }

  async getSessionsByUser(userId: string): Promise<ScribeSessionWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('scribe_sessions')
        .select(`
          *,
          request:scribe_requests(*),
          user:users(*),
          volunteer:users(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ScribeSessionWithDetails[];
    } catch (error) {
      console.error('Error getting sessions by user:', error);
      throw error;
    }
  }

  async getSessionsByVolunteer(volunteerId: string): Promise<ScribeSessionWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('scribe_sessions')
        .select(`
          *,
          request:scribe_requests(*),
          user:users(*),
          volunteer:users(*)
        `)
        .eq('volunteer_id', volunteerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ScribeSessionWithDetails[];
    } catch (error) {
      console.error('Error getting sessions by volunteer:', error);
      throw error;
    }
  }

  async createScribeSession(newSession: NewScribeSession): Promise<ScribeSession> {
    try {
      const { data, error } = await this.supabase
        .from('scribe_sessions')
        .insert(newSession)
        .select()
        .single();

      if (error) throw error;
      return data as ScribeSession;
    } catch (error) {
      console.error('Error creating scribe session:', error);
      throw error;
    }
  }

  async updateScribeSession(id: string, updates: Partial<NewScribeSession>): Promise<ScribeSession> {
    try {
      const { data, error } = await this.supabase
        .from('scribe_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ScribeSession;
    } catch (error) {
      console.error('Error updating scribe session:', error);
      throw error;
    }
  }

  // Volunteer applications methods
  async getApplicationsForRequest(requestId: string): Promise<(VolunteerApplication & { volunteer: User })[]> {
    try {
      const { data, error } = await this.supabase
        .from('volunteer_applications')
        .select(`
          *,
          volunteer:users(*)
        `)
        .eq('request_id', requestId)
        .order('match_score', { ascending: false });

      if (error) throw error;
      return data as (VolunteerApplication & { volunteer: User })[];
    } catch (error) {
      console.error('Error getting applications for request:', error);
      throw error;
    }
  }

  async getApplicationsByVolunteer(volunteerId: string): Promise<(VolunteerApplication & { request: ScribeRequest })[]> {
    try {
      const { data, error } = await this.supabase
        .from('volunteer_applications')
        .select(`
          *,
          request:scribe_requests(*)
        `)
        .eq('volunteer_id', volunteerId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data as (VolunteerApplication & { request: ScribeRequest })[];
    } catch (error) {
      console.error('Error getting applications by volunteer:', error);
      throw error;
    }
  }

  async getApplicationByIdForValidation(id: string): Promise<VolunteerApplication | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('volunteer_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return undefined; // Not found
        throw error;
      }

      return data as VolunteerApplication;
    } catch (error) {
      console.error('Error getting application by id:', error);
      throw error;
    }
  }

  async createVolunteerApplication(application: NewVolunteerApplication): Promise<VolunteerApplication> {
    try {
      const { data, error } = await this.supabase
        .from('volunteer_applications')
        .insert(application)
        .select()
        .single();

      if (error) throw error;
      return data as VolunteerApplication;
    } catch (error) {
      console.error('Error creating volunteer application:', error);
      throw error;
    }
  }

  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<VolunteerApplication> {
    try {
      const { data, error } = await this.supabase
        .from('volunteer_applications')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as VolunteerApplication;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }

  // Chat history methods
  async getChatHistory(userId: string, limit = 50): Promise<ChatHistory[]> {
    try {
      const { data, error } = await this.supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ChatHistory[];
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async createChatEntry(chat: NewChatHistory): Promise<ChatHistory> {
    try {
      const { data, error } = await this.supabase
        .from('chat_history')
        .insert(chat)
        .select()
        .single();

      if (error) throw error;
      return data as ChatHistory;
    } catch (error) {
      console.error('Error creating chat entry:', error);
      throw error;
    }
  }

  // Analytics methods
  async getRequestAnalytics(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    completedSessions: number;
    activeVolunteers: number;
  }> {
    try {
      const [requestsResult, sessionsResult, volunteersResult] = await Promise.all([
        this.supabase.from('scribe_requests').select('status', { count: 'exact' }),
        this.supabase.from('scribe_sessions').select('status', { count: 'exact' }).eq('status', 'completed'),
        this.supabase.from('users').select('id', { count: 'exact' }).eq('role', 'volunteer').eq('is_active', true)
      ]);

      if (requestsResult.error) throw requestsResult.error;
      if (sessionsResult.error) throw sessionsResult.error;
      if (volunteersResult.error) throw volunteersResult.error;

      const totalRequests = requestsResult.count || 0;
      const pendingRequests = requestsResult.data?.filter(r => r.status === 'pending').length || 0;
      const completedSessions = sessionsResult.count || 0;
      const activeVolunteers = volunteersResult.count || 0;

      return { totalRequests, pendingRequests, completedSessions, activeVolunteers };
    } catch (error) {
      console.error('Error getting request analytics:', error);
      throw error;
    }
  }

  // Geographic and matching utilities
  async findNearbyVolunteers(location: { lat: number; lng: number }, radiusKm: number): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('find_available_volunteers', {
          request_location: `POINT(${location.lng} ${location.lat})`,
          request_time: new Date().toISOString(),
          max_distance_km: radiusKm,
          limit_count: 10
        });

      if (error) throw error;
      return data as User[];
    } catch (error) {
      console.error('Error finding nearby volunteers:', error);
      throw error;
    }
  }

  async calculateMatchScore(requestId: string, volunteerId: string): Promise<number> {
    try {
      // Get request and volunteer data
      const [requestResult, volunteerResult] = await Promise.all([
        this.supabase.from('scribe_requests').select('*').eq('id', requestId).single(),
        this.supabase.from('users').select('*').eq('id', volunteerId).single()
      ]);

      if (requestResult.error) throw requestResult.error;
      if (volunteerResult.error) throw volunteerResult.error;

      const request = requestResult.data;
      const volunteer = volunteerResult.data;

      if (!request || !volunteer) return 0;

      let score = 50; // Base score

      // Language matching
      if (volunteer.languages?.includes('English')) score += 20;

      // Location proximity
      if (request.location && volunteer.location) {
        const distance = this.calculateDistance(
          request.location as { lat: number; lng: number },
          volunteer.location as { lat: number; lng: number }
        );
        if (distance < 10) score += 20;
        else if (distance < 25) score += 10;
      }

      // Reliability score
      const reliability = parseFloat(volunteer.reliability_score || "3.0");
      score += reliability * 4; // Max 20 points for 5.0 rating

      return Math.min(100, score);
    } catch (error) {
      console.error('Error calculating match score:', error);
      return 0;
    }
  }

  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorage();