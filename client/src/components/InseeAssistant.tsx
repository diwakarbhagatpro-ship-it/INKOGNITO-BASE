import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useGemini } from '@/lib/gemini';
import { useTTS } from '@/lib/tts';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/lib/geolocation';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

export function InseeAssistant() {
  const { generateResponse } = useGemini();
  const { speak, stop, isSpeaking, isPaused, pause, resume } = useTTS();
  const { user } = useAuth();
  const { getCachedLocation } = useGeolocation();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m INSEE, your AI assistant. I can help you navigate the platform, find scribes, or answer questions about accessibility features. How can I assist you today?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get user context
      const userLocation = getCachedLocation();
      const context = {
        userRole: user?.user_metadata?.role || 'blind_user',
        currentPage: window.location.pathname,
        userLocation: userLocation ? {
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: userLocation.address,
        } : undefined,
      };

      // Generate AI response
      const response = await generateResponse(inputValue, context);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Speak the response
      speak(response);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I encountered an error processing your request. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      speak('I apologize, but I encountered an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      speak('Voice input is not supported by your browser');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      speak('Voice input stopped');
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        speak('Listening...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        speak(`You said: ${transcript}`);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        speak('Voice input error. Please try again.');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const toggleTextToSpeech = () => {
    if (isSpeaking()) {
      if (isPaused()) {
        resume();
        speak('Resuming speech');
      } else {
        pause();
        speak('Speech paused');
      }
    } else {
      // Speak the last AI message
      const lastAiMessage = messages.filter(m => !m.isUser).pop();
      if (lastAiMessage) {
        speak(lastAiMessage.text);
      } else {
        speak('No AI message to read');
      }
    }
  };

  if (!isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 rounded-full h-14 w-14 bg-primary hover:bg-primary/90"
        size="icon"
        aria-label="Open INSEE AI Assistant"
        data-testid="button-insee-open"
      >
        <Logo size={24} showText={false} />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 shadow-lg border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Logo size={16} showText={false} className="text-primary" />
            INSEE AI Assistant
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            aria-label="Close INSEE Assistant"
            data-testid="button-insee-close"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-full">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-3 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.isUser ? 'user' : 'ai'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask INSEE anything..."
              className="flex-1"
              aria-label="Message input"
              data-testid="input-insee-message"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoiceInput}
              className={isListening ? 'text-red-500' : 'text-muted-foreground'}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              data-testid="button-voice-input"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTextToSpeech}
              className={isSpeaking() ? 'text-primary' : 'text-muted-foreground'}
              aria-label={isSpeaking() ? (isPaused() ? 'Resume speaking' : 'Pause speaking') : 'Read aloud'}
              data-testid="button-tts"
            >
              {isSpeaking() ? (isPaused() ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />) : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              aria-label="Send message"
              data-testid="button-send-message"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}