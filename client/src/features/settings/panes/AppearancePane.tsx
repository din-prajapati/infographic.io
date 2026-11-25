import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import { SettingRow, SettingSection } from '../SettingsPrimitives';

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

/** Settings → Appearance. Theme only (spec §9): applies immediately, shared with the top-bar toggle. */
export default function AppearancePane() {
  const { theme, setTheme } = useTheme();
  return (
    <SettingSection title="Theme">
      <SettingRow id="theme" stacked title="Colour theme" description="System follows your device’s light or dark setting.">
        <div className="st-theme-options" role="radiogroup" aria-label="Colour theme">
          {THEMES.map(option => {
            const Icon = option.icon;
            return (
              <label key={option.value} className="st-theme-option" data-checked={theme === option.value || undefined}>
                <input type="radio" name="st-theme" value={option.value} checked={theme === option.value} onChange={() => setTheme(option.value)} />
                <span className={`st-theme-preview st-theme-preview-${option.value}`} aria-hidden="true"><span /><span /><span /></span>
                <span className="st-theme-label"><Icon aria-hidden="true" />{option.label}</span>
              </label>
            );
          })}
        </div>
      </SettingRow>
    </SettingSection>
  );
}
