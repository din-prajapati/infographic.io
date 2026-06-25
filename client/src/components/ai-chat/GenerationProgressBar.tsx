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
  /** Raw 0-100 percentage from the WebSocket payload. When provided this
   *  takes priority over the step-based calculation so the bar moves
   *  continuously rather than in coarse jumps. */
  progressPercent?: number;
  message?: string;
  estimatedTime?: number; // in seconds
}

export function GenerationProgressBar({
  isGenerating,
  currentStep,
  totalSteps,
  progressPercent,
  message = 'Generating templates using AI...',
  estimatedTime = 45,
}: GenerationProgressBarProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setElapsedTime(0);
      setDisplayedProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const stepProgress =
    totalSteps > 0
      ? Math.min(((currentStep + 1) / totalSteps) * 100, 100)
      : 0;
  const targetProgress =
    progressPercent !== undefined
      ? Math.max(progressPercent, stepProgress)
      : stepProgress;

  useEffect(() => {
    if (!isGenerating) return;
    setDisplayedProgress((prev) => Math.max(prev, targetProgress));
  }, [isGenerating, targetProgress]);

  // Creep 1% every 300ms toward target so the bar moves between WebSocket steps
  useEffect(() => {
    if (!isGenerating || displayedProgress >= targetProgress) return;
    const creep = setInterval(() => {
      setDisplayedProgress((prev) => {
        if (prev >= targetProgress) return prev;
        return Math.min(prev + 1, targetProgress);
      });
    }, 300);
    return () => clearInterval(creep);
  }, [isGenerating, targetProgress, displayedProgress]);

  const progress = displayedProgress;

  if (!isGenerating) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="sticky bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 z-10"
    >
      {/* Progress Bar — absolute fill ensures visible height + color in dark theme */}
      <div className="mb-2">
        <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${Math.max(progress, 0)}%`,
              minWidth: progress > 0 ? 6 : 0,
              background: 'linear-gradient(90deg, hsl(271 81% 56%), hsl(217 91% 60%))',
              transition: 'width 0.25s ease',
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {Math.round(progress)}%
        </p>
      </div>

      {/* Status and Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-ai-accent animate-spin" />
          <span className="text-sm text-foreground">{message}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{formatTime(elapsedTime)}</span>
          <span className="text-muted-foreground/50">/</span>
          <span>{formatTime(estimatedTime)}</span>
        </div>
      </div>
    </motion.div>
  );
}
