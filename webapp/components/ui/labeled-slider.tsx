"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LabeledSliderProps {
  label?: string;
  description?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function LabeledSlider({
  label,
  description,
  showValue = true,
  valueFormatter,
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled,
  className,
}: LabeledSliderProps) {
  const currentValue = value ?? defaultValue;
  const formattedValue = valueFormatter ? valueFormatter(currentValue) : currentValue.toFixed(2);

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showValue && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-mono text-primary">
              {formattedValue}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={(e) => onChange?.(parseFloat(e.target.value))}
        disabled={disabled}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md",
          "[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110",
          "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5",
          "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary",
          "[&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

