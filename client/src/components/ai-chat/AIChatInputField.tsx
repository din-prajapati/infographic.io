/**
 * AI Chat Input Field
 * Textarea + bottom icon bar (attach, chips, layout/quality toggles, utility icons, send)
 */

import { CategoryChip } from './types';
import { AIChatIconBar } from './AIChatIconBar';
import { InfographicOrientation, ImageQualityModel } from '../../lib/aiGenerationSettings';

interface AIChatInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  selectedChips: CategoryChip[];
  onRemoveChip: (chipId: string) => void;
  isGenerating: boolean;
  onSuggestionsClick: () => void;
  onUploadClick: () => void;
  lightbulbRef?: React.RefObject<HTMLButtonElement>;
  paperclipRef?: React.RefObject<HTMLButtonElement>;
  orientation: InfographicOrientation;
  qualityModel: ImageQualityModel;
  onOrientationChange: (o: InfographicOrientation) => void;
  onQualityModelChange: (q: ImageQualityModel) => void;
}

export function AIChatInputField({
  value,
  onChange,
  onGenerate,
  selectedChips,
  onRemoveChip,
  isGenerating,
  onSuggestionsClick,
  onUploadClick,
  lightbulbRef,
  paperclipRef,
  orientation,
  qualityModel,
  onOrientationChange,
  onQualityModelChange,
}: AIChatInputFieldProps) {
  const canGenerate = (value.trim().length > 0 || selectedChips.length > 0) && !isGenerating;

  return (
    <div className="px-4 pt-3 pb-3">
      {/* Textarea + icon bar in one bordered container */}
      <div className="px-4 py-3 border border-border rounded-xl focus-within:border-foreground/50 transition-colors bg-background">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canGenerate) {
              e.preventDefault();
              onGenerate();
            }
          }}
          placeholder={
            selectedChips.length > 0
              ? 'Describe what you want to create...'
              : 'Ask AI to create a stunning real estate infographic...'
          }
          className="w-full min-h-[96px] outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none bg-transparent"
          disabled={isGenerating}
          rows={4}
        />

        <AIChatIconBar
          onGenerate={onGenerate}
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          selectedChips={selectedChips}
          onRemoveChip={onRemoveChip}
          onSuggestionsClick={onSuggestionsClick}
          onUploadClick={onUploadClick}
          lightbulbRef={lightbulbRef}
          paperclipRef={paperclipRef}
          orientation={orientation}
          qualityModel={qualityModel}
          onOrientationChange={onOrientationChange}
          onQualityModelChange={onQualityModelChange}
          settingsDisabled={isGenerating}
        />
      </div>
    </div>
  );
}
