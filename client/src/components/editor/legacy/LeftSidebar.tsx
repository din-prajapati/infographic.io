// Left sidebar - Layers Panel Only

import { Layers } from "lucide-react";
import { LayersTab } from "./sidebar/LayersTab";

export function LeftSidebar() {
  return (
    <div className="w-56 h-full border-r bg-sidebar flex flex-col">
      {/* Header */}
      <div className="h-12 px-3 border-b flex items-center gap-2">
        <Layers className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">Layers</span>
      </div>

      {/* Layers Content */}
      <div className="flex-1 min-h-0">
        <LayersTab />
      </div>
    </div>
  );
}
