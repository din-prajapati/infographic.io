/**
 * AI Chat Input Field Component
 * Large input with chip tags, icon bar below
 * Enhanced with conversation history and smart suggestions
 */

import { AnimatePresence, motion } from 'motion/react';
import { CategoryChip } from './types';
import { AIChatIconBar } from './AIChatIconBar';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Sparkles, 
  History, 
  Lightbulb,
  Home,
  Building2,
  Crown,
  TrendingUp,
  MoreVertical
} from 'lucide-react';
import { Badge } from '../ui/badge';

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  previews?: Array<{
    id: string;
    thumbnail: string;
    label: string;
  }>;
}

interface AIChatInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  selectedChips: CategoryChip[];
  onRemoveChip: (chipId: string) => void;
  isGenerating: boolean;
  onSuggestionsClick: () => void;
  onQuickActionsClick: () => void;
  onStylePresetsClick: () => void;
  onUploadClick: () => void;
  lightbulbRef?: React.RefObject<HTMLButtonElement>;
  zapRef?: React.RefObject<HTMLButtonElement>;
  paletteRef?: React.RefObject<HTMLButtonElement>;
  paperclipRef?: React.RefObject<HTMLButtonElement>;
  conversationHistory?: ConversationMessage[];
  propertyType?: 'residential' | 'commercial' | 'luxury' | 'land';
  priceRange?: 'low' | 'mid' | 'high' | 'luxury';
  onMoreSuggestionsClick?: () => void;
}

export function AIChatInputField({
  value,
  onChange,
  onGenerate,
  selectedChips,
  onRemoveChip,
  isGenerating,
  onSuggestionsClick,
  onQuickActionsClick,
  onStylePresetsClick,
  onUploadClick,
  lightbulbRef,
  zapRef,
  paletteRef,
  paperclipRef,
  conversationHistory = [],
  propertyType,
  priceRange,
  onMoreSuggestionsClick,
}: AIChatInputFieldProps) {
  const canGenerate = (value.trim().length > 0 || selectedChips.length > 0) && !isGenerating;

  // Generate smart suggestions based on property context
  const getSmartSuggestions = () => {
    const suggestions: Array<{ id: string; text: string; icon: any }> = [];

    if (propertyType === 'luxury' || priceRange === 'luxury') {
      suggestions.push(
        { id: 's1', text: 'Add elegant serif fonts', icon: Crown },
        { id: 's2', text: 'Use gold accents', icon: Sparkles },
        { id: 's3', text: 'Include luxury amenities', icon: Crown }
      );
    }

    if (propertyType === 'residential') {
      suggestions.push(
        { id: 's4', text: 'Highlight school districts', icon: Home },
        { id: 's5', text: 'Family-friendly layout', icon: Home },
        { id: 's6', text: 'Add neighborhood stats', icon: TrendingUp }
      );
    }

    if (propertyType === 'commercial') {
      suggestions.push(
        { id: 's7', text: 'Include ROI projections', icon: TrendingUp },
        { id: 's8', text: 'Add square footage breakdown', icon: Building2 },
        { id: 's9', text: 'Show traffic data', icon: TrendingUp }
      );
    }

    // General suggestions
    suggestions.push(
      { id: 's10', text: 'Make it modern', icon: Lightbulb },
      { id: 's11', text: 'Use warm colors', icon: Sparkles }
    );

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  const smartSuggestions = getSmartSuggestions();

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
  };

  return (
    <div className="px-4 pt-4 pb-3">
      {/* Smart Suggestions - Above Input */}
      {(propertyType || priceRange) && smartSuggestions.length > 0 && !isGenerating && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-gray-600">Smart Suggestions</span>
            {propertyType && (
              <Badge variant="secondary" className="text-xs h-5 bg-blue-50 text-blue-700 border-0">
                {propertyType}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-2 flex-1">
              {smartSuggestions.map((suggestion) => {
                const IconComponent = suggestion.icon;
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="
                      flex items-center gap-1.5 px-3 py-1.5 
                      bg-white border border-gray-200 rounded-full 
                      text-xs text-gray-700
                      hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700
                      transition-all
                    "
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    {suggestion.text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Conversation History - Collapsible */}
      {conversationHistory.length > 0 && (
        <div className="mb-3">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 mb-2 hover:text-gray-900">
              <History className="w-3.5 h-3.5" />
              <span>Conversation ({conversationHistory.length})</span>
              <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <ScrollArea className="h-[150px] rounded-lg border border-gray-200 bg-gray-50 p-2">
              <div className="space-y-2">
                {conversationHistory.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div
                      className={`
                        flex gap-2 items-start
                        ${message.type === 'user' ? 'justify-end' : 'justify-start'}
                      `}
                    >
                      {message.type === 'ai' && (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div
                        className={`
                          max-w-[75%] rounded-lg px-2.5 py-1.5 text-xs
                          ${message.type === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white border border-gray-200 text-gray-900'
                          }
                        `}
                      >
                        {message.text}
                      </div>
                    </div>
                    {message.previews && message.previews.length > 0 && (
                      <div className="flex gap-1.5 ml-7">
                        {message.previews.map((preview) => (
                          <div
                            key={preview.id}
                            className="w-12 h-12 rounded overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                          >
                            <img
                              src={preview.thumbnail}
                              alt={preview.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </details>
        </div>
      )}

      {/* Textarea Container with Icon Bar Inside */}
      <div className="min-h-[120px] px-4 py-3 border border-gray-200 rounded-xl focus-within:border-gray-900 transition-colors bg-white">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey && canGenerate) {
              onGenerate();
            }
          }}
          placeholder={
            selectedChips.length > 0
              ? 'Describe what you want to create...'
              : 'Ask AI to create a stunning real estate infographic...'
          }
          className="w-full min-h-[96px] outline-none text-sm text-gray-900 placeholder:text-gray-400 resize-none"
          disabled={isGenerating}
          rows={4}
        />

        {/* Icon Bar Inside Same Container */}
        <AIChatIconBar
          onGenerate={onGenerate}
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          selectedChips={selectedChips}
          onRemoveChip={onRemoveChip}
          onSuggestionsClick={onSuggestionsClick}
          onQuickActionsClick={onQuickActionsClick}
          onStylePresetsClick={onStylePresetsClick}
          onUploadClick={onUploadClick}
          lightbulbRef={lightbulbRef}
          zapRef={zapRef}
          paletteRef={paletteRef}
          paperclipRef={paperclipRef}
        />
      </div>
    </div>
  );
}