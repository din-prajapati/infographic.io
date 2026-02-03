/**
 * Chip Tag Component
 * Blue tag that appears inside input field when chip is selected
 */

import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { CategoryChip } from './types';

interface ChipTagProps {
  chip: CategoryChip;
  onRemove: () => void;
}

export function ChipTag({ chip, onRemove }: ChipTagProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="inline-flex items-center gap-1.5 h-8 px-3 bg-blue-50 border border-blue-300 rounded-full text-sm whitespace-nowrap"
    >
      <span>{chip.icon}</span>
      <span className="text-blue-700">{chip.name}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
        aria-label="Remove filter"
      >
        <X className="w-3 h-3 text-blue-600" />
      </button>
    </motion.div>
  );
}
