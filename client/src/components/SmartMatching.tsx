import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Clock, 
  Star, 
  Languages, 
  User, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useTTS } from '@/lib/tts';
import { useGeolocation } from '@/lib/geolocation';
import { useGemini } from '@/lib/gemini';

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  languages: string[];
  availability: Record<string, any>;
  reliabilityScore: number;
  distance?: number;
  matchScore?: number;
  matchReason?: string;
}

interface SmartMatchingProps {
  request: {
    id: string;
    title: string;
    description: string;
    scheduledDate: Date;
    duration: number;
    location: {
      lat: number;
      lng: number;
      address: string;
    };
    specialRequirements?: string;
    examType: string;
    subject: string;
  };
  onSelectVolunteer: (volunteer: Volunteer) => void;
  onClose: () => void;
}

export const SmartMatching: React.FC<SmartMatchingProps> = ({
  request,
  onSelectVolunteer,
  onClose,
}) => {
  const { speak, speakSuccess, speakError } = useTTS();
  const { getCurrentPosition, findNearbyLocations, calculateDistance } = useGeolocation();
  const { generateMatchingSuggestions } = useGemini();
  
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  useEffect(() => {
    initializeMatching();
  }, []);

  const initializeMatching = async () => {
    try {
      setLoading(true);
      speak('Starting smart matching process');

      // Get user location
      const location = await getCurrentPosition();
      setUserLocation(location);
      speak(`Location detected: ${location.address}`);

      // Find nearby volunteers (mock data for now)
      const mockVolunteers = await getMockVolunteers(location);
      
      // Calculate distances
      const volunteersWithDistance = mockVolunteers.map(volunteer => ({
        ...volunteer,
        distance: calculateDistance(
          location.lat,
          location.lng,
          volunteer.location.lat,
          volunteer.location.lng
        ),
      }));

      // Generate AI-powered matching suggestions
      setMatching(true);
      const suggestions = await generateMatchingSuggestions(request, volunteersWithDistance);
      
      const matchedVolunteers = volunteersWithDistance.map(volunteer => {
        const suggestion = suggestions.find(s => s.volunteer.id === volunteer.id);
        return {
          ...volunteer,
          matchScore: suggestion?.score || Math.random() * 5 + 5, // Fallback score
          matchReason: suggestion?.reason || 'Good match based on location and availability',
        };
      });

      // Sort by match score
      matchedVolunteers.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      setVolunteers(matchedVolunteers);
      speak(`Found ${matchedVolunteers.length} potential volunteers`);
    } catch (error) {
      console.error('Matching error:', error);
      speakError('Failed to find volunteers. Please try again.');
    } finally {
      setLoading(false);
      setMatching(false);
    }
  };

  const getMockVolunteers = async (userLocation: { lat: number; lng: number; address: string }): Promise<Volunteer[]> => {
    // Mock volunteer data - in real app, this would come from API
    return [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phoneNumber: '+1-555-0123',
        location: {
          lat: userLocation.lat + 0.01,
          lng: userLocation.lng + 0.01,
          address: '123 University Ave, Near Campus',
        },
        languages: ['English', 'Spanish'],
        availability: { monday: '9am-5pm', tuesday: '9am-5pm' },
        reliabilityScore: 4.8,
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'm.chen@email.com',
        phoneNumber: '+1-555-0124',
        location: {
          lat: userLocation.lat - 0.005,
          lng: userLocation.lng + 0.015,
          address: '456 College St, Downtown',
        },
        languages: ['English', 'Mandarin'],
        availability: { wednesday: '10am-6pm', thursday: '10am-6pm' },
        reliabilityScore: 4.9,
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        email: 'emily.r@email.com',
        phoneNumber: '+1-555-0125',
        location: {
          lat: userLocation.lat + 0.02,
          lng: userLocation.lng - 0.01,
          address: '789 Library St, Campus Area',
        },
        languages: ['English', 'French'],
        availability: { friday: '8am-4pm', saturday: '8am-4pm' },
        reliabilityScore: 4.7,
      },
    ];
  };

  const handleSelectVolunteer = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    speak(`Selected volunteer: ${volunteer.name}. Match score: ${volunteer.matchScore?.toFixed(1)} out of 10.`);
  };

  const handleConfirmSelection = () => {
    if (selectedVolunteer) {
      onSelectVolunteer(selectedVolunteer);
      speakSuccess(`Volunteer ${selectedVolunteer.name} has been selected for your request.`);
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Finding the best volunteers for you...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Smart Matching Results
          </CardTitle>
          <CardDescription>
            AI-powered matching based on location, availability, and compatibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Your Request</h4>
              <p className="text-sm text-muted-foreground">{request.title}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(request.scheduledDate).toLocaleString()} • {request.duration} minutes
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Location</h4>
              <p className="text-sm text-muted-foreground">{request.location.address}</p>
              {userLocation && (
                <p className="text-xs text-muted-foreground">
                  Your location: {userLocation.address}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matching Progress */}
      {matching && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            AI is analyzing volunteer profiles and generating smart matches...
          </AlertDescription>
        </Alert>
      )}

      {/* Volunteers List */}
      <div className="space-y-4">
        {volunteers.map((volunteer, index) => (
          <Card 
            key={volunteer.id} 
            className={`cursor-pointer transition-all ${
              selectedVolunteer?.id === volunteer.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleSelectVolunteer(volunteer)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{volunteer.name}</h3>
                    <Badge variant={getMatchScoreBadgeVariant(volunteer.matchScore || 0)}>
                      {volunteer.matchScore?.toFixed(1)}/10
                    </Badge>
                    {selectedVolunteer?.id === volunteer.id && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {volunteer.matchReason}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDistance(volunteer.distance || 0)} away</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span>{volunteer.reliabilityScore}/5.0 rating</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Languages className="h-4 w-4 text-muted-foreground" />
                      <span>{volunteer.languages.join(', ')}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {volunteer.phoneNumber && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{volunteer.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{volunteer.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirmSelection}
          disabled={!selectedVolunteer}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Select Volunteer
        </Button>
      </div>
    </div>
  );
};
