import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useTTS } from '@/lib/tts';
import { useGeolocation } from '@/lib/geolocation';

export const SignUpForm: React.FC = () => {
  const { signUp, loading } = useAuth();
  const { speak, speakError, speakSuccess } = useTTS();
  const { getCurrentPosition, isSupported } = useGeolocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'blind_user' as 'blind_user' | 'volunteer' | 'admin',
    phoneNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value as any }));
    speak(`Role selected: ${value.replace('_', ' ')}`);
  };

  const handleGetLocation = async () => {
    if (!isSupported()) {
      speakError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    try {
      const locationData = await getCurrentPosition();
      setLocation({
        lat: locationData.lat,
        lng: locationData.lng,
        address: locationData.address,
      });
      speakSuccess(`Location detected: ${locationData.address}`);
    } catch (error) {
      speakError('Failed to get location. You can add it later.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      speakError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      speakError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    try {
      const userData = {
        name: formData.name,
        role: formData.role,
        phoneNumber: formData.phoneNumber || undefined,
        location: location || undefined,
        languages: formData.role === 'volunteer' ? ['English'] : undefined,
        preferences: {
          ttsEnabled: true,
          highContrast: false,
          fontSize: 'medium',
        },
      };

      const { error } = await signUp(formData.email, formData.password, userData);
      
      if (error) {
        setError(error.message);
        speakError(error.message);
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      speakError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const label = e.target.getAttribute('aria-label') || e.target.placeholder;
    if (label) {
      speak(`Enter your ${label.toLowerCase()}`);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    speak(showPassword ? 'Hide password' : 'Show password');
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
    speak(showConfirmPassword ? 'Hide confirm password' : 'Show confirm password');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join InscribeMate</CardTitle>
          <CardDescription>
            Create your account to access the accessibility-first scribe platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder="Enter your full name"
                required
                aria-label="Full name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder="Enter your email"
                required
                aria-label="Email address"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blind_user">Student (Blind/Visually Impaired)</SelectItem>
                  <SelectItem value="volunteer">Volunteer Scribe</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder="Enter your phone number"
                aria-label="Phone number"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Location (Optional)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                  className="flex-1"
                >
                  {locationLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {location ? 'Update Location' : 'Get My Location'}
                </Button>
              </div>
              {location && (
                <p className="text-sm text-muted-foreground">
                  Location: {location.address}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  placeholder="Create a password"
                  required
                  aria-label="Password"
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  placeholder="Confirm your password"
                  required
                  aria-label="Confirm password"
                  className="w-full pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !formData.name || !formData.email || !formData.password || !formData.confirmPassword}
              onFocus={() => speak('Create account button')}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button
                variant="ghost"
                className="p-0 h-auto font-normal"
                onClick={() => speak('Sign in link. Press Enter to sign in to your existing account.')}
              >
                Sign in here
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
