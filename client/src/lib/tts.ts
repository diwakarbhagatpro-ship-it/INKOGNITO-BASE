// Text-to-Speech utility service
// Note: This file no longer uses react-speech-kit due to dependency conflicts.
// It relies on the browser's built-in SpeechSynthesis API.

export class TTSService {
  private static instance: TTSService;
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isEnabled: boolean = true;
  private voice: SpeechSynthesisVoice | null = null;

  private constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    
    // Reload voices when they become available
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  private loadVoices() {
    const voices = this.synth.getVoices();
    // Prefer English voices, fallback to first available
    this.voice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Female')
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
  }

  public speak(text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    interrupt?: boolean;
  }) {
    if (!this.isEnabled || !text.trim()) return;

    // Stop current speech if interrupting
    if (options?.interrupt !== false) {
      this.stop();
    }

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    
    if (this.voice) {
      this.currentUtterance.voice = this.voice;
    }
    
    this.currentUtterance.rate = options?.rate || 0.9;
    this.currentUtterance.pitch = options?.pitch || 1;
    this.currentUtterance.volume = options?.volume || 0.8;

    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
    };

    this.currentUtterance.onerror = (event) => {
      console.error('TTS Error:', event.error);
      this.currentUtterance = null;
    };

    this.synth.speak(this.currentUtterance);
  }

  public stop() {
    if (this.currentUtterance) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public pause() {
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  public isSpeaking(): boolean {
    return this.synth.speaking;
  }

  public isPaused(): boolean {
    return this.synth.paused;
  }

  public getVoice(): SpeechSynthesisVoice | null {
    return this.voice;
  }

  // Utility method to speak UI elements
  public speakElement(element: HTMLElement, customText?: string) {
    const text = customText || this.extractTextFromElement(element);
    if (text) {
      this.speak(text);
    }
  }

  private extractTextFromElement(element: HTMLElement): string {
    // Get accessible text from element
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const ariaDescription = element.getAttribute('aria-describedby');
    if (ariaDescription) {
      const descElement = document.getElementById(ariaDescription);
      if (descElement) return descElement.textContent || '';
    }

    // Fallback to text content
    return element.textContent?.trim() || '';
  }

  // Speak form validation errors
  public speakError(errorMessage: string) {
    this.speak(`Error: ${errorMessage}`, { rate: 0.8, pitch: 0.9 });
  }

  // Speak success messages
  public speakSuccess(message: string) {
    this.speak(`Success: ${message}`, { rate: 1.0, pitch: 1.1 });
  }

  // Speak navigation changes
  public speakNavigation(pageName: string) {
    this.speak(`Navigated to ${pageName}`, { rate: 0.9 });
  }
}

// Export singleton instance
export const tts = TTSService.getInstance();

// React hook for TTS
export const useTTS = () => {
  // Note: We use the native Web Speech API for speech-to-text functionality.
  // This hook will now primarily wrap our custom TTSService.
  // For actual speech synthesis, we will continue to use the browser's built-in SpeechSynthesis API.
  
  return {
    speak: (text: string, options?: Parameters<typeof tts.speak>[1]) => {
      tts.speak(text, options);
    },
    stop: () => tts.stop(),
    pause: () => tts.pause(),
    resume: () => tts.resume(),
    setEnabled: (enabled: boolean) => tts.setEnabled(enabled),
    isSpeaking: () => tts.isSpeaking(),
    isPaused: () => tts.isPaused(),
    speakElement: (element: HTMLElement, customText?: string) => tts.speakElement(element, customText),
    speakError: (errorMessage: string) => tts.speakError(errorMessage),
    speakSuccess: (message: string) => tts.speakSuccess(message),
    speakNavigation: (pageName: string) => tts.speakNavigation(pageName),
    getVoices: () => {
      // This function will now return voices from our TTSService
      const synth = window.speechSynthesis;
      return synth.getVoices();
    },
    isSupported: () => 'speechSynthesis' in window,
  };
};
