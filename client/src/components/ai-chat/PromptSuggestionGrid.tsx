/**
 * Prompt Suggestion Grid Component
 * 3-column grid of prompt suggestion cards
 */

import { motion, AnimatePresence } from 'motion/react';
import { PromptSuggestion } from './types';
import { PromptSuggestionCard } from './PromptSuggestionCard';

interface PromptSuggestionGridProps {
  suggestions: PromptSuggestion[];
  onSuggestionClick: (suggestion: PromptSuggestion) => void;
}

export function PromptSuggestionGrid({ suggestions, onSuggestionClick }: PromptSuggestionGridProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <PromptSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                index={index}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
