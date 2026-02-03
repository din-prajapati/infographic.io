/**
 * Full-Screen Conversation History View
 * Replaces entire AIChatBox when History icon is clicked
 * Groups conversations by: Today, Yesterday, Last 7 Days, Last 30 Days, Older
 */

import { motion } from 'motion/react';
import { ArrowLeft, MessageSquare, Star } from 'lucide-react';
import { Conversation } from './types';
import { Button } from '../ui/button';

interface ConversationHistoryViewProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  onBack: () => void;
}

export function ConversationHistoryView({
  conversations,
  onSelectConversation,
  onBack,
}: ConversationHistoryViewProps) {
  
  // Group conversations by time
  const groupedConversations = groupByTime(conversations);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full max-h-full"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">Chat History</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={onBack}
            className="h-8 px-3"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Conversations List - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-visible px-4">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-600 mb-1">No conversations yet</p>
            <p className="text-xs text-gray-500">Start a new chat to see history here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today */}
            {groupedConversations.today.length > 0 && (
              <TimeSection
                title="Today"
                conversations={groupedConversations.today}
                onSelect={onSelectConversation}
              />
            )}

            {/* Yesterday */}
            {groupedConversations.yesterday.length > 0 && (
              <TimeSection
                title="Yesterday"
                conversations={groupedConversations.yesterday}
                onSelect={onSelectConversation}
              />
            )}

            {/* Last 7 Days */}
            {groupedConversations.lastWeek.length > 0 && (
              <TimeSection
                title="Last 7 Days"
                conversations={groupedConversations.lastWeek}
                onSelect={onSelectConversation}
              />
            )}

            {/* Last 30 Days */}
            {groupedConversations.lastMonth.length > 0 && (
              <TimeSection
                title="Last 30 Days"
                conversations={groupedConversations.lastMonth}
                onSelect={onSelectConversation}
              />
            )}

            {/* Older */}
            {groupedConversations.older.length > 0 && (
              <TimeSection
                title="Older"
                conversations={groupedConversations.older}
                onSelect={onSelectConversation}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface TimeSectionProps {
  title: string;
  conversations: Conversation[];
  onSelect: (conversation: Conversation) => void;
}

function TimeSection({ title, conversations, onSelect }: TimeSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-gray-500 mb-2 px-1">{title}</h3>
      <div className="space-y-1">
        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            onClick={() => onSelect(conv)}
          />
        ))}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  const messageCount = conversation.messages.length;
  const timestamp = new Date(conversation.updatedAt);
  const timeStr = formatTime(timestamp);

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm text-gray-900 font-medium line-clamp-1 flex-1 group-hover:text-blue-600 transition-colors">
          {conversation.title}
        </p>
        {conversation.isFavorite && (
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{timeStr}</span>
        <span className="text-xs text-gray-400">•</span>
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{messageCount}</span>
        </div>
        {conversation.propertyType && (
          <>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded capitalize">
              {conversation.propertyType}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

// Helper functions
function groupByTime(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setDate(lastMonth.getDate() - 30);

  const grouped = {
    today: [] as Conversation[],
    yesterday: [] as Conversation[],
    lastWeek: [] as Conversation[],
    lastMonth: [] as Conversation[],
    older: [] as Conversation[],
  };

  conversations.forEach((conv) => {
    const date = new Date(conv.updatedAt);
    
    if (date >= today) {
      grouped.today.push(conv);
    } else if (date >= yesterday) {
      grouped.yesterday.push(conv);
    } else if (date >= lastWeek) {
      grouped.lastWeek.push(conv);
    } else if (date >= lastMonth) {
      grouped.lastMonth.push(conv);
    } else {
      grouped.older.push(conv);
    }
  });

  return grouped;
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
}