/**
 * AI Chat Input Component
 * Input field with template dropdown and generate button
 */

import { Send, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface AIChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onTemplateDropdownClick: () => void;
  isGenerating: boolean;
  showTemplateDropdown: boolean;
}

export function AIChatInput({
  value,
  onChange,
  onGenerate,
  onTemplateDropdownClick,
  isGenerating,
  showTemplateDropdown,
}: AIChatInputProps) {
  const canGenerate = value.trim().length > 0 && !isGenerating;

  return (
    <div className="px-4 pt-3 pb-3">
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canGenerate) {
              onGenerate();
            }
          }}
          placeholder="Example: 'Luxury waterfront property listing'"
          className="h-12 pr-24 pl-12 border-gray-200 focus:border-gray-900 focus:ring-gray-900"
          disabled={isGenerating}
        />

        {/* Left: Template Dropdown Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-1 top-1 h-10 w-10 hover:bg-gray-100"
          onClick={onTemplateDropdownClick}
          disabled={isGenerating}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>

        {/* Right: Generate Button */}
        <Button
          type="button"
          size="icon"
          className="absolute right-1 top-1 h-10 w-10 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300"
          onClick={onGenerate}
          disabled={!canGenerate}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}