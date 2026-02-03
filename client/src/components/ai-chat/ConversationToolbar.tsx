/**
 * Conversation Toolbar Component
 * Top action toolbar for active conversations
 */

import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

interface ConversationToolbarProps {
  onRegenerate?: () => void;
  showRegenerateButton?: boolean;
  selectedVariationId?: string | null;
  onUseDesign?: () => void;
  onCustomize?: () => void;
}

export function ConversationToolbar({
  onRegenerate,
  showRegenerateButton = false,
  selectedVariationId,
  onUseDesign,
  onCustomize,
}: ConversationToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50/50">
      {/* Left: Regenerate */}
      <div className="flex items-center gap-2">
        {showRegenerateButton && onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onRegenerate}
                className="h-8 px-3 gap-1.5 text-xs border-gray-300 hover:border-purple-400 hover:bg-purple-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Generate new variations</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Right: Action Buttons when variation selected */}
      {selectedVariationId && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onCustomize}
            className="h-8 px-3 text-xs"
          >
            Customize
          </Button>
          <Button
            size="sm"
            className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700"
            onClick={onUseDesign}
          >
            Use This Design
          </Button>
        </div>
      )}
    </div>
  );
}
