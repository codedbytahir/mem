'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WaveformAnimation } from '@/components/WaveformAnimation';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Trash2, Send, Save, BookOpen, User, Bot, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InterviewPage() {
  const router = useRouter();
  const { sessionId, images, transcript, addTranscriptLine, status, setStatus } = useStore();
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    // Start interview automatically
    if (chatHistory.length === 0) {
      getNextQuestion();
    }
  }, [sessionId, router, chatHistory.length, getNextQuestion]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isAiThinking]);

  const playTTS = async (text: string) => {
    try {
      const response = await fetch('/api/interview/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (response.ok) {
        const { audio } = await response.json();
        // Browser-safe base64 to Uint8Array
        const binaryString = window.atob(audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audioPlayer = new Audio(url);
        audioPlayer.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
    }
  };

  const getNextQuestion = useCallback(async (updatedTranscript?: string[]) => {
    setIsAiThinking(true);
    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: updatedTranscript || transcript,
          images,
          currentImageIndex
        }),
      });
      const data = await response.json();
      setAiQuestion(data.question);
      setChatHistory(prev => [...prev, { role: 'ai', text: data.question }]);
      playTTS(data.question);
    } catch (err) {
      console.error('Error getting next question:', err);
    } finally {
      setIsAiThinking(false);
    }
  }, [transcript, images, currentImageIndex]);

  const handleSubmitAnswer = async () => {
    const answer = currentAnswer.trim();
    if (answer) {
      const updatedTranscript = [...transcript, answer];
      addTranscriptLine(answer);
      setChatHistory(prev => [...prev, { role: 'user', text: answer }]);
      setCurrentAnswer('');

      // Get next question based on updated transcript
      getNextQuestion(updatedTranscript);

      // Cycle through images occasionally or based on AI logic (simplified here)
      if (updatedTranscript.length % 2 === 0) {
        setCurrentImageIndex((prev) => (prev + 1) % (images.length || 1));
      }
    }
  };

  const handleFinishStory = async () => {
    if (transcript.length === 0 && !currentAnswer) {
      alert('Please tell us a bit of your story before finishing.');
      return;
    }

    const fullTranscript = [...transcript, currentAnswer].filter(Boolean).join(' ');
    if (fullTranscript.length < 50) {
      alert('Your story is a bit short. Tell us a little more to create a beautiful biography!');
      return;
    }

    setIsFinishing(true);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, transcript: fullTranscript }),
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      setStatus('processing');
      router.push('/loading');
    } catch (err) {
      console.error('Processing error:', err);
      alert('There was an error processing your story. Please try again.');
      setIsFinishing(false);
    }
  };

  if (!sessionId) return null;

  return (
    <main className="min-h-screen bg-cream py-8 px-4 md:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between border-b border-navy/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-navy p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-cream" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-navy">Memento Biographer</h1>
              <p className="text-xs text-charcoal-light">Preserving your legacy, one memory at a time.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-navy/60 hover:text-navy">
            End Session
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Photo & Controls */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="overflow-hidden p-0 border-2 border-navy/5 shadow-xl rounded-2xl">
              <div className="relative aspect-[4/3] bg-navy/5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="h-full w-full relative"
                  >
                    <Image
                      src={images[currentImageIndex] || '/api/placeholder/400/300'}
                      alt="Current Memory"
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                   <span className="bg-copper/90 text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded">
                     Memory Focus
                   </span>
                </div>
              </div>
            </Card>

            <VoiceRecorder
              onTranscriptComplete={(text) => setCurrentAnswer(text)}
              disabled={isFinishing || isAiThinking}
            />
          </div>

          {/* Right Column: Chat Interface */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="flex flex-col h-[550px] border-2 border-navy/5 shadow-xl bg-white rounded-2xl overflow-hidden">
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('/api/placeholder/400/400')] bg-opacity-5"
              >
                {chatHistory.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`flex max-w-[85%] space-x-3 ${msg.role === 'ai' ? '' : 'flex-row-reverse space-x-reverse'}`}>
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        msg.role === 'ai' ? 'bg-navy text-cream' : 'bg-copper text-white'
                      }`}>
                        {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                      </div>
                      <div className={`p-4 rounded-2xl shadow-sm text-sm ${
                        msg.role === 'ai'
                          ? 'bg-cream text-navy rounded-tl-none border border-navy/5'
                          : 'bg-navy text-white rounded-tr-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isAiThinking && (
                  <div className="flex justify-start">
                    <div className="flex space-x-3 items-center">
                      <div className="h-8 w-8 rounded-full bg-navy text-cream flex items-center justify-center">
                        <Bot size={16} />
                      </div>
                      <div className="bg-cream p-4 rounded-2xl rounded-tl-none border border-navy/5 flex space-x-2">
                        <span className="w-2 h-2 bg-navy/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-navy/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-navy/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-navy/5 bg-cream/30">
                <div className="relative">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Describe this memory..."
                    className="w-full rounded-xl border border-navy/10 bg-white p-4 pr-14 text-sm focus:ring-2 focus:ring-navy outline-none resize-none h-28 shadow-inner"
                    disabled={isFinishing || isAiThinking}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitAnswer();
                      }
                    }}
                  />
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!currentAnswer.trim() || isFinishing || isAiThinking}
                    className="absolute bottom-4 right-4 rounded-lg bg-navy p-3 text-white hover:bg-navy-light disabled:bg-navy/20 transition-all shadow-md"
                  >
                    {isAiThinking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-2 flex justify-between items-center px-1">
                  <p className="text-[10px] text-charcoal-light">Press Enter to send</p>
                  <button
                    onClick={handleFinishStory}
                    disabled={transcript.length < 2 || isFinishing}
                    className="text-[10px] font-bold text-copper hover:underline disabled:opacity-30"
                  >
                    Ready to compile biography?
                  </button>
                </div>
              </div>
            </Card>

            <div className="flex flex-col space-y-3">
              <Button
                variant="secondary"
                className="w-full text-lg font-bold h-14 shadow-xl rounded-xl hover:scale-[1.02] transition-transform"
                onClick={handleFinishStory}
                isLoading={isFinishing}
                disabled={transcript.length < 1}
              >
                <Save className="mr-2 h-6 w-6" />
                Finish My Story
              </Button>
              <p className="text-xs text-center text-charcoal-light">
                Click &quot;Finish My Story&quot; when you&apos;re ready to create your biography.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
