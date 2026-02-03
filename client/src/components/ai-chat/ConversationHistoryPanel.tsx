/**
 * Conversation History Panel Component
 * Collapsible panel with past conversations
 */

import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Star, Home, Building2, Crown, Landmark, MessageSquare, Trash2 } from 'lucide-react';
import { Conversation } from './types';
import { useState } from 'react';

interface ConversationHistoryPanelProps {
  conversations: Conversation[];
  onConversationClick: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onToggleFavorite: (conversationId: string) => void;
  currentConversationId?: string;
}

export function ConversationHistoryPanel({
  conversations,
  onConversationClick,
  onDeleteConversation,
  onToggleFavorite,
  currentConversationId,
}: ConversationHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (conversations.length === 0) {
    return null;
  }

  // Get property icon based on type
  const getPropertyIcon = (propertyType?: string) => {
    switch (propertyType) {
      case 'residential':
        return <Home className="w-4 h-4" />;
      case 'commercial':
        return <Building2 className="w-4 h-4" />;
      case 'luxury':
        return <Crown className="w-4 h-4" />;
      case 'land':
        return <Landmark className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="border-b border-gray-200">
      <details
        className="group"
        open={isOpen}
        onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors list-none">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Conversation History
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" />
        </summary>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-[200px] overflow-y-auto">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group/item flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors border-l-2 ${
                      currentConversationId === conversation.id
                        ? 'border-l-blue-500 bg-blue-50'
                        : 'border-l-transparent'
                    }`}
                  >
                    <button
                      onClick={() => onConversationClick(conversation.id)}
                      className="flex-1 flex items-start gap-2 text-left min-w-0"
                    >
                      <div className="text-gray-600 mt-0.5 shrink-0">
                        {getPropertyIcon(conversation.propertyType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {conversation.messages.length} messages
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(conversation.id);
                        }}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            conversation.isFavorite
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </details>
    </div>
  );
}
