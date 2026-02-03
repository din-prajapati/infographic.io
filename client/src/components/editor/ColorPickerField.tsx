import { useState, useRef, useEffect } from "react";
import { Pipette } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

// Helper functions for color conversion
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("").toUpperCase();
}

function rgbToHsb(r: number, g: number, b: number): { h: number; s: number; b: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }

  return { h: h * 360, s: s * 100, b: v * 100 };
}

function hsbToRgb(h: number, s: number, b: number): { r: number; g: number; b: number } {
  h = h / 360;
  s = s / 100;
  b = b / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);

  let r = 0, g = 0, bl = 0;

  switch (i % 6) {
    case 0: r = b; g = t; bl = p; break;
    case 1: r = q; g = b; bl = p; break;
    case 2: r = p; g = b; bl = t; break;
    case 3: r = p; g = q; bl = b; break;
    case 4: r = t; g = p; bl = b; break;
    case 5: r = b; g = p; bl = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(bl * 255),
  };
}

export function ColorPickerField({ label, value, onChange, description }: ColorPickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexValue, setHexValue] = useState(value);
  const initialRgb = hexToRgb(value);
  const initialHsb = rgbToHsb(initialRgb.r, initialRgb.g, initialRgb.b);
  
  const [hue, setHue] = useState(initialHsb.h);
  const [saturation, setSaturation] = useState(initialHsb.s);
  const [brightness, setBrightness] = useState(initialHsb.b);
  const [rgb, setRgb] = useState(initialRgb);
  
  const gradientRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const isDraggingGradient = useRef(false);
  const isDraggingHue = useRef(false);

  // Update all values from HSB
  const updateFromHsb = (h: number, s: number, b: number) => {
    const newRgb = hsbToRgb(h, s, b);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    
    setHue(h);
    setSaturation(s);
    setBrightness(b);
    setRgb(newRgb);
    setHexValue(newHex);
    onChange(newHex);
  };

  const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gradientRef.current) return;
    
    const rect = gradientRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const newSaturation = (x / rect.width) * 100;
    const newBrightness = 100 - (y / rect.height) * 100;
    
    updateFromHsb(hue, newSaturation, newBrightness);
  };

  const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueRef.current) return;
    
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newHue = (x / rect.width) * 360;
    
    updateFromHsb(newHue, saturation, brightness);
  };

  const handleGradientMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingGradient.current = true;
    handleGradientClick(e);
  };

  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingHue.current = true;
    handleHueClick(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingGradient.current && gradientRef.current) {
        const rect = gradientRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        
        const newSaturation = (x / rect.width) * 100;
        const newBrightness = 100 - (y / rect.height) * 100;
        
        updateFromHsb(hue, newSaturation, newBrightness);
      }
      
      if (isDraggingHue.current && hueRef.current) {
        const rect = hueRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const newHue = (x / rect.width) * 360;
        
        updateFromHsb(newHue, saturation, brightness);
      }
    };

    const handleMouseUp = () => {
      isDraggingGradient.current = false;
      isDraggingHue.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [hue, saturation, brightness]);

  const handleHexChange = (newHex: string) => {
    setHexValue(newHex);
    if (/^#[0-9A-F]{6}$/i.test(newHex)) {
      const newRgb = hexToRgb(newHex);
      const newHsb = rgbToHsb(newRgb.r, newRgb.g, newRgb.b);
      setRgb(newRgb);
      setHue(newHsb.h);
      setSaturation(newHsb.s);
      setBrightness(newHsb.b);
      onChange(newHex);
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const numValue = parseInt(value) || 0;
    const newRgb = { ...rgb, [channel]: Math.min(255, Math.max(0, numValue)) };
    setRgb(newRgb);
    
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    const hsb = rgbToHsb(newRgb.r, newRgb.g, newRgb.b);
    
    setHexValue(hex);
    setHue(hsb.h);
    setSaturation(hsb.s);
    setBrightness(hsb.b);
    onChange(hex);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      
      <div className="flex gap-2">
        {/* Color Swatch */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              className="w-10 h-9 rounded-lg border border-gray-200 shadow-sm hover:border-gray-300 transition-colors flex-shrink-0"
              style={{ backgroundColor: hexValue }}
            />
          </PopoverTrigger>
          
          <PopoverContent 
            className="w-80 p-4" 
            align="start"
            side="bottom"
          >
            <div className="space-y-4">
              {/* Gradient Selector */}
              <div 
                ref={gradientRef}
                className="relative w-full h-48 rounded-lg overflow-hidden cursor-crosshair"
                style={{
                  background: `linear-gradient(to bottom, transparent, black),
                               linear-gradient(to right, white, hsl(${hue}, 100%, 50%))`
                }}
                onMouseDown={handleGradientMouseDown}
                onClick={handleGradientClick}
              >
                {/* Selector Dot */}
                <div 
                  className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
                  style={{ 
                    left: `${saturation}%`, 
                    top: `${100 - brightness}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              </div>

              {/* Hue Slider */}
              <div className="flex gap-3 items-center">
                <button className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0">
                  <Pipette className="w-4 h-4" />
                </button>
                
                <div 
                  ref={hueRef}
                  className="flex-1 relative h-10 cursor-pointer"
                  onMouseDown={handleHueMouseDown}
                  onClick={handleHueClick}
                >
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(to right, #ff0000, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)'
                    }}
                  />
                  <div 
                    className="absolute w-6 h-6 bg-gray-900 border-2 border-white rounded-full shadow-lg top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${(hue / 360) * 100}%`, transform: 'translate(-50%, -50%)' }}
                  />
                </div>
              </div>

              {/* RGB Inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Input
                    type="number"
                    value={rgb.r}
                    onChange={(e) => handleRgbChange('r', e.target.value)}
                    min={0}
                    max={255}
                    className="h-9 text-center"
                  />
                  <Label className="text-xs text-center block text-gray-500">R</Label>
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    value={rgb.g}
                    onChange={(e) => handleRgbChange('g', e.target.value)}
                    min={0}
                    max={255}
                    className="h-9 text-center"
                  />
                  <Label className="text-xs text-center block text-gray-500">G</Label>
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    value={rgb.b}
                    onChange={(e) => handleRgbChange('b', e.target.value)}
                    min={0}
                    max={255}
                    className="h-9 text-center"
                  />
                  <Label className="text-xs text-center block text-gray-500">B</Label>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Hex Input */}
        <Input
          type="text"
          value={hexValue}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#111827"
          className="h-9 flex-1"
        />
      </div>

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
