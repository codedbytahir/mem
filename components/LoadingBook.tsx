'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Mic } from 'lucide-react';

export const LoadingBook: React.FC = () => {
  const [phase, setPhase] = useState<'wave' | 'transition' | 'book'>('wave');
  const [loadingText, setLoadingText] = useState('Listening to your story...');

  useEffect(() => {
    const messages = [
      'Transcribing memories...',
      'Removing filler words...',
      'Fixing grammar and syntax...',
      'Organizing chronologically...',
      'Structuring into paragraphs...',
      'Capturing your unique voice...',
      'Finalizing your biography...',
    ];

    const timer = setTimeout(() => setPhase('transition'), 5000);
    const timer2 = setTimeout(() => setPhase('book'), 6500);

    const textInterval = setInterval(() => {
      setLoadingText(prev => {
        const index = messages.indexOf(prev);
        return messages[(index + 1) % messages.length];
      });
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12">
      <div className="relative h-48 w-48 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === 'wave' && (
            <motion.div
              key="wave"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center space-x-2"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 rounded-full bg-navy"
                  animate={{
                    height: [20, 100, 40, 80, 20],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          )}

          {phase === 'transition' && (
            <motion.div
              key="transition"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <motion.div
                className="h-32 w-2 bg-navy rounded-full"
                animate={{ width: [8, 60, 8] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          )}

          {phase === 'book' && (
            <motion.div
              key="book"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              className="flex items-center justify-center text-copper"
            >
              <BookOpen className="h-32 w-32" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-center space-y-4 max-w-sm">
        <h2 className="font-serif text-2xl font-semibold text-navy">
          Your biographer is at work...
        </h2>
        <motion.p
          key={loadingText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg text-charcoal-light"
        >
          {loadingText}
        </motion.p>
      </div>
    </div>
  );
};
