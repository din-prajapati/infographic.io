/**
 * Template Quick Actions Component
 * Horizontal scrollable chips for popular templates + "All Templates"
 */

import { motion } from 'motion/react';
import { Template } from './types';
import { LayoutGrid } from 'lucide-react';

interface TemplateQuickActionsProps {
  popularTemplates: Template[];
  onTemplateSelect: (template: Template) => void;
  onShowAllClick: () => void;
}

export function TemplateQuickActions({
  popularTemplates,
  onTemplateSelect,
  onShowAllClick,
}: TemplateQuickActionsProps) {
  return (
    <div className="px-4 pt-0 pb-4">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Popular Template Chips */}
        {popularTemplates.map((template, index) => (
          <motion.button
            key={template.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            onClick={() => onTemplateSelect(template)}
            className="flex items-center gap-2 px-4 h-9 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors whitespace-nowrap shrink-0"
          >
            <span className="text-sm">{template.emoji}</span>
            <span className="text-sm">{template.name}</span>
          </motion.button>
        ))}

        {/* All Templates Button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: popularTemplates.length * 0.05, duration: 0.3 }}
          onClick={onShowAllClick}
          className="flex items-center gap-2 px-4 h-9 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-colors whitespace-nowrap shrink-0"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="text-sm">All Templates</span>
        </motion.button>
      </div>
    </div>
  );
}