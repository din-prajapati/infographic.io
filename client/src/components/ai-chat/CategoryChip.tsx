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
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap shrink-0 text-xs border-border bg-background text-muted-foreground hover:border-foreground/30 hover:bg-muted hover:text-foreground"
      style={
        isSelected
          ? {
              borderColor: chip.color,
              backgroundColor: chip.surfaceColor,
              color: chip.color,
            }
          : undefined
      }
      data-chip-id={chip.id}
      data-selected={isSelected}
    >
      <span className="text-sm leading-none">{chip.icon}</span>
      <span>{chip.name}</span>
    </motion.button>
  );
}