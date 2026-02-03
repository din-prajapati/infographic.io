/**
 * Conversation Messages Component
 * Container for displaying message bubbles with full-height ChatGPT-style layout
 */

import { useEffect, useRef } from 'react';
import { Message } from './types';
import { MessageBubble } from './MessageBubble';
import { TimestampDivider } from './TimestampDivider';

interface ConversationMessagesProps {
  messages: Message[];
  onBackClick?: () => void;
  conversationTitle?: string;
  onRegenerateAll?: () => void;
}

export function ConversationMessages({ messages, onBackClick, conversationTitle, onRegenerateAll }: ConversationMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  // Group messages by date for timestamp dividers
  const shouldShowTimestamp = (index: number): boolean => {
    if (index === 0) return true;
    
    const currentMsg = messages[index];
    const prevMsg = messages[index - 1];
    
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    
    return currentDate !== prevDate;
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-visible px-4 py-4 max-h-full">
      {/* Messages with timestamp dividers */}
      {messages.map((message, index) => (
        <div key={message.id}>
          {shouldShowTimestamp(index) && (
            <TimestampDivider timestamp={message.timestamp} />
          )}
          <MessageBubble 
            message={message} 
            index={index}
            onRegenerateAll={onRegenerateAll}
          />
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}