import { TTSService } from '../client/src/lib/tts';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock the SpeechSynthesis API
const mockSpeak = jest.fn();
const mockCancel = jest.fn();
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockGetVoices = jest.fn().mockReturnValue([]);

Object.defineProperty(global, 'speechSynthesis', {
  value: {
    speak: mockSpeak,
    cancel: mockCancel,
    pause: mockPause,
    resume: mockResume,
    getVoices: mockGetVoices,
    speaking: false,
    paused: false,
  },
  writable: true,
});

Object.defineProperty(global, 'SpeechSynthesisUtterance', {
  value: jest.fn().mockImplementation((text) => ({
    text,
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1,
    lang: 'en-US',
    onend: null,
    onerror: null,
    onstart: null,
  })),
  writable: true,
});

describe('TTSService', () => {
  let ttsService: TTSService;

  beforeEach(() => {
    ttsService = new TTSService();
    jest.clearAllMocks();
    Object.defineProperty(global.speechSynthesis, 'speaking', { value: false });
    Object.defineProperty(global.speechSynthesis, 'paused', { value: false });
  });

  test('speak should create an utterance and call speechSynthesis.speak', () => {
    ttsService.speak('Hello world');
    expect(mockSpeak).toHaveBeenCalled();
  });

  test('stop should call speechSynthesis.cancel', () => {
    ttsService.stop();
    expect(mockCancel).toHaveBeenCalled();
  });

  test('pause should call speechSynthesis.pause', () => {
    ttsService.pause();
    expect(mockPause).toHaveBeenCalled();
  });

  test('resume should call speechSynthesis.resume', () => {
    ttsService.resume();
    expect(mockResume).toHaveBeenCalled();
  });

  test('isSpeaking should return the speaking state from speechSynthesis', () => {
    Object.defineProperty(global.speechSynthesis, 'speaking', { value: true });
    expect(ttsService.isSpeaking()).toBe(true);

    Object.defineProperty(global.speechSynthesis, 'speaking', { value: false });
    expect(ttsService.isSpeaking()).toBe(false);
  });

  test('isPaused should return the paused state from speechSynthesis', () => {
    Object.defineProperty(global.speechSynthesis, 'paused', { value: true });
    expect(ttsService.isPaused()).toBe(true);

    Object.defineProperty(global.speechSynthesis, 'paused', { value: false });
    expect(ttsService.isPaused()).toBe(false);
  });

  test('getVoice should return the current voice', () => {
    const mockVoice = { name: 'Test Voice' };
    ttsService.voice = mockVoice as SpeechSynthesisVoice;
    expect(ttsService.getVoice()).toBe(mockVoice);
  });
});