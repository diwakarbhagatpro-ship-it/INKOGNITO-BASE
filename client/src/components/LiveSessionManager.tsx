import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  MessageCircle,
  Video,
  Mic,
  MicOff
} from 'lucide-react';
import { useTTS } from '@/lib/tts';
import { useAuth } from '@/contexts/AuthContext';

interface LiveSession {
  id: string;
  requestId: string;
  userId: string;
  volunteerId: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  duration: number; // in minutes
  actualDuration?: number;
  notes?: string;
  request: {
    title: string;
    description: string;
    examType: string;
    subject: string;
    scheduledDate: Date;
    location: {
      lat: number;
      lng: number;
      address: string;
    };
    specialRequirements?: string;
  };
  volunteer: {
    name: string;
    email: string;
    phoneNumber?: string;
    languages: string[];
  };
  user: {
    name: string;
    email: string;
    phoneNumber?: string;
  };
}

interface LiveSessionManagerProps {
  session: LiveSession;
  onUpdateSession: (sessionId: string, updates: any) => Promise<void>;
  onEndSession: (sessionId: string) => Promise<void>;
}

export const LiveSessionManager: React.FC<LiveSessionManagerProps> = ({
  session,
  onUpdateSession,
  onEndSession,
}) => {
  const { speak, speakSuccess, speakError } = useTTS();
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(session.status === 'active');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [sessionNotes, setSessionNotes] = useState(session.notes || '');

  // Timer for active sessions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && session.status === 'active') {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, session.status]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = async () => {
    try {
      await onUpdateSession(session.id, {
        status: 'active',
        startTime: new Date().toISOString(),
      });
      setIsActive(true);
      speakSuccess('Session started successfully');
    } catch (error) {
      speakError('Failed to start session');
    }
  };

  const handleEndSession = async () => {
    try {
      const actualDuration = Math.floor(elapsedTime / 60); // Convert to minutes
      await onUpdateSession(session.id, {
        status: 'completed',
        endTime: new Date().toISOString(),
        actualDuration,
        notes: sessionNotes,
      });
      await onEndSession(session.id);
      speakSuccess('Session ended successfully');
    } catch (error) {
      speakError('Failed to end session');
    }
  };

  const handlePauseSession = async () => {
    // In a real implementation, you might pause the session timer
    // For now, we'll just toggle the active state
    setIsActive(!isActive);
    speak(isActive ? 'Session paused' : 'Session resumed');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    speak(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    speak(isVideoEnabled ? 'Video disabled' : 'Video enabled');
  };

  const handleNotesChange = (notes: string) => {
    setSessionNotes(notes);
  };

  const isUser = user?.id === session.userId;
  const otherParticipant = isUser ? session.volunteer : session.user;

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Live Session
              </CardTitle>
              <CardDescription>
                {session.request.title} - {session.request.subject}
              </CardDescription>
            </div>
            <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
              {session.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{session.request.location.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {isUser ? 'Volunteer' : 'Student'}: {otherParticipant.name}
                </span>
              </div>
              {otherParticipant.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{otherParticipant.phoneNumber}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm">
                <strong>Scheduled:</strong> {new Date(session.request.scheduledDate).toLocaleString()}
              </div>
              <div className="text-sm">
                <strong>Duration:</strong> {session.duration} minutes
              </div>
              {session.actualDuration && (
                <div className="text-sm">
                  <strong>Actual:</strong> {session.actualDuration} minutes
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Controls */}
      {session.status === 'scheduled' && (
        <Card>
          <CardHeader>
            <CardTitle>Session Controls</CardTitle>
            <CardDescription>
              Start the session when both participants are ready
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={handleStartSession} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {session.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Active Session</CardTitle>
            <CardDescription>
              Session is currently in progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Timer */}
            <div className="text-center">
              <div className="text-3xl font-mono font-bold">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                Elapsed Time
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round((elapsedTime / (session.duration * 60)) * 100)}%</span>
              </div>
              <Progress 
                value={(elapsedTime / (session.duration * 60)) * 100} 
                className="h-2"
              />
            </div>

            {/* Controls */}
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={handlePauseSession}
                className="flex items-center gap-2"
              >
                {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isActive ? 'Pause' : 'Resume'}
              </Button>
              
              <Button
                variant="outline"
                onClick={toggleMute}
                className={`flex items-center gap-2 ${isMuted ? 'bg-red-100 text-red-700' : ''}`}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
              
              <Button
                variant="outline"
                onClick={toggleVideo}
                className={`flex items-center gap-2 ${isVideoEnabled ? 'bg-green-100 text-green-700' : ''}`}
              >
                <Video className="h-4 w-4" />
                {isVideoEnabled ? 'Video On' : 'Video Off'}
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleEndSession}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Session Notes</CardTitle>
          <CardDescription>
            Add notes about the session (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={sessionNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add any notes about the session..."
            className="w-full min-h-[100px] p-3 border rounded-md resize-none"
            aria-label="Session notes"
          />
        </CardContent>
      </Card>

      {/* Special Requirements */}
      {session.request.specialRequirements && (
        <Alert>
          <MessageCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Special Requirements:</strong> {session.request.specialRequirements}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
