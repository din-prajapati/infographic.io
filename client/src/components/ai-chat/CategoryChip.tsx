/**
 * Category Chip Component
 * Individual outlined chip for category selection
 */

import { motion } from 'motion/react';
import { CategoryChip as CategoryChipType } from './types';

interface CategoryChipProps {
  chip: CategoryChipType;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export function CategoryChip({ chip, isSelected, onClick, index }: CategoryChipProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap shrink-0 text-xs ${
        isSelected
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <span className="text-sm">{chip.icon}</span>
      <span>{chip.name}</span>
    </motion.button>
  );
}