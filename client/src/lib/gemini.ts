import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini AI service for INSEE assistant
export class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private initialize() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini API key not found. INSEE assistant will use mock responses.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
    }
  }

  public async generateResponse(
    message: string,
    context?: {
      userRole?: 'blind_user' | 'volunteer' | 'admin';
      sessionId?: string;
      currentPage?: string;
      userLocation?: { lat: number; lng: number; address: string };
      scribeRequest?: any;
    }
  ): Promise<string> {
    if (!this.model) {
      return this.getMockResponse(message, context);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini AI error:', error);
      return this.getMockResponse(message, context);
    }
  }

  private buildSystemPrompt(context?: any): string {
    const basePrompt = `You are INSEE, an AI assistant for InscribeMate, an accessibility-first scribe platform. 
Your role is to help users with:

1. Navigation and platform guidance
2. Scribe request assistance
3. Accessibility feature explanations
4. General support for blind/visually impaired users
5. Volunteer coordination and matching
6. Live session support

Key guidelines:
- Always be helpful, patient, and understanding
- Use clear, concise language
- Provide step-by-step instructions when needed
- Be encouraging and supportive
- Focus on accessibility and inclusion
- If you don't know something, say so and offer to help find the answer`;

    if (context?.userRole) {
      const roleSpecificGuidance = this.getRoleSpecificGuidance(context.userRole);
      return `${basePrompt}\n\n${roleSpecificGuidance}`;
    }

    return basePrompt;
  }

  private getRoleSpecificGuidance(userRole: string): string {
    switch (userRole) {
      case 'blind_user':
        return `Current user is a blind/visually impaired student. Focus on:
- Helping them navigate the platform
- Explaining how to request scribes
- Describing UI elements and their functions
- Providing audio-friendly instructions
- Helping with exam and academic assistance requests`;

      case 'volunteer':
        return `Current user is a volunteer. Focus on:
- Helping them find available scribe requests
- Explaining how to apply for requests
- Providing guidance on volunteer responsibilities
- Helping with session management
- Explaining the matching process`;

      case 'admin':
        return `Current user is an admin. Focus on:
- Platform management and oversight
- User management and support
- Analytics and reporting
- System configuration
- Troubleshooting and support`;

      default:
        return 'Provide general assistance for the InscribeMate platform.';
    }
  }

  private getMockResponse(message: string, context?: any): string {
    const responses = [
      `I understand you said: "${message}". This is a mock response while Gemini AI is being configured. I'm here to help with InscribeMate platform navigation, scribe requests, and accessibility features.`,
      `Thank you for your message: "${message}". As your AI assistant, I can help you navigate the platform, request scribes, or answer questions about accessibility features.`,
      `I received your message: "${message}". I'm designed to assist with InscribeMate's features including smart matching, live sessions, and accessibility support.`,
    ];

    // Add context-specific responses
    if (context?.userRole === 'blind_user') {
      return `I understand you need help as a student. "${message}" - I can assist you with requesting scribes, navigating the platform, or explaining accessibility features.`;
    }

    if (context?.userRole === 'volunteer') {
      return `I see you're a volunteer. "${message}" - I can help you find available requests, understand the matching process, or manage your sessions.`;
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Generate smart matching suggestions
  public async generateMatchingSuggestions(
    request: any,
    availableVolunteers: any[]
  ): Promise<Array<{ volunteer: any; reason: string; score: number }>> {
    if (!this.model) {
      return this.getMockMatchingSuggestions(request, availableVolunteers);
    }

    try {
      const prompt = `Analyze this scribe request and available volunteers to suggest the best matches:

Request: ${JSON.stringify(request, null, 2)}
Available Volunteers: ${JSON.stringify(availableVolunteers, null, 2)}

Provide 3-5 matching suggestions with reasons and scores (1-10). Consider:
- Location proximity
- Language compatibility
- Availability
- Experience level
- Special requirements

Format as JSON array with volunteer, reason, and score fields.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      try {
        return JSON.parse(response.text());
      } catch {
        return this.getMockMatchingSuggestions(request, availableVolunteers);
      }
    } catch (error) {
      console.error('Gemini matching error:', error);
      return this.getMockMatchingSuggestions(request, availableVolunteers);
    }
  }

  private getMockMatchingSuggestions(request: any, volunteers: any[]): Array<{ volunteer: any; reason: string; score: number }> {
    return volunteers.slice(0, 3).map((volunteer, index) => ({
      volunteer,
      reason: `Good match based on location and availability (Mock suggestion ${index + 1})`,
      score: 8 - index,
    }));
  }

  // Generate accessibility tips
  public async generateAccessibilityTips(userRole: string): Promise<string[]> {
    if (!this.model) {
      return this.getMockAccessibilityTips(userRole);
    }

    try {
      const prompt = `Generate 5 helpful accessibility tips for a ${userRole} using InscribeMate platform. Focus on practical, actionable advice.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().split('\n').filter(tip => tip.trim().length > 0);
    } catch (error) {
      console.error('Gemini tips error:', error);
      return this.getMockAccessibilityTips(userRole);
    }
  }

  private getMockAccessibilityTips(userRole: string): string[] {
    const tips = {
      blind_user: [
        'Use screen reader shortcuts to navigate quickly',
        'Enable high contrast mode for better visibility',
        'Use keyboard navigation for efficient browsing',
        'Enable text-to-speech for all content',
        'Bookmark frequently used features'
      ],
      volunteer: [
        'Keep your availability updated for better matching',
        'Use clear, descriptive language in applications',
        'Enable notifications for new requests',
        'Review user requirements carefully before applying',
        'Maintain good communication during sessions'
      ],
      admin: [
        'Monitor system performance regularly',
        'Review user feedback for improvements',
        'Keep accessibility features updated',
        'Ensure proper volunteer training',
        'Maintain data privacy and security'
      ]
    };

    return tips[userRole as keyof typeof tips] || tips.blind_user;
  }
}

// Export singleton instance
export const gemini = GeminiService.getInstance();

// React hook for Gemini AI
export const useGemini = () => {
  return {
    generateResponse: (message: string, context?: any) => gemini.generateResponse(message, context),
    generateMatchingSuggestions: (request: any, volunteers: any[]) => 
      gemini.generateMatchingSuggestions(request, volunteers),
    generateAccessibilityTips: (userRole: string) => gemini.generateAccessibilityTips(userRole),
  };
};
