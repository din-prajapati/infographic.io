/**
 * Message Bubble Component
 * Individual user/AI message display with generation steps support
 */

import { motion } from 'motion/react';
import { Message } from './types';
import { Sparkles, Check, Loader2, RefreshCw, Image as ImageIcon, AlertCircle, MapPin, DollarSign } from 'lucide-react';
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
}

export function MessageBubble({ message, index, onRegenerateAll, selectedPreviewId, onSelectPreview }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const isLoading = message.isLoading;
  const isGenerating = message.isGenerating;
  const isValidationHint = message.isValidationHint;
  const isError = !isValidationHint && !isUser && message.content.startsWith('Error:');

  const formatTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
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
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/15 rounded-full">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-purple-500 font-medium">Real Estate Template Generator</span>
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
                    ? 'bg-purple-500/10 border border-purple-500/30 text-foreground rounded-bl-md min-w-[320px]'
                    : 'bg-background border border-border text-foreground rounded-bl-md'
          }`}
        >
          {/* User Message Icon Badge */}
          {isUser && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
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
                <Sparkles className="w-4 h-4 text-purple-600" />
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
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center shrink-0">
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted border border-border shrink-0" />
                    )}
                    <span className={`text-sm ${
                      step.status === 'completed'
                        ? 'text-muted-foreground'
                        : step.status === 'in-progress'
                          ? 'text-purple-500 font-medium'
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
              
              {/* Result Previews - Small thumbnails in AI message */}
              {message.resultPreviews && message.resultPreviews.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Generated {message.resultPreviews.length} variations:</p>
                  <div className="flex gap-2">
                    {message.resultPreviews.map((preview) => (
                      <div
                        key={preview.id}
                        className={`flex-1 cursor-pointer rounded-lg transition-all ${
                          selectedPreviewId === preview.id
                            ? 'ring-2 ring-blue-500'
                            : 'hover:ring-2 hover:ring-blue-300'
                        }`}
                        onClick={() => onSelectPreview?.(preview.id)}
                        role="button"
                        aria-label={`Select ${preview.title}`}
                        aria-pressed={selectedPreviewId === preview.id}
                      >
                        <img 
                          src={preview.thumbnail} 
                          alt={preview.title}
                          className="w-full h-20 object-cover rounded-lg border border-border"
                        />
                        <p className="text-xs text-muted-foreground mt-1 truncate">{preview.title}</p>
                      </div>
                    ))}
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
  );
}