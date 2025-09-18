import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Star,
  Languages,
  Calendar
} from 'lucide-react';
import { useRealtimeMatches } from '@/hooks/useRealtime';
import { useTTS } from '@/lib/tts';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface MatchWithRequest {
  id: string;
  request_id: string;
  volunteer_id: string;
  status: string;
  match_score: number;
  distance_km: number;
  created_at: string;
  request: {
    id: string;
    title: string;
    description: string;
    exam_type: string;
    subject: string;
    scheduled_date: string;
    duration: number;
    urgency: string;
    location: {
      lat: number;
      lng: number;
      address: string;
    };
    user_id: string;
  };
}

export const VolunteerDashboard: React.FC = () => {
  const { matches, loading } = useRealtimeMatches();
  const { speak, speakSuccess, speakError } = useTTS();
  const [processingMatch, setProcessingMatch] = useState<string | null>(null);

  const handleMatchResponse = async (matchId: string, response: 'accepted' | 'declined') => {
    setProcessingMatch(matchId);
    
    try {
      const { error } = await supabase
        .from('matches')
        .update({ 
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', matchId);

      if (error) {
        throw error;
      }

      if (response === 'accepted') {
        speakSuccess('Request accepted successfully!');
      } else {
        speak('Request declined.');
      }
    } catch (error: any) {
      console.error('Error responding to match:', error);
      speakError('Failed to respond to request. Please try again.');
    } finally {
      setProcessingMatch(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-600">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your scribe requests and help students succeed
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Active Matches</p>
          <p className="text-2xl font-bold text-primary">
            {matches.filter(m => m.status === 'pending' || m.status === 'accepted').length}
          </p>
        </div>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
            <p className="text-muted-foreground">
              You'll see new scribe requests here as they come in. Make sure your availability is up to date!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match: any) => (
            <Card key={match.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{match.request.title}</CardTitle>
                    <CardDescription>
                      {match.request.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(match.status)}
                    <Badge 
                      variant="outline" 
                      className={getUrgencyColor(match.request.urgency)}
                    >
                      {match.request.urgency.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Request Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(match.request.scheduled_date), 'PPP p')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{match.request.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{match.request.location.address}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{match.request.exam_type} - {match.request.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span>Match Score: {match.match_score?.toFixed(1)}/100</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{match.distance_km}km away</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {match.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleMatchResponse(match.id, 'accepted')}
                      disabled={processingMatch === match.id}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Accept Request
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleMatchResponse(match.id, 'declined')}
                      disabled={processingMatch === match.id}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                )}

                {match.status === 'accepted' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      You've accepted this request. The student will be notified and you can coordinate the session details.
                    </AlertDescription>
                  </Alert>
                )}

                {match.status === 'declined' && (
                  <Alert className="border-gray-200 bg-gray-50">
                    <XCircle className="h-4 w-4 text-gray-600" />
                    <AlertDescription className="text-gray-800">
                      You declined this request. It has been reassigned to another volunteer.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
