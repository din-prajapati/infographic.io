// Adjustments Panel - Canva-style slide-out panel from LEFT side

import React, { useEffect, useState } from "react";
import { ChevronLeft, RotateCcw, Sun, Contrast, Droplet, Sliders } from "lucide-react";
import { usePanelState } from "../../lib/panelState";
import { useCanvasStore } from "../../hooks/useCanvasStore";
import { ImageElement } from "../../lib/canvasTypes";

interface AdjustmentsPanelProps {
  element: ImageElement | null;
}

// Canva-style slider component with purple/gray theme
function AdjustmentSlider({
  icon: Icon,
  label,
  value,
  onChange,
  onInputChange,
  gradientFrom,
  gradientTo,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  onChange: (value: number) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  gradientFrom: string;
  gradientTo: string;
}) {
  // Calculate percentage (0-100 for slider position)
  const percentage = ((value + 100) / 200) * 100;
  
  // Purple color for filled portion (vibrant medium-light purple matching image)
  const purpleColor = '#A855F7'; // vibrant medium purple
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
            <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={2} />
          </div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        </div>
        <input
          type="number"
          value={value}
          onChange={onInputChange}
          className="w-16 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center text-sm font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-600 focus:border-violet-400 dark:focus:border-violet-600 transition-all shadow-sm"
          min={-100}
          max={100}
        />
      </div>
      
      {/* Slider Track - Beautiful modern design */}
      <div className="relative h-10 flex items-center w-full group">
        {/* Background Track - Right portion (light gray) - full width with subtle shadow */}
        <div 
          className="absolute inset-x-0 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors"
          style={{
            height: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
          }}
        />
        
        {/* Colored Fill - Left portion (purple) with gradient */}
        <div 
          className="absolute rounded-full transition-all duration-200 ease-out z-10"
          style={{ 
            width: `${percentage}%`,
            height: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: `linear-gradient(to right, ${purpleColor}, ${purpleColor}dd)`,
            boxShadow: '0 1px 3px rgba(168, 85, 247, 0.3)',
          }}
        />
        
        {/* Native Range Input - invisible but interactive */}
        <input
          type="range"
          min={-100}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-x-0 w-full h-10 opacity-0 cursor-pointer z-20"
        />
        
        {/* Custom Thumb - Beautiful purple circle with shadow and hover effect */}
        <div 
          className="absolute pointer-events-none transition-all duration-200 ease-out z-30"
          style={{ 
            left: `calc(${percentage}% - 10px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
          }}
        >
          {/* Outer glow effect */}
          <div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: `radial-gradient(circle, ${purpleColor}40, transparent 70%)`,
              transform: 'scale(1.5)',
            }}
          />
          {/* Outer ring (white border for contrast) */}
          <div 
            className="absolute inset-0 rounded-full border-2 transition-all group-hover:scale-110"
            style={{
              borderColor: '#FFFFFF',
              backgroundColor: 'transparent',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(168, 85, 247, 0.3)',
            }}
          />
          {/* Inner circle (purple with gradient) */}
          <div 
            className="absolute rounded-full transition-all group-hover:scale-110"
            style={{
              width: '12px',
              height: '12px',
              background: `radial-gradient(circle at 30% 30%, ${purpleColor}, ${purpleColor}dd)`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function AdjustmentsPanel({ element }: AdjustmentsPanelProps) {
  const { activePanel, closePanel } = usePanelState();
  const updateElement = useCanvasStore((state) => state.updateElement);

  const isOpen = activePanel === 'adjustments' && !!element;
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close panel if element is removed
  useEffect(() => {
    if (!element && activePanel === 'adjustments') {
      closePanel();
    }
  }, [element, activePanel, closePanel]);

  const handleBrightnessChange = (value: number) => {
    if (!element) return;
    updateElement(element.id, {
      filters: { ...element.filters, brightness: value + 100 },
    });
  };

  const handleContrastChange = (value: number) => {
    if (!element) return;
    updateElement(element.id, {
      filters: { ...element.filters, contrast: value + 100 },
    });
  };

  const handleSaturationChange = (value: number) => {
    if (!element) return;
    updateElement(element.id, {
      filters: { ...element.filters, saturation: value + 100 },
    });
  };

  const handleBrightnessInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!element) return;
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(-100, Math.min(100, value));
    updateElement(element.id, {
      filters: { ...element.filters, brightness: 100 + clampedValue },
    });
  };

  const handleContrastInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!element) return;
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(-100, Math.min(100, value));
    updateElement(element.id, {
      filters: { ...element.filters, contrast: 100 + clampedValue },
    });
  };

  const handleSaturationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!element) return;
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(-100, Math.min(100, value));
    updateElement(element.id, {
      filters: { ...element.filters, saturation: 100 + clampedValue },
    });
  };

  const handleReset = () => {
    if (!element) return;
    updateElement(element.id, {
      filters: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
      },
    });
  };

  // Calculate display values (centered at 0)
  const brightnessValue = element?.filters.brightness ? element.filters.brightness - 100 : 0;
  const contrastValue = element?.filters.contrast ? element.filters.contrast - 100 : 0;
  const saturationValue = element?.filters.saturation ? element.filters.saturation - 100 : 0;

  // Check if any value has changed from default
  const hasChanges = brightnessValue !== 0 || contrastValue !== 0 || saturationValue !== 0;

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/10 z-[9997] transition-opacity duration-200 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closePanel}
      />
      
      {/* Panel - slides from LEFT */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-[9998] flex flex-col transition-transform duration-300 ${
          isAnimating ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          transitionTimingFunction: isAnimating 
            ? 'cubic-bezier(0.16, 1, 0.3, 1)' 
            : 'ease-in',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <button
              onClick={closePanel}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title="Close"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <Sliders className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Adjustments</h2>
          </div>
          <div className="flex items-center gap-1">
            {/* Reset Button */}
            {hasChanges && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Reset All"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {element && (
          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="w-full h-32 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
              <img
                src={element.src}
                alt="Preview"
                className="w-full h-full object-contain"
                style={{
                  filter: `brightness(${element.filters.brightness}%) contrast(${element.filters.contrast}%) saturate(${element.filters.saturation}%)`,
                }}
              />
            </div>
          </div>
        )}

        {/* Adjustments List */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Brightness */}
          <AdjustmentSlider
            icon={Sun}
            label="Brightness"
            value={brightnessValue}
            onChange={handleBrightnessChange}
            onInputChange={handleBrightnessInputChange}
            gradientFrom="#fbbf24"
            gradientTo="#f97316"
          />

          {/* Contrast */}
          <AdjustmentSlider
            icon={Contrast}
            label="Contrast"
            value={contrastValue}
            onChange={handleContrastChange}
            onInputChange={handleContrastInputChange}
            gradientFrom="#6b7280"
            gradientTo="#374151"
          />

          {/* Saturation */}
          <AdjustmentSlider
            icon={Droplet}
            label="Saturation"
            value={saturationValue}
            onChange={handleSaturationChange}
            onInputChange={handleSaturationInputChange}
            gradientFrom="#22d3ee"
            gradientTo="#3b82f6"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Drag sliders to adjust image
          </p>
        </div>
      </div>
    </>
  );
}
