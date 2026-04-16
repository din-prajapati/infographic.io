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
        transition-all duration-300
        ${
          isActive
            ? 'bg-foreground text-background'
            : 'bg-background text-foreground hover:bg-muted border border-border'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Sparkles className="w-5 h-5" />
      <span className="font-medium">AI Templates</span>
    </motion.button>
  );
}
