import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TTSTest from '../client/src/components/TTSTest';
import * as ttsModule from '../client/src/lib/tts';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock the useTTS hook
jest.mock('../client/src/lib/tts', () => ({
  useTTS: jest.fn().mockReturnValue({
    speak: jest.fn(),
    stop: jest.fn(),
    isSpeaking: jest.fn().mockReturnValue(false),
    getVoices: jest.fn().mockReturnValue([]),
    isSupported: jest.fn().mockReturnValue(true),
  }),
}));

describe('TTSTest Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component correctly', () => {
    render(<TTSTest />);
    
    expect(screen.getByText('Text-to-Speech Test')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text to speak...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /speak/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
  });

  test('calls speak function when Speak button is clicked', () => {
    const mockSpeak = jest.fn();
    (ttsModule.useTTS as jest.Mock).mockReturnValue({
      speak: mockSpeak,
      stop: jest.fn(),
      isSpeaking: jest.fn().mockReturnValue(false),
      getVoices: jest.fn().mockReturnValue([]),
      isSupported: jest.fn().mockReturnValue(true),
    });

    render(<TTSTest />);
    
    const input = screen.getByPlaceholderText('Enter text to speak...');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    
    const speakButton = screen.getByRole('button', { name: /speak/i });
    fireEvent.click(speakButton);
    
    expect(mockSpeak).toHaveBeenCalledWith('Hello world');
  });

  test('calls stop function when Stop button is clicked', () => {
    const mockStop = jest.fn();
    (ttsModule.useTTS as jest.Mock).mockReturnValue({
      speak: jest.fn(),
      stop: mockStop,
      isSpeaking: jest.fn().mockReturnValue(true),
      getVoices: jest.fn().mockReturnValue([]),
      isSupported: jest.fn().mockReturnValue(true),
    });

    render(<TTSTest />);
    
    const stopButton = screen.getByRole('button', { name: /stop/i });
    fireEvent.click(stopButton);
    
    expect(mockStop).toHaveBeenCalled();
  });

  test('displays not supported message when TTS is not supported', () => {
    (ttsModule.useTTS as jest.Mock).mockReturnValue({
      speak: jest.fn(),
      stop: jest.fn(),
      isSpeaking: jest.fn().mockReturnValue(false),
      getVoices: jest.fn().mockReturnValue([]),
      isSupported: jest.fn().mockReturnValue(false),
    });

    render(<TTSTest />);
    
    expect(screen.getByText('Text-to-speech is not supported in this browser.')).toBeInTheDocument();
  });
});