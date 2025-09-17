# InscribeMate Setup Guide

## 🚀 Features Implemented

### ✅ Authentication & User Management
- **Supabase Integration**: Complete user authentication system
- **Sign-in/Sign-up Forms**: Accessible forms with TTS support
- **User Roles**: Support for blind users, volunteers, and admins
- **Profile Management**: User data with location and preferences

### ✅ Smart Matching System
- **Geolocation API**: Browser-based location detection
- **AI-Powered Matching**: Gemini AI for intelligent volunteer matching
- **Distance Calculation**: Haversine formula for accurate distance calculation
- **Match Scoring**: Multi-factor scoring system (location, availability, languages, etc.)

### ✅ Live Session Management
- **Real-time Sessions**: Live session tracking and management
- **Session Controls**: Start, pause, resume, and end session functionality
- **Timer & Progress**: Real-time session timer and progress tracking
- **Notes System**: Session notes and feedback collection

### ✅ AI Assistant (INSEE)
- **Gemini AI Integration**: Intelligent AI responses
- **Voice Input/Output**: Speech recognition and text-to-speech
- **Context Awareness**: User role and location-aware responses
- **Floating UI**: Lower-right corner circular assistant

### ✅ Text-to-Speech (TTS)
- **Universal TTS**: Every UI element has TTS support
- **Voice Controls**: Play, pause, resume, and stop functionality
- **Accessibility**: Screen reader integration and voice navigation
- **Customizable**: Rate, pitch, and volume controls

## 🔧 Environment Setup

### 1. Create Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key

# Database Configuration (if using local database)
DATABASE_URL=your_database_connection_string
```

### 2. Supabase Setup

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

2. **Set up Database Tables**:
   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     email VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255) NOT NULL,
     role VARCHAR(50) NOT NULL,
     phone_number VARCHAR(20),
     location JSONB,
     languages TEXT[] DEFAULT '{}',
     availability JSONB,
     reliability_score DECIMAL(3,2) DEFAULT 5.00,
     preferences JSONB,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Scribe requests table
   CREATE TABLE scribe_requests (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     title VARCHAR(255) NOT NULL,
     description TEXT,
     exam_type VARCHAR(100),
     subject VARCHAR(100),
     scheduled_date TIMESTAMP NOT NULL,
     duration INTEGER NOT NULL,
     location JSONB NOT NULL,
     urgency VARCHAR(20) DEFAULT 'normal',
     status VARCHAR(20) DEFAULT 'pending',
     special_requirements TEXT,
     estimated_difficulty INTEGER DEFAULT 3,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Scribe sessions table
   CREATE TABLE scribe_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     request_id UUID REFERENCES scribe_requests(id),
     user_id UUID REFERENCES users(id),
     volunteer_id UUID REFERENCES users(id),
     status VARCHAR(20) DEFAULT 'scheduled',
     start_time TIMESTAMP,
     end_time TIMESTAMP,
     actual_duration INTEGER,
     notes TEXT,
     user_rating INTEGER,
     volunteer_rating INTEGER,
     user_feedback TEXT,
     volunteer_feedback TEXT,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Volunteer applications table
   CREATE TABLE volunteer_applications (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     request_id UUID REFERENCES scribe_requests(id),
     volunteer_id UUID REFERENCES users(id),
     message TEXT,
     status VARCHAR(20) DEFAULT 'pending',
     match_score DECIMAL(5,2),
     applied_at TIMESTAMP DEFAULT NOW()
   );

   -- Chat history table
   CREATE TABLE chat_history (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     session_id UUID,
     message TEXT NOT NULL,
     response TEXT NOT NULL,
     context JSONB,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

3. **Enable Row Level Security (RLS)**:
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE scribe_requests ENABLE ROW LEVEL SECURITY;
   ALTER TABLE scribe_sessions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
   ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
   ```

### 3. Gemini AI Setup

1. **Get Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com)
   - Create a new API key
   - Add it to your environment variables

2. **API Key Configuration**:
   - The app will work with mock responses if no API key is provided
   - For production, ensure you have a valid Gemini API key

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## 🎯 Key Features Usage

