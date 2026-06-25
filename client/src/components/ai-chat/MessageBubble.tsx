/**
 * Message Bubble Component
 * Individual user/AI message display with generation steps support
 */

import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Message } from './types';
import { Sparkles, Check, Loader2, RefreshCw, Image as ImageIcon, AlertCircle, MapPin, DollarSign, ZoomIn, X, Maximize2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

interface MessageBubbleProps {
  message: Message;
  index: number;
  onRegenerateAll?: () => void;
  selectedPreviewId?: string | null;
  onSelectPreview?: (id: string) => void;
  onUseVariation?: (id: string) => void;
}

export function MessageBubble({ message, index, onRegenerateAll, selectedPreviewId, onSelectPreview, onUseVariation }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const isLoading = message.isLoading;
  const isGenerating = message.isGenerating;
  const isValidationHint = message.isValidationHint;
  const isError = !isValidationHint && !isUser && message.content.startsWith('Error:');

  const [lightboxPreview, setLightboxPreview] = useState<{ id: string; thumbnail: string; title: string } | null>(null);

  const formatTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <>
    {/* Lightbox — fixed so it escapes overflow:hidden on all parents */}
    <AnimatePresence>
      {lightboxPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-6"
          onClick={() => setLightboxPreview(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-[85vw] max-h-[85vh] flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPreview(null)}
              className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-gray-100 z-10"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
            <img
              src={lightboxPreview.thumbnail}
              alt={lightboxPreview.title}
              className="max-w-full max-h-[72vh] rounded-xl object-contain shadow-2xl"
            />
            <div className="flex items-center gap-3 mt-1">
              <p className="text-white/70 text-sm flex-1">{lightboxPreview.title}</p>
              <button
                className="px-4 py-1.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                onClick={() => { onUseVariation?.(lightboxPreview.id); setLightboxPreview(null); }}
              >
                Use This Design
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {/* Tool/Model Tag for AI messages */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 px-1">
            {isValidationHint ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/15 rounded-full">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-amber-500 font-medium">Missing Information</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-ai-accent/15 rounded-full"> {/* AI brand — intentional */}
                  <Sparkles className="w-3 h-3 text-ai-accent" />
                  <span className="text-xs text-ai-accent font-medium">Real Estate Template Generator</span>
                </div>
                {isGenerating && (
                  <div className="px-2 py-0.5 bg-blue-500/15 rounded-full">
                    <span className="text-xs text-blue-500 font-medium">Executing</span>
                  </div>
                )}
                {!isGenerating && message.resultPreviews && (
                  <div className="px-2 py-0.5 bg-green-500/15 rounded-full">
                    <span className="text-xs text-green-500 font-medium">Complete</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-muted text-foreground rounded-br-md'
              : isValidationHint
                ? 'bg-amber-500/10 border border-amber-500/30 text-foreground rounded-bl-md'
                : isError
                  ? 'bg-destructive/10 border border-destructive/30 text-foreground rounded-bl-md'
                  : isGenerating
                    ? 'bg-ai-accent/10 border border-ai-accent/30 text-foreground rounded-bl-md min-w-[320px]' /* AI brand — intentional */
                    : 'bg-background border border-border text-foreground rounded-bl-md'
          }`}
        >
          {/* User Message Icon Badge */}
          {isUser && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-ai-accent flex items-center justify-center">
                <ImageIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">You</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : isValidationHint ? (
            // Validation guidance message
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-sm font-medium text-amber-800">{message.content}</p>
              </div>
              
              {message.missingFields && message.missingFields.length > 0 && (
                <div className="space-y-2 pl-1">
                  <p className="text-xs text-amber-700 font-medium">Please include:</p>
                  {message.missingFields.map((field) => (
                    <div key={field} className="flex items-center gap-2 text-sm text-amber-900">
                      {field === 'address' ? (
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      ) : (
                        <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span>
                        {field === 'address' 
                          ? 'Property address (e.g., "123 Oak Street, Austin TX")'
                          : 'Price (e.g., "$450,000" or "450k")'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-amber-600 italic">
                Example: "3BR house at 123 Oak St, Austin TX for $450k with pool"
              </p>
            </div>
          ) : isGenerating && message.generationSteps ? (
            // Generation Progress inside AI bubble
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-ai-accent" />
                <p className="text-sm font-medium text-foreground">Generating your infographic...</p>
              </div>
              
              <div className="space-y-2">
                {message.generationSteps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-2.5">
                    {step.status === 'completed' ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : step.status === 'in-progress' ? (
                      <div className="w-5 h-5 rounded-full bg-ai-accent flex items-center justify-center shrink-0">
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted border border-border shrink-0" />
                    )}
                    <span className={`text-sm ${
                      step.status === 'completed'
                        ? 'text-muted-foreground'
                        : step.status === 'in-progress'
                          ? 'text-ai-accent font-medium'
                          : 'text-muted-foreground/50'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              
              {/* Result Previews - Variation cards with zoom */}
              {message.resultPreviews && message.resultPreviews.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    Generated {message.resultPreviews.length} variations
                    <span className="ml-1 opacity-60">· click image to preview full size</span>
                  </p>
                  <div className="flex gap-2">
                    {message.resultPreviews.map((preview) => {
                      const isSelected = selectedPreviewId === preview.id;
                      return (
                        <div key={preview.id} className="flex-1 flex flex-col gap-1">
                          {/* Thumbnail */}
                          <div
                            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                              isSelected ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.25)]' : 'border-border'
                            }`}
                          >
                            <img
                              src={preview.thumbnail}
                              alt={preview.title}
                              className="w-full h-full object-cover cursor-zoom-in"
                              onClick={() => setLightboxPreview(preview)}
                              title="Click to preview full size"
                            />

                            {/* Always-visible zoom badge */}
                            <button
                              className="absolute top-1 left-1 flex items-center gap-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full pl-1 pr-1.5 py-0.5 transition-colors"
                              onClick={() => setLightboxPreview(preview)}
                              title="Preview full size"
                            >
                              <Maximize2 className="w-2.5 h-2.5" />
                              <span className="text-[9px] font-medium leading-none">Preview</span>
                            </button>

                            {/* Selected check */}
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Label + Use This Design button */}
                          <p className="text-[11px] text-muted-foreground truncate px-0.5">{preview.title}</p>
                          <button
                            className="w-full text-[10px] py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                            onClick={() => onUseVariation?.(preview.id)}
                          >
                            Use This Design
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Timestamp */}
        {!isLoading && (
          <span className="text-xs text-muted-foreground mt-1 px-1">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </motion.div>
    </>
  );
}