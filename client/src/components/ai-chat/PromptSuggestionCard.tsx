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
      className="group flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition-all text-left"
    >
      {/* Preview Image */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <img
          src={suggestion.previewImage}
          alt={suggestion.text}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Text */}
      <div className="p-3">
        <p className="text-xs text-gray-700 line-clamp-2">
          {suggestion.text}
        </p>
      </div>
    </motion.button>
  );
}
