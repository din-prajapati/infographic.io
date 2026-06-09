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
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
      {/* Left: Regenerate */}
      <div className="flex items-center gap-2">
        {showRegenerateButton && onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onRegenerate}
                className="h-8 px-3 gap-1.5 text-xs border-border hover:border-ai-accent/60 hover:bg-ai-accent/10"
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
            className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onUseDesign}
          >
            Use This Design
          </Button>
        </div>
      )}
    </div>
  );
}
