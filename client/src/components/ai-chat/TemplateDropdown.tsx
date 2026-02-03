/**
 * Template Dropdown Component
 * Simple dropdown showing 4 categories (compact view)
 */

import { motion } from 'motion/react';
import { CategoryInfo, TemplateCategory } from './types';

interface TemplateDropdownProps {
  categories: CategoryInfo[];
  onCategorySelect: (category: TemplateCategory) => void;
}

export function TemplateDropdown({
  categories,
  onCategorySelect,
}: TemplateDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="absolute left-4 bottom-full mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10"
    >
      <div className="p-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className="w-full flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors text-left"
          >
            <span className="text-xl">{category.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900">{category.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {category.templateCount}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{category.description}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
