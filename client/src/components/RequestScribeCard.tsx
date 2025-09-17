import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Clock, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTTS } from '@/lib/tts';
import { useGeolocation } from '@/lib/geolocation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface VolunteerMatch {
  volunteer_id: string;
  volunteer_name: string;
  volunteer_email: string;
  volunteer_phone: string;
  distance_km: number;
  reliability_score: number;
  languages: string[];
  availability: any;
}

interface RequestFormData {
  title: string;
  description: string;
  examType: string;
  subject: string;
  scheduledDate: Date;
  duration: number;
  urgency: string;
  specialRequirements: string;
  estimatedDifficulty: number;
}

export const RequestScribeCard: React.FC = () => {
  const { speak, speakSuccess, speakError } = useTTS();
  const { getCurrentPosition, isSupported } = useGeolocation();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<RequestFormData>({
    title: '',
    description: '',
    examType: '',
    subject: '',
    scheduledDate: new Date(),
    duration: 120,
    urgency: 'normal',
    specialRequirements: '',
    estimatedDifficulty: 3,
  });
  
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [volunteerMatch, setVolunteerMatch] = useState<VolunteerMatch | null>(null);
  const [backupVolunteers, setBackupVolunteers] = useState<VolunteerMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get user location on component mount
  useEffect(() => {
    if (isSupported()) {
      getCurrentPosition()
        .then(loc => {
          setLocation(loc);
          speak(`Location detected: ${loc.address}`);
        })
        .catch(err => {
          console.warn('Location not available:', err);
          speak('Location not available. You can add it manually.');
        });
    }
  }, []);

  const handleInputChange = (field: keyof RequestFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLocationUpdate = async () => {
    if (!isSupported()) {
      speakError('Geolocation is not supported by your browser');
      return;
    }

    try {
      const loc = await getCurrentPosition();
      setLocation(loc);
      speakSuccess(`Location updated: ${loc.address}`);
    } catch (error) {
      speakError('Failed to get location. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      setError('Location is required for volunteer matching');
      speakError('Location is required for volunteer matching');
      return;
    }

    if (!user) {
      setError('You must be logged in to create a request');
      speakError('You must be logged in to create a request');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create the request
      const { data: request, error: requestError } = await supabase
        .from('scribe_requests')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          exam_type: formData.examType,
          subject: formData.subject,
          scheduled_date: formData.scheduledDate.toISOString(),
          duration: formData.duration,
          location: location,
          urgency: formData.urgency,
          special_requirements: formData.specialRequirements,
          estimated_difficulty: formData.estimatedDifficulty,
          status: 'pending',
          language: 'en' // Default language, can be made dynamic
        })
        .select()
        .single();

      if (requestError) {
        throw requestError;
      }

      speak('Request created successfully. Finding nearest volunteer...');
      setIsMatching(true);

      // Call the matching function
      const { data: matchResult, error: matchError } = await supabase.functions.invoke('matchVolunteer', {
        body: {
          requestId: request.id,
          userId: user.id,
          location: {
            lat: location.lat,
            lng: location.lng
          },
          scheduledDate: formData.scheduledDate.toISOString(),
          maxDistanceKm: 50
        }
      });

      if (matchError) {
        throw matchError;
      }

      if (matchResult.matched) {
        setVolunteerMatch(matchResult.volunteer);
        setBackupVolunteers(matchResult.backup_volunteers || []);
        speakSuccess(`Found volunteer: ${matchResult.volunteer.volunteer_name} (${matchResult.volunteer.distance_km}km away)`);
        setSuccess(`Great! We found a volunteer: ${matchResult.volunteer.volunteer_name} (${matchResult.volunteer.distance_km}km away)`);
      } else {
        setBackupVolunteers(matchResult.backup_volunteers || []);
        speak('No volunteers found nearby. We have some backup options for you.');
        setError('No volunteers available nearby. Check backup options below.');
      }

    } catch (error: any) {
      console.error('Error creating request:', error);
      const errorMessage = error.message || 'Failed to create request';
      setError(errorMessage);
      speakError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsMatching(false);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const label = e.target.getAttribute('aria-label') || e.target.placeholder;
    if (label) {
      speak(`Enter your ${label.toLowerCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request a Scribe</CardTitle>
          <CardDescription>
            Fill out the form below to request scribe assistance for your exam or academic needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Location Section */}
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="flex gap-2">
                <Input
                  value={location?.address || 'Getting location...'}
                  readOnly
                  className="flex-1"
                  aria-label="Location address"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocationUpdate}
                  disabled={!isSupported()}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </div>
              {!location && (
                <p className="text-sm text-muted-foreground">
                  Location is required for volunteer matching
                </p>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="e.g., Final Exam Assistance"
                  required
                  aria-label="Request title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type</Label>
                <Select value={formData.examType} onValueChange={(value) => handleInputChange('examType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="final">Final Exam</SelectItem>
                    <SelectItem value="midterm">Midterm Exam</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                onFocus={handleInputFocus}
                placeholder="Describe your specific needs..."
                rows={3}
                aria-label="Request description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="e.g., Mathematics, Physics"
                  aria-label="Subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select value={formData.duration.toString()} onValueChange={(value) => handleInputChange('duration', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="300">5 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="space-y-2">
              <Label>Exam Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduledDate ? format(formData.scheduledDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.scheduledDate}
                    onSelect={(date) => date && handleInputChange('scheduledDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Estimated Difficulty (1-5)</Label>
                <Select value={formData.estimatedDifficulty.toString()} onValueChange={(value) => handleInputChange('estimatedDifficulty', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Easy</SelectItem>
                    <SelectItem value="2">2 - Easy</SelectItem>
                    <SelectItem value="3">3 - Moderate</SelectItem>
                    <SelectItem value="4">4 - Hard</SelectItem>
                    <SelectItem value="5">5 - Very Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequirements">Special Requirements</Label>
              <Textarea
                id="specialRequirements"
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                onFocus={handleInputFocus}
                placeholder="Any special requirements or accommodations needed..."
                rows={2}
                aria-label="Special requirements"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !location || isMatching}
              className="w-full"
              onFocus={() => speak('Submit request button')}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Request...
                </>
              ) : isMatching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding Volunteer...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Volunteer Match Results */}
      {volunteerMatch && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Volunteer Found!
            </CardTitle>
            <CardDescription className="text-green-700">
              We found a volunteer who can help you with your request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{volunteerMatch.volunteer_name}</h3>
                  <p className="text-sm text-muted-foreground">{volunteerMatch.volunteer_email}</p>
                </div>
                <Badge variant="default" className="bg-green-600">
                  {volunteerMatch.distance_km}km away
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Rating: {volunteerMatch.reliability_score}/5.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Languages: {volunteerMatch.languages.join(', ')}</span>
                </div>
              </div>

              {volunteerMatch.volunteer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span>Phone: {volunteerMatch.volunteer_phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup Volunteers */}
      {backupVolunteers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Backup Options</CardTitle>
            <CardDescription>
              If the primary volunteer is not available, here are some alternatives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {backupVolunteers.map((volunteer, index) => (
                <div key={volunteer.volunteer_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{volunteer.volunteer_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {volunteer.distance_km}km away • Rating: {volunteer.reliability_score}/5.0
                    </p>
                  </div>
                  <Badge variant="outline">
                    Option {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};