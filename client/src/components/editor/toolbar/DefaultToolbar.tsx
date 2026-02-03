// Default toolbar (no element selected)

import { Sparkles } from "lucide-react";
import { Button } from "../../ui/button";

interface DefaultToolbarProps {
  onPropertyDetailsClick?: () => void;
}

export function DefaultToolbar({ onPropertyDetailsClick }: DefaultToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-muted-foreground">
        Select an element to edit its properties
      </div>
      
      {onPropertyDetailsClick && (
        <Button
          variant="outline"
          size="sm"
          onClick={onPropertyDetailsClick}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Add Property Details
        </Button>
      )}
    </div>
  );
}