### Authentication
- **Sign Up**: Create account with role selection (Student/Volunteer/Admin)
- **Sign In**: Email/password authentication
- **Location Detection**: Automatic location detection during signup
- **TTS Support**: All forms have voice guidance

### Smart Matching
- **Location-Based**: Uses browser geolocation for proximity matching
- **AI Scoring**: Gemini AI calculates match scores based on multiple factors
- **Real-time Results**: Instant matching results with explanations
- **Voice Feedback**: TTS announces match results and scores

### Live Sessions
- **Session Management**: Start, pause, resume, and end sessions
- **Real-time Timer**: Live session duration tracking
- **Progress Tracking**: Visual and audio progress indicators
- **Notes System**: Session notes and feedback collection

### AI Assistant (INSEE)
- **Voice Interaction**: Speak to the assistant using voice input
- **Context Awareness**: Understands user role and current page
- **Smart Responses**: AI-powered responses based on context
- **Floating UI**: Always accessible in lower-right corner

### Text-to-Speech
- **Universal Coverage**: Every UI element has TTS support
- **Voice Controls**: Play, pause, resume, and stop speech
- **Accessibility**: Screen reader integration
- **Customizable**: Adjustable rate, pitch, and volume

## 🔧 Configuration Options

### TTS Configuration
```typescript
// In lib/tts.ts
const tts = TTSService.getInstance();
tts.setEnabled(true); // Enable/disable TTS
tts.speak("Hello", { rate: 0.9, pitch: 1.0, volume: 0.8 });
```

### Geolocation Configuration
```typescript
// In lib/geolocation.ts
const geolocation = GeolocationService.getInstance();
const location = await geolocation.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000
});
```

### Gemini AI Configuration
```typescript
// In lib/gemini.ts
const gemini = GeminiService.getInstance();
const response = await gemini.generateResponse(message, {
  userRole: 'blind_user',
  currentPage: '/dashboard',
  userLocation: { lat: 0, lng: 0, address: 'Location' }
});
```

## 🚨 Important Notes

1. **HTTPS Required**: Geolocation and Speech APIs require HTTPS in production
2. **Browser Permissions**: Users need to grant location and microphone permissions
3. **API Keys**: Ensure all API keys are properly configured
4. **Database**: Set up proper RLS policies for security
5. **TTS**: Works best with modern browsers that support Web Speech API

## 🐛 Troubleshooting

### Common Issues

1. **Geolocation Not Working**:
   - Ensure HTTPS is enabled
   - Check browser permissions
   - Verify location services are enabled

2. **TTS Not Working**:
   - Check browser support for Web Speech API
   - Ensure audio permissions are granted
   - Try different browsers

3. **Authentication Issues**:
   - Verify Supabase configuration
   - Check environment variables
   - Ensure RLS policies are correct

4. **AI Responses Not Working**:
   - Check Gemini API key
   - Verify API quota and limits
   - Check network connectivity

## 📱 Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14.5+)
- **Edge**: Full support

## 🔒 Security Considerations

1. **Environment Variables**: Never commit API keys to version control
2. **RLS Policies**: Implement proper row-level security
3. **Input Validation**: All inputs are validated using Zod schemas
4. **HTTPS**: Required for production deployment
5. **Permissions**: Minimal required permissions for geolocation and microphone

## 📈 Performance Optimization

1. **Lazy Loading**: Components are loaded on demand
2. **Caching**: Location and user data are cached
3. **Debouncing**: TTS and voice input are debounced
4. **Error Handling**: Comprehensive error handling and fallbacks
5. **Accessibility**: Optimized for screen readers and assistive technologies

## 🎉 Ready to Use!

Your InscribeMate application is now fully configured with:
- ✅ Supabase authentication
- ✅ Smart geolocation matching
- ✅ Live session management
- ✅ Gemini AI integration
- ✅ Universal TTS support
- ✅ Accessibility-first design

Start the application and begin helping students with their accessibility needs!
