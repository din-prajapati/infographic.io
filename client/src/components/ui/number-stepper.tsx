/**
 * NumberStepper — compact stepper for small integer values (Beds, Baths, etc.)
 * Pattern: [−] [ value ] [+]
 * Fully theme-aware, keyboard accessible, supports min/max clamps.
 */

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "./utils";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  className,
  disabled = false,
}: NumberStepperProps) {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  const decrement = () => {
    if (canDecrement) onChange(Math.max(min, value - step));
  };

  const increment = () => {
    if (canIncrement) onChange(Math.min(max, value + step));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center h-9 rounded-lg border border-border bg-input-background overflow-hidden",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      {/* Decrement */}
      <button
        type="button"
        onClick={decrement}
        disabled={!canDecrement}
        aria-label="Decrease"
        className={cn(
          "w-8 h-full flex items-center justify-center transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-accent",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "border-r border-border",
        )}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      {/* Value input */}
      <input
        type="number"
        value={value}
        onChange={handleInput}
        min={min}
        max={max}
        disabled={disabled}
        className={cn(
          "w-10 h-full text-center text-sm font-medium bg-transparent",
          "text-foreground focus:outline-none focus:ring-0",
          // hide native spinner arrows
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
        )}
      />

      {/* Increment */}
      <button
        type="button"
        onClick={increment}
        disabled={!canIncrement}
        aria-label="Increase"
        className={cn(
          "w-8 h-full flex items-center justify-center transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-accent",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "border-l border-border",
        )}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
