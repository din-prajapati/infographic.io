/**
 * AI Property Chat Input Component
 * Enhanced chat input with conversation history, rich previews, and smart suggestions
 * Contextual suggestions based on property type & price range
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Sparkles, 
  Image as ImageIcon, 
  Lightbulb, 
  X,
  History,
  TrendingUp,
  Home,
  Building2,
  Crown,
  MoreVertical
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { EnhancedSuggestionsPanel } from './EnhancedSuggestionsPanel';

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  previews?: DesignPreview[];
}

interface DesignPreview {
  id: string;
  thumbnail: string;
  label: string;
}

interface SmartSuggestion {
  id: string;
  text: string;
  icon: React.ReactNode;
  category: string;
}

interface AIPropertyChatInputProps {
  propertyType?: 'residential' | 'commercial' | 'luxury' | 'land';
  priceRange?: 'low' | 'mid' | 'high' | 'luxury';
  onGenerate: (message: string) => void;
  isGenerating?: boolean;
  conversationHistory?: ConversationMessage[];
}

export function AIPropertyChatInput({
  propertyType,
  priceRange,
  onGenerate,
  isGenerating = false,
  conversationHistory = [],
}: AIPropertyChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showEnhancedPanel, setShowEnhancedPanel] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

  // Generate smart suggestions based on property context
  const getSmartSuggestions = (): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];

    // Property type based suggestions
    if (propertyType === 'luxury' || priceRange === 'luxury') {
      suggestions.push(
        { id: 's1', text: 'Add elegant serif fonts', icon: <Crown className="w-3.5 h-3.5" />, category: 'luxury' },
        { id: 's2', text: 'Use gold accents', icon: <Sparkles className="w-3.5 h-3.5" />, category: 'luxury' },
        { id: 's3', text: 'Include luxury amenities', icon: <Crown className="w-3.5 h-3.5" />, category: 'luxury' }
      );
    }

    if (propertyType === 'residential') {
      suggestions.push(
        { id: 's4', text: 'Highlight school districts', icon: <Home className="w-3.5 h-3.5" />, category: 'residential' },
        { id: 's5', text: 'Family-friendly layout', icon: <Home className="w-3.5 h-3.5" />, category: 'residential' },
        { id: 's6', text: 'Add neighborhood stats', icon: <TrendingUp className="w-3.5 h-3.5" />, category: 'residential' }
      );
    }

    if (propertyType === 'commercial') {
      suggestions.push(
        { id: 's7', text: 'Include ROI projections', icon: <TrendingUp className="w-3.5 h-3.5" />, category: 'commercial' },
        { id: 's8', text: 'Add square footage breakdown', icon: <Building2 className="w-3.5 h-3.5" />, category: 'commercial' },
        { id: 's9', text: 'Show traffic data', icon: <TrendingUp className="w-3.5 h-3.5" />, category: 'commercial' }
      );
    }

    // General suggestions
    suggestions.push(
      { id: 's10', text: 'Make it modern', icon: <Lightbulb className="w-3.5 h-3.5" />, category: 'general' },
      { id: 's11', text: 'Use warm colors', icon: <Sparkles className="w-3.5 h-3.5" />, category: 'general' },
      { id: 's12', text: 'Add agent headshot', icon: <ImageIcon className="w-3.5 h-3.5" />, category: 'general' }
    );

    return suggestions.slice(0, 6); // Limit to 6 suggestions
  };

  const smartSuggestions = getSmartSuggestions();

  const handleSend = () => {
    if (inputValue.trim() && !isGenerating) {
      onGenerate(inputValue);
      setInputValue('');
    }
  };

  const handleSuggestionClick = (suggestion: SmartSuggestion) => {
    setInputValue(suggestion.text);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEnhancedSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowEnhancedPanel(false);
    textareaRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full relative">
      {/* Conversation History with Details/Summary */}
      {conversationHistory.length > 0 && (
        <div className="flex-1 min-h-0 mb-3">
          <details className="group" open={showHistory}>
            <summary className="flex items-center justify-between px-1 py-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors list-none">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600 font-medium">Conversation History</span>
                <Badge variant="secondary" className="text-xs h-5 bg-gray-100 text-gray-700 border-0">
                  {conversationHistory.length}
                </Badge>
              </div>
              <motion.div
                animate={{ rotate: showHistory ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </summary>
            
            <div className="mt-2">
              <ScrollArea className="h-[200px] rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="space-y-3">
                  {conversationHistory.map((message) => (
                    <div key={message.id} className="space-y-2">
                      {/* Message */}
                      <div
                        className={`
                          flex gap-2 items-start
                          ${message.type === 'user' ? 'justify-end' : 'justify-start'}
                        `}
                      >
                        {message.type === 'ai' && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div
                          className={`
                            max-w-[80%] rounded-lg px-3 py-2 text-sm
                            ${message.type === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-gray-200 text-gray-900'
                            }
                          `}
                        >
                          {message.text}
                        </div>
                      </div>

                      {/* Rich Previews */}
                      {message.previews && message.previews.length > 0 && (
                        <div className="flex gap-2 ml-8">
                          {message.previews.map((preview) => (
                            <div
                              key={preview.id}
                              className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
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
            </div>
          </details>
        </div>
      )}

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && !isFocused && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-gray-600">Smart Suggestions</span>
            {propertyType && (
              <Badge variant="secondary" className="text-xs h-5 bg-blue-50 text-blue-700 border-0">
                {propertyType}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {smartSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 
                  bg-white border border-gray-200 rounded-full 
                  text-xs text-gray-700
                  hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700
                  transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                disabled={isGenerating}
              >
                {suggestion.icon}
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Field */}
      <div
        className={`
          relative rounded-xl border-2 transition-all
          ${isFocused 
            ? 'border-blue-500 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300'
          }
          ${isGenerating ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your design request or click a suggestion..."
            disabled={isGenerating}
            rows={1}
            className="
              w-full min-h-[24px] max-h-[120px]
              bg-transparent outline-none resize-none
              text-sm text-gray-900 placeholder:text-gray-400
              overflow-y-auto scrollbar-thin
            "
            style={{ height: '24px' }}
          />
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-0">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">
              {isGenerating ? 'Generating...' : 'Press Enter to send'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Three-Dot Enhanced Suggestions Button */}
            <Button
              onClick={() => setShowEnhancedPanel(true)}
              disabled={isGenerating}
              size="sm"
              variant="ghost"
              className="
                h-8 w-8 p-0 rounded-full
                hover:bg-gray-100
                disabled:opacity-40 disabled:cursor-not-allowed
              "
              title="View all suggestions"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isGenerating}
              size="sm"
              className="
                h-8 w-8 p-0 rounded-full
                bg-gradient-to-br from-purple-500 to-blue-500
                hover:from-purple-600 hover:to-blue-600
                disabled:opacity-40 disabled:cursor-not-allowed
                shadow-sm
              "
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Contextual Hint */}
      {propertyType && priceRange && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          AI is optimized for <span className="text-gray-700 font-medium">{propertyType}</span> properties in the <span className="text-gray-700 font-medium">{priceRange}</span> range
        </div>
      )}

      {/* Enhanced Suggestions Panel */}
      <EnhancedSuggestionsPanel
        isOpen={showEnhancedPanel}
        onClose={() => setShowEnhancedPanel(false)}
        onSuggestionClick={handleEnhancedSuggestionClick}
        propertyType={propertyType}
        priceRange={priceRange}
      />
    </div>
  );
}