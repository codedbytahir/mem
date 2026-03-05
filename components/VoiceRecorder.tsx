'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscriptComplete, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (transcript) {
        onTranscriptComplete(transcript);
      }
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  if (!recognitionRef.current && typeof window !== 'undefined') {
    return <p className="text-sm text-red-500">Speech recognition is not supported in this browser.</p>;
  }

  return (
    <div className="flex flex-col items-center space-y-4 rounded-lg border border-navy/10 bg-cream/50 p-6">
      <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
        isRecording ? 'animate-pulse bg-red-100 text-red-600 shadow-lg' : 'bg-navy/5 text-navy'
      }`}>
        <Mic className={`h-8 w-8 ${isRecording ? 'scale-110' : ''}`} />
      </div>

      <div className="text-center">
        <h3 className="font-serif text-lg font-medium text-navy">
          {isRecording ? 'Recording your story...' : 'Record your story'}
        </h3>
        <p className="text-xs text-charcoal-light">
          {isRecording ? 'Speak clearly into your microphone' : 'Click the button to start recording your answer'}
        </p>
      </div>

      <div className="flex space-x-2">
        <Button
          variant={isRecording ? 'primary' : 'outline'}
          onClick={toggleRecording}
          disabled={disabled}
        >
          {isRecording ? (
            <>
              <Square className="mr-2 h-4 w-4 fill-white" /> Stop Recording
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" /> Start Recording
            </>
          )}
        </Button>
        {transcript && !isRecording && (
          <Button variant="ghost" size="sm" onClick={() => setTranscript('')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {transcript && (
        <div className="mt-4 w-full rounded-md bg-white p-3 text-sm text-charcoal shadow-inner">
          <p className="line-clamp-3 italic opacity-70">&quot;{transcript}&quot;</p>
        </div>
      )}
    </div>
  );
};
