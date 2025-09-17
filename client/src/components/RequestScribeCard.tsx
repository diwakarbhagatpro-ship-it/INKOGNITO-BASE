import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Clock, MapPin, UserCheck, Zap } from 'lucide-react';

export function RequestScribeCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    examTitle: '',
    examDate: '',
    examTime: '',
    duration: '',
    location: '',
    specialRequirements: '',
    urgency: 'normal',
  });

  const handleSubmit = () => {
    setIsLoading(true);
    console.log('Scribe request submitted:', formData);
    
    // TODO: Implement actual API call to create request
    setTimeout(() => {
      setIsLoading(false);
      alert('Scribe request submitted successfully! We\'re finding volunteers for you.');
    }, 2000);
  };

  const handleQuickRequest = () => {
    console.log('Quick emergency request initiated');
    // TODO: Implement immediate matching logic
    alert('Emergency request initiated! Searching for available scribes now.');
  };

  const isFormValid = formData.examTitle && formData.examDate && formData.examTime && formData.location;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Emergency Request */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Zap className="h-5 w-5" />
            Emergency Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Need immediate assistance? Click below for instant scribe matching.
          </p>
          <Button 
            onClick={handleQuickRequest}
            variant="destructive"
            className="w-full"
            size="lg"
            data-testid="button-emergency-request"
          >
            <Zap className="h-4 w-4 mr-2" />
            Request Emergency Scribe
          </Button>
        </CardContent>
      </Card>

      {/* Scheduled Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Schedule Scribe Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="examTitle">Exam/Event Title *</Label>
              <Input
                id="examTitle"
                value={formData.examTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, examTitle: e.target.value }))}
                placeholder="e.g., Mathematics Final Exam"
                data-testid="input-exam-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}>
                <SelectTrigger data-testid="select-urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="examDate" className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Date *
              </Label>
              <Input
                id="examDate"
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData(prev => ({ ...prev, examDate: e.target.value }))}
                data-testid="input-exam-date"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="examTime" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Start Time *
              </Label>
              <Input
                id="examTime"
                type="time"
                value={formData.examTime}
                onChange={(e) => setFormData(prev => ({ ...prev, examTime: e.target.value }))}
                data-testid="input-exam-time"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="8"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="3"
                data-testid="input-duration"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Location *
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., University Campus, Room 301"
              data-testid="input-location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequirements">Special Requirements</Label>
            <Textarea
              id="specialRequirements"
              value={formData.specialRequirements}
              onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
              placeholder="Any specific needs, accessibility requirements, or subject expertise needed..."
              rows={3}
              data-testid="textarea-requirements"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className="w-full"
            size="lg"
            data-testid="button-submit-request"
          >
            {isLoading ? 'Finding Scribes...' : 'Submit Request'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}