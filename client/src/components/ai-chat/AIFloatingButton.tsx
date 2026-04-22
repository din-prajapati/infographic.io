/**
 * AI Floating Button Component
 * Gemini-style floating button that triggers chat box
 */

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface AIFloatingButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export function AIFloatingButton({ onClick, isActive }: AIFloatingButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 h-12 rounded-full shadow-lg
        transition-all duration-300 font-medium text-sm
        ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-primary/30'
            : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground border border-border'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Sparkles className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
      <span>AI Templates</span>
    </motion.button>
  );
}
