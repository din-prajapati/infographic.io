/**
 * AI Chat Icon Bar
 * Attach + chips | Layout toggles | Quality toggles | Utility icons | Send
 */

import { Lightbulb, Paperclip, Monitor, Smartphone, Square, Sparkles, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { CategoryChip } from './types';
import { ChipTag } from './ChipTag';
import { AnimatePresence } from 'motion/react';
import { InfographicOrientation, ImageQualityModel } from '../../lib/aiGenerationSettings';

const ORIENTATION_ICONS = {
  landscape: Monitor,
  portrait: Smartphone,
  square: Square,
} as const;

const ORIENTATION_LABELS: Record<InfographicOrientation, string> = {
  landscape: 'Landscape',
  portrait: 'Portrait',
  square: 'Square',
};

interface AIChatIconBarProps {
  onGenerate: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
  selectedChips: CategoryChip[];
  onRemoveChip: (chipId: string) => void;
  onSuggestionsClick: () => void;
  onUploadClick: () => void;
  lightbulbRef?: React.RefObject<HTMLButtonElement>;
  paperclipRef?: React.RefObject<HTMLButtonElement>;
  // Layout + Quality controls, inline in the icon bar
  orientation: InfographicOrientation;
  qualityModel: ImageQualityModel;
  onOrientationChange: (o: InfographicOrientation) => void;
  onQualityModelChange: (q: ImageQualityModel) => void;
  settingsDisabled?: boolean;
}

export function AIChatIconBar({
  onGenerate,
  canGenerate,
  isGenerating,
  selectedChips,
  onRemoveChip,
  onSuggestionsClick,
  onUploadClick,
  lightbulbRef,
  paperclipRef,
  orientation,
  qualityModel,
  onOrientationChange,
  onQualityModelChange,
  settingsDisabled = false,
}: AIChatIconBarProps) {
  const orientations: InfographicOrientation[] = ['landscape', 'portrait', 'square'];

  return (
    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border -mx-1 flex-wrap">
      {/* ── Attach + selected chips ── */}
      <Button
        ref={paperclipRef}
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 hover:bg-muted text-muted-foreground"
        title="Attach file"
        onClick={onUploadClick}
      >
        <Paperclip className="w-4 h-4" />
      </Button>

      {selectedChips.length > 0 && (
        <div className="flex items-center gap-1.5">
          <AnimatePresence>
            {selectedChips.map((chip) => (
              <ChipTag key={chip.id} chip={chip} onRemove={() => onRemoveChip(chip.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Divider ── */}
      <div className="w-px h-5 bg-border mx-0.5 shrink-0" />

      {/* ── Layout toggles (each has its own colour) ── */}
      <div className="flex items-center gap-0.5" title="Layout">
        {(
          [
            { id: 'landscape', activeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',   inactiveColor: 'text-blue-400/50 hover:bg-blue-500/10 hover:text-blue-500' },
            { id: 'portrait',  activeColor: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', inactiveColor: 'text-violet-400/50 hover:bg-violet-500/10 hover:text-violet-500' },
            { id: 'square',    activeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', inactiveColor: 'text-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-500' },
          ] as const
        ).map(({ id, activeColor, inactiveColor }) => {
          const Icon = ORIENTATION_ICONS[id];
          const active = orientation === id;
          return (
            <button
              key={id}
              type="button"
              disabled={settingsDisabled}
              title={ORIENTATION_LABELS[id]}
              onClick={() => onOrientationChange(id)}
              className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${
                active ? activeColor : inactiveColor
              } ${settingsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>

      {/* ── Quality toggles ── */}
      <div className="flex items-center gap-0.5" title="Quality">
        {([
          { id: 'ideogram-turbo', label: 'Standard', Icon: Sparkles, activeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', inactiveColor: 'text-amber-400/50 hover:bg-amber-500/10 hover:text-amber-500' },
          { id: 'ideogram-v2',    label: 'Premium',  Icon: Crown,    activeColor: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400', inactiveColor: 'text-yellow-400/50 hover:bg-yellow-500/10 hover:text-yellow-500' },
        ] as const).map(({ id, label, Icon, activeColor, inactiveColor }) => {
          const active = qualityModel === id;
          return (
            <button
              key={id}
              type="button"
              disabled={settingsDisabled}
              title={label}
              onClick={() => onQualityModelChange(id)}
              className={`h-7 flex items-center gap-1 px-2 rounded-md text-[11px] font-medium transition-colors ${
                active ? activeColor : inactiveColor
              } ${settingsDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Spacer ── */}
      <div className="flex-grow" />

      {/* ── Utility icons ── */}
      <div className="flex items-center gap-1">
        <Button
          ref={lightbulbRef}
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted text-muted-foreground"
          title="AI Suggestions"
          onClick={onSuggestionsClick}
        >
          <Lightbulb className="w-4 h-4" />
        </Button>

        {/* Send */}
        <Button
          type="button"
          size="icon"
          className={`h-9 w-9 rounded-full transition-all ${
            canGenerate
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'bg-muted text-muted-foreground/50 cursor-not-allowed'
          }`}
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          title="Generate"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12L8 4M8 4L5 7M8 4L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
