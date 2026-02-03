/**
 * AI Suggestions Panel
 * Shows AI-powered prompt suggestions
 */

import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, TrendingUp, Clock, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AISuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuggestionClick: (suggestion: string) => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

const suggestions = [
  {
    icon: Sparkles,
    title: 'Trending Prompts',
    items: [
      'Create a luxury property listing with pricing',
      'Generate a Just Sold celebration post',
      'Design a modern agent business card',
    ],
  },
  {
    icon: Clock,
    title: 'Quick Templates',
    items: [
      'Open house this weekend',
      'New listing announcement',
      'Price reduction alert',
    ],
  },
  {
    icon: Star,
    title: 'Popular Styles',
    items: [
      'Minimalist modern design',
      'Bold colorful infographic',
      'Professional luxury branding',
    ],
  },
];

export function AISuggestionsPanel({ isOpen, onClose, onSuggestionClick, buttonRef }: AISuggestionsPanelProps) {
  const [position, setPosition] = useState({ bottom: '8rem', left: '2rem' });

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        bottom: `${window.innerHeight - rect.top + 8}px`, // 8px above button
        left: `${rect.left}px`,
      });
    }
  }, [isOpen, buttonRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ bottom: position.bottom, left: position.left }}
            className="fixed w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[110] max-h-[500px] overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm">AI Suggestions 💡</h3>
              <p className="text-xs text-gray-500 mt-1">Click to use a suggestion</p>
            </div>

            <div className="p-3 space-y-3">
              {/* Property Context Badge - Dynamic */}
              <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">Smart Mode Active</p>
                      <p className="text-xs text-gray-500">Optimized for Residential · Mid-range</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top 3 Contextual Quick Actions */}
              <div>
                <h4 className="text-xs font-medium text-gray-900 mb-2 px-1">⚡ Quick Actions</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      onSuggestionClick('Add warm colors');
                      onClose();
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center transition-colors">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-red-400"></div>
                    </div>
                    <span className="text-xs text-gray-700 text-center">Warm Colors</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onSuggestionClick('Make it modern');
                      onClose();
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-700 text-center">Modern</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onSuggestionClick('Add agent photo');
                      onClose();
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 text-center">Agent Photo</span>
                  </button>
                </div>
              </div>

              {/* Categorized Suggestions with Visual Icons */}
              {suggestions.map((section, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <section.icon className="w-3.5 h-3.5 text-gray-400" />
                    <h4 className="text-xs font-medium text-gray-600">{section.title}</h4>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item, itemIdx) => (
                      <button
                        key={itemIdx}
                        onClick={() => {
                          onSuggestionClick(item);
                          onClose();
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-200 border border-transparent transition-all group flex items-center justify-between"
                      >
                        <span className="text-gray-700 group-hover:text-gray-900">{item}</span>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Property-Specific Suggestions Section */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <h4 className="text-xs font-medium text-gray-600">For Residential Properties</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onSuggestionClick('Highlight school districts');
                      onClose();
                    }}
                    className="px-3 py-2 text-xs rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-left border border-emerald-200"
                  >
                    <div className="font-medium mb-0.5">🏫 Schools</div>
                    <div className="text-emerald-600">Show nearby districts</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      onSuggestionClick('Add neighborhood stats');
                      onClose();
                    }}
                    className="px-3 py-2 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-left border border-blue-200"
                  >
                    <div className="font-medium mb-0.5">📊 Stats</div>
                    <div className="text-blue-600">Neighborhood data</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      onSuggestionClick('Family-friendly layout');
                      onClose();
                    }}
                    className="px-3 py-2 text-xs rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-left border border-purple-200"
                  >
                    <div className="font-medium mb-0.5">👨‍👩‍👧 Family</div>
                    <div className="text-purple-600">Kid-friendly design</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      onSuggestionClick('Show walkability score');
                      onClose();
                    }}
                    className="px-3 py-2 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-left border border-amber-200"
                  >
                    <div className="font-medium mb-0.5">🚶 Walk Score</div>
                    <div className="text-amber-600">Lifestyle metrics</div>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}