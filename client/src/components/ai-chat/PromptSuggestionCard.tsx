/**
 * Prompt Suggestion Card Component
 * Card with preview image and text prompt
 */

import { motion } from 'motion/react';
import { PromptSuggestion } from './types';

interface PromptSuggestionCardProps {
  suggestion: PromptSuggestion;
  onClick: () => void;
  index: number;
}

export function PromptSuggestionCard({ suggestion, onClick, index }: PromptSuggestionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="group flex flex-col bg-background border border-border rounded-lg overflow-hidden hover:shadow-md hover:border-foreground/20 transition-all text-left"
    >
      {/* Preview Image */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img
          src={suggestion.previewImage}
          alt={suggestion.text}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Text */}
      <div className="p-2.5">
        <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">
          {suggestion.text}
        </p>
      </div>
    </motion.button>
  );
}
