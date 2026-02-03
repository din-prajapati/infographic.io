/**
 * Smart Suggestions Row Component
 * Horizontal pills with property-aware suggestions + three-dot button
 */

import { motion } from 'motion/react';
import { MoreVertical, Sparkles } from 'lucide-react';
import { SmartSuggestion } from './types';

interface SmartSuggestionsRowProps {
  suggestions: SmartSuggestion[];
  onSuggestionClick: (text: string) => void;
  onMoreClick: () => void;
}

export function SmartSuggestionsRow({
  suggestions,
  onSuggestionClick,
  onMoreClick,
}: SmartSuggestionsRowProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-4 pb-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
        <span className="text-xs font-medium text-gray-700">Smart Suggestions</span>
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* Suggestion Pills */}
        {suggestions.slice(0, 4).map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border border-purple-200 hover:border-purple-300 rounded-full text-xs font-medium text-gray-700 transition-all hover:shadow-sm"
          >
            {suggestion.text}
          </button>
        ))}

        {/* Three-Dot Button */}
        <button
          onClick={onMoreClick}
          className="shrink-0 w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 border border-gray-300 hover:border-gray-400 rounded-full transition-all hover:shadow-sm"
          aria-label="More suggestions"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </motion.div>
  );
}
