/**
 * Message Bubble Component
 * Individual user/AI message display with generation steps support
 */

import { motion } from 'motion/react';
import { Message } from './types';
import { Sparkles, Check, Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react';
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
}

export function MessageBubble({ message, index, onRegenerateAll }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const isLoading = message.isLoading;
  const isGenerating = message.isGenerating;

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
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
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-100 rounded-full">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-purple-700 font-medium">Real Estate Template Generator</span>
            </div>
            {isGenerating && (
              <div className="px-2 py-0.5 bg-blue-100 rounded-full">
                <span className="text-xs text-blue-700 font-medium">Executing</span>
              </div>
            )}
            {!isGenerating && message.resultPreviews && (
              <div className="px-2 py-0.5 bg-green-100 rounded-full">
                <span className="text-xs text-green-700 font-medium">Complete</span>
              </div>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-gray-100 text-gray-900 rounded-br-md'
              : isGenerating 
                ? 'bg-gradient-to-br from-gray-50 to-purple-50 border border-purple-200 text-gray-900 rounded-bl-md min-w-[320px]'
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
          }`}
        >
          {/* User Message Icon Badge */}
          {isUser && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                <ImageIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs text-gray-500">You</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : isGenerating && message.generationSteps ? (
            // Generation Progress inside AI bubble
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-medium text-gray-900">Generating your infographic...</p>
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
                      <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0" />
                    )}
                    <span className={`text-sm ${
                      step.status === 'completed' 
                        ? 'text-gray-600' 
                        : step.status === 'in-progress'
                          ? 'text-purple-700 font-medium'
                          : 'text-gray-400'
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
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Generated {message.resultPreviews.length} variations:</p>
                  <div className="flex gap-2">
                    {message.resultPreviews.map((preview) => (
                      <div key={preview.id} className="flex-1">
                        <img 
                          src={preview.thumbnail} 
                          alt={preview.title}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <p className="text-xs text-gray-600 mt-1 truncate">{preview.title}</p>
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
          <span className="text-xs text-gray-500 mt-1 px-1">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </motion.div>
  );
}