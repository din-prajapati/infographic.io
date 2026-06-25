/**
 * Layout + quality controls shown above the AI chat input.
 */

import { Monitor, Smartphone, Square, Sparkles, Crown } from 'lucide-react';
import {
  InfographicOrientation,
  ImageQualityModel,
  ORIENTATION_OPTIONS,
  QUALITY_OPTIONS,
} from '../../lib/aiGenerationSettings';

interface GenerationSettingsBarProps {
  orientation: InfographicOrientation;
  qualityModel: ImageQualityModel;
  onOrientationChange: (orientation: InfographicOrientation) => void;
  onQualityModelChange: (model: ImageQualityModel) => void;
  disabled?: boolean;
}

const ORIENTATION_ICONS = {
  landscape: Monitor,
  portrait: Smartphone,
  square: Square,
} as const;

export function GenerationSettingsBar({
  orientation,
  qualityModel,
  onOrientationChange,
  onQualityModelChange,
  disabled = false,
}: GenerationSettingsBarProps) {
  return (
    <div className="px-4 py-2 border-b border-border bg-muted/30 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide shrink-0">
          Layout
        </span>
        <div className="flex gap-1 flex-wrap">
          {ORIENTATION_OPTIONS.map((option) => {
            const Icon = ORIENTATION_ICONS[option.id];
            const isActive = orientation === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                title={option.description}
                onClick={() => onOrientationChange(option.id)}
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-foreground/30'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide shrink-0">
          Quality
        </span>
        <div className="flex gap-1 flex-wrap">
          {QUALITY_OPTIONS.map((option) => {
            const isActive = qualityModel === option.id;
            const Icon = option.id === 'ideogram-v2' ? Crown : Sparkles;
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                title={option.description}
                onClick={() => onQualityModelChange(option.id)}
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:border-foreground/30'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
