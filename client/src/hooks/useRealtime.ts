import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/lib/notifications';

export interface RealtimeRequest {
  id: string;
  title: string;
  description: string;
  exam_type: string;
  subject: string;
  scheduled_date: string;
  duration: number;
  urgency: string;
  status: string;
  user_id: string;
  created_at: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface RealtimeMatch {
  id: string;
  request_id: string;
  volunteer_id: string;
  status: string;
  match_score: number;
  distance_km: number;
  created_at: string;
  request?: RealtimeRequest;
}

export const useRealtimeRequests = () => {
  const { user } = useAuth();
  const { showMatchNotification, showNoVolunteersNotification, showReassignmentNotification } = useNotifications();
  const [requests, setRequests] = useState<RealtimeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('scribe_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        setRequests(data || []);
      }
      setLoading(false);
    };

    fetchRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('user_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scribe_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Request change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setRequests(prev => [payload.new as RealtimeRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRequest = payload.new as RealtimeRequest;
            setRequests(prev => 
              prev.map(req => 
                req.id === updatedRequest.id ? updatedRequest : req
              )
            );
            
            // Show notifications based on status changes
            if (updatedRequest.status === 'matched') {
              showMatchNotification({
                volunteerName: 'Volunteer Found',
                distance: 0, // Will be updated when match details are available
                requestTitle: updatedRequest.title,
                matchId: updatedRequest.id
              });
            } else if (updatedRequest.status === 'waiting') {
              showNoVolunteersNotification();
            }
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => 
              prev.filter(req => req.id !== payload.old.id)
            );
          }
        }
      )
      .on(
        'broadcast',
        { event: 'volunteer_accepted' },
        (payload) => {
          console.log('Volunteer accepted:', payload);
          showMatchNotification({
            volunteerName: 'Volunteer',
            distance: 0,
            requestTitle: 'Your request',
            matchId: payload.matchId
          });
        }
      )
      .on(
        'broadcast',
        { event: 'volunteer_reassigned' },
        (payload) => {
          console.log('Volunteer reassigned:', payload);
          showReassignmentNotification(payload.volunteerName || 'New Volunteer');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { requests, loading };
};

export const useRealtimeMatches = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<RealtimeMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          request:scribe_requests(*)
        `)
        .eq('volunteer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching matches:', error);
      } else {
        setMatches(data || []);
      }
      setLoading(false);
    };

    fetchMatches();

    // Set up real-time subscription
    const channel = supabase
      .channel('volunteer_matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `volunteer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Match change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setMatches(prev => [payload.new as RealtimeMatch, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMatches(prev => 
              prev.map(match => 
                match.id === payload.new.id ? payload.new as RealtimeMatch : match
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { matches, loading };
};

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Set up notification channel
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `volunteer_id=eq.${user.id}`
        },
        (payload) => {
          // Show browser notification
          if (Notification.permission === 'granted') {
            new Notification('New Scribe Request', {
              body: 'You have a new scribe request available',
              icon: '/icon-192x192.png'
            });
          }

          // Add to notifications list
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { notifications };
};
