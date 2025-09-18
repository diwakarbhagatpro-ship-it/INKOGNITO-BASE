import React from 'react';
import { useTTS } from '../lib/tts';

export function TTSTest() {
  const tts = useTTS();
  const [text, setText] = React.useState('Hello, this is a test of the text-to-speech functionality.');
  
  return (
    <div className="p-4 border rounded-md shadow-sm">
      <h2 className="text-xl font-bold mb-4">TTS Test Component</h2>
      
      <div className="mb-4">
        <textarea 
          className="w-full p-2 border rounded" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="flex space-x-2">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => tts.speak(text)}
          disabled={tts.isSpeaking()}
        >
          Speak
        </button>
        
        <button 
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={() => tts.stop()}
          disabled={!tts.isSpeaking()}
        >
          Stop
        </button>
        
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={() => tts.speakSuccess('This is a success message')}
        >
          Success
        </button>
        
        <button 
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          onClick={() => tts.speakError('This is an error message')}
        >
          Error
        </button>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          {tts.isSupported() ? 'TTS is supported in your browser' : 'TTS is not supported in your browser'}
        </p>
        <p className="text-sm text-gray-500">
          {tts.isSpeaking() ? 'Speaking...' : 'Not speaking'}
        </p>
      </div>
    </div>
  );
}