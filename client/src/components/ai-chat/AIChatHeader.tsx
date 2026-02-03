/**
 * AI Chat Box Header Component
 * Top bar with title and powered-by badge
 */

import { Sparkles } from 'lucide-react';

export function AIChatHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      {/* Left: Title */}
      <div className="flex items-center gap-2">
        <h3 className="text-gray-600">Real Estate Templates</h3>
      </div>

      {/* Right: Powered by badge */}
      <div className="flex items-center gap-1.5 text-gray-500">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-xs">Powered by AI</span>
      </div>
    </div>
  );
}
