/**
 * Style Presets Panel
 * Pre-designed style combinations
 */

import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

interface StylePresetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPresetClick: (preset: StylePreset) => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  colors: string[];
  font: string;
  mood: string;
}

const presets: StylePreset[] = [
  {
    id: 'modern-luxury',
    name: 'Modern Luxury',
    description: 'Black, gold, and white elegance',
    colors: ['#000000', '#D4AF37', '#FFFFFF'],
    font: 'Inter',
    mood: 'Sophisticated',
  },
  {
    id: 'coastal-fresh',
    name: 'Coastal Fresh',
    description: 'Blues and whites for beachfront',
    colors: ['#0077BE', '#87CEEB', '#F0F8FF'],
    font: 'Inter',
    mood: 'Refreshing',
  },
  {
    id: 'warm-traditional',
    name: 'Warm Traditional',
    description: 'Earth tones for classic homes',
    colors: ['#8B4513', '#D2691E', '#F5DEB3'],
    font: 'Inter',
    mood: 'Comfortable',
  },
  {
    id: 'urban-bold',
    name: 'Urban Bold',
    description: 'Vibrant colors for city listings',
    colors: ['#FF6B35', '#004E89', '#F7F7F7'],
    font: 'Inter',
    mood: 'Energetic',
  },
  {
    id: 'minimal-professional',
    name: 'Minimal Professional',
    description: 'Clean grays for agent branding',
    colors: ['#2C3E50', '#95A5A6', '#FFFFFF'],
    font: 'Inter',
    mood: 'Professional',
  },
  {
    id: 'nature-inspired',
    name: 'Nature Inspired',
    description: 'Greens for eco-friendly homes',
    colors: ['#2D5016', '#6B8E23', '#F0FFF0'],
    font: 'Inter',
    mood: 'Peaceful',
  },
];

export function StylePresetsPanel({ isOpen, onClose, onPresetClick, buttonRef }: StylePresetsPanelProps) {
  const [position, setPosition] = useState({ bottom: '8rem', right: '25%' });

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        bottom: `${window.innerHeight - rect.top + 8}px`, // 8px above button
        right: `${window.innerWidth - rect.right}px`, // align with right edge of button
      });
    }
  }, [isOpen, buttonRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ bottom: position.bottom, right: position.right }}
            className="fixed w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[110] max-h-[500px] overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm">Style Presets 🎨</h3>
              <p className="text-xs text-gray-500 mt-1">Choose a design style</p>
            </div>

            <div className="p-2">
              {presets.map((preset, idx) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onPresetClick(preset);
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Color Swatches */}
                  <div className="flex gap-1 shrink-0">
                    {preset.colors.map((color, colorIdx) => (
                      <div
                        key={colorIdx}
                        className="w-6 h-6 rounded border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="text-sm flex items-center justify-between">
                      <span>{preset.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                        {preset.mood}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{preset.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}