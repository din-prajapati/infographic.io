/**
 * Generation Progress Bar Component
 * Sticky bottom progress bar during AI generation (ChatGPT style)
 */

import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GenerationProgressBarProps {
  isGenerating: boolean;
  currentStep: number;
  totalSteps: number;
  message?: string;
  estimatedTime?: number; // in seconds
}

export function GenerationProgressBar({
  isGenerating,
  currentStep,
  totalSteps,
  message = 'Generating templates using AI...',
  estimatedTime = 45,
}: GenerationProgressBarProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((currentStep / totalSteps) * 100, 100);

  if (!isGenerating) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10"
    >
      {/* Progress Bar */}
      <div className="mb-2">
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Status and Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
          <span className="text-sm text-gray-700">{message}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{formatTime(elapsedTime)}</span>
          <span className="text-gray-300">/</span>
          <span>{formatTime(estimatedTime)}</span>
        </div>
      </div>
    </motion.div>
  );
}
