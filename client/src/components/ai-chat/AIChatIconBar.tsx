/**
 * AI Chat Icon Bar Component
 * Full-width horizontal bar with left (attach + chips) and right (action icons) sections
 */

import { Lightbulb, Zap, Palette, Paperclip } from 'lucide-react';
import { Button } from '../ui/button';
import { CategoryChip } from './types';
import { ChipTag } from './ChipTag';
import { AnimatePresence } from 'motion/react';

interface AIChatIconBarProps {
  onGenerate: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
  selectedChips: CategoryChip[];
  onRemoveChip: (chipId: string) => void;
  onSuggestionsClick: () => void;
  onQuickActionsClick: () => void;
  onStylePresetsClick: () => void;
  onUploadClick: () => void;
  lightbulbRef?: React.RefObject<HTMLButtonElement>;
  zapRef?: React.RefObject<HTMLButtonElement>;
  paletteRef?: React.RefObject<HTMLButtonElement>;
  paperclipRef?: React.RefObject<HTMLButtonElement>;
}

export function AIChatIconBar({
  onGenerate,
  canGenerate,
  isGenerating,
  selectedChips,
  onRemoveChip,
  onSuggestionsClick,
  onQuickActionsClick,
  onStylePresetsClick,
  onUploadClick,
  lightbulbRef,
  zapRef,
  paletteRef,
  paperclipRef,
}: AIChatIconBarProps) {
  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 -mx-1">
      {/* Left Section: Attach Icon + Selected Chips */}
      <div className="flex items-center gap-2">
        {/* Attach/Paperclip Icon */}
        <Button
          ref={paperclipRef}
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-gray-100 text-gray-500"
          title="Attach file"
          onClick={onUploadClick}
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        {/* Selected Chips */}
        {selectedChips.length > 0 && (
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {selectedChips.map(chip => (
                <ChipTag
                  key={chip.id}
                  chip={chip}
                  onRemove={() => onRemoveChip(chip.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-grow" />

      {/* Right Section: Action Icons */}
      <div className="flex items-center gap-1">
        {/* Lightbulb - Suggestions */}
        <Button
          ref={lightbulbRef}
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-gray-100 text-gray-500"
          title="AI Suggestions"
          onClick={onSuggestionsClick}
        >
          <Lightbulb className="w-4 h-4" />
        </Button>

        {/* Lightning - Quick actions */}
        <Button
          ref={zapRef}
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-gray-100 text-gray-500"
          title="Quick Actions"
          onClick={onQuickActionsClick}
        >
          <Zap className="w-4 h-4" />
        </Button>

        {/* Palette - Style presets */}
        <Button
          ref={paletteRef}
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-gray-100 text-gray-500"
          title="Style Presets"
          onClick={onStylePresetsClick}
        >
          <Palette className="w-4 h-4" />
        </Button>

        {/* Generate Button - Blue circle */}
        <Button
          type="button"
          size="icon"
          className={`h-9 w-9 rounded-full transition-all ${
            canGenerate
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          title="Generate"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 12L8 4M8 4L5 7M8 4L11 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}