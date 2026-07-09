/**
 * Full-Screen Conversation History View
 * Replaces entire AIChatBox when History icon is clicked
 * Groups conversations by: Today, Yesterday, Last 7 Days, Last 30 Days, Older
 */

import { motion } from 'motion/react';
import { ArrowLeft, MessageSquare, Star, Trash2 } from 'lucide-react';
import { Conversation } from './types';
import { Button } from '../ui/button';

interface ConversationHistoryViewProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  onBack: () => void;
  onToggleFavorite: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

export function ConversationHistoryView({
  conversations,
  onSelectConversation,
  onBack,
  onToggleFavorite,
  onDeleteConversation,
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
      <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-foreground">Chat History</h3>
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
            <MessageSquare className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No conversations yet</p>
            <p className="text-xs text-muted-foreground/60">Start a new chat to see history here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Today */}
            {groupedConversations.today.length > 0 && (
              <TimeSection
                title="Today"
                conversations={groupedConversations.today}
                onSelect={onSelectConversation}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDeleteConversation}
              />
            )}

            {/* Yesterday */}
            {groupedConversations.yesterday.length > 0 && (
              <TimeSection
                title="Yesterday"
                conversations={groupedConversations.yesterday}
                onSelect={onSelectConversation}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDeleteConversation}
              />
            )}

            {/* Last 7 Days */}
            {groupedConversations.lastWeek.length > 0 && (
              <TimeSection
                title="Last 7 Days"
                conversations={groupedConversations.lastWeek}
                onSelect={onSelectConversation}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDeleteConversation}
              />
            )}

            {/* Last 30 Days */}
            {groupedConversations.lastMonth.length > 0 && (
              <TimeSection
                title="Last 30 Days"
                conversations={groupedConversations.lastMonth}
                onSelect={onSelectConversation}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDeleteConversation}
              />
            )}

            {/* Older */}
            {groupedConversations.older.length > 0 && (
              <TimeSection
                title="Older"
                conversations={groupedConversations.older}
                onSelect={onSelectConversation}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDeleteConversation}
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
  onToggleFavorite: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
}

function TimeSection({ title, conversations, onSelect, onToggleFavorite, onDelete }: TimeSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1 uppercase tracking-wide">{title}</h3>
      <div className="space-y-1">
        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            onClick={() => onSelect(conv)}
            onToggleFavorite={() => onToggleFavorite(conv.id)}
            onDelete={() => onDelete(conv.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

function ConversationItem({ conversation, onClick, onToggleFavorite, onDelete }: ConversationItemProps) {
  const messageCount = conversation.messages.length;
  const timestamp = new Date(conversation.updatedAt);
  const timeStr = formatTime(timestamp);

  return (
    <div className="group/item flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-muted transition-colors">
      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left px-1.5 py-1.5 rounded-md active:bg-muted/60 transition-colors"
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm text-foreground font-medium line-clamp-1 flex-1 group-hover/item:text-primary transition-colors">
            {conversation.title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{timeStr}</span>
          <span className="text-xs text-muted-foreground/40">•</span>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground">{messageCount}</span>
          </div>
          {conversation.propertyType && (
            <>
              <span className="text-xs text-muted-foreground/40">•</span>
              <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded capitalize">
                {conversation.propertyType}
              </span>
            </>
          )}
        </div>
      </button>

      <div className="flex items-center gap-0.5 shrink-0 pr-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="p-1.5 rounded hover:bg-background transition-colors"
          title={conversation.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              conversation.isFavorite
                ? 'fill-amber-500 text-amber-500'
                : 'text-muted-foreground/40 group-hover/item:text-muted-foreground'
            }`}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded hover:bg-background transition-colors opacity-0 group-hover/item:opacity-100"
          title="Delete conversation"
        >
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
        </button>
      </div>
    </div>
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