/**
 * Template Category View Component
 * Expandable category cards with template lists
 */

import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { CategoryInfo, Template, TemplateCategory } from './types';
import { getTemplatesByCategory } from './templateData';

interface TemplateCategoryViewProps {
  categories: CategoryInfo[];
  onTemplateSelect: (template: Template) => void;
}

export function TemplateCategoryView({
  categories,
  onTemplateSelect,
}: TemplateCategoryViewProps) {
  const [expandedCategory, setExpandedCategory] = useState<TemplateCategory | null>(null);

  const toggleCategory = (categoryId: TemplateCategory) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="px-4 pb-4 max-h-64 overflow-y-auto">
      <div className="space-y-2">
        {categories.map((category, index) => {
          const isExpanded = expandedCategory === category.id;
          const categoryTemplates = getTemplatesByCategory(category.id);

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="text-gray-900">{category.name}</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {category.templateCount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>

              {/* Template List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-2 space-y-1 bg-gray-50">
                      {categoryTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => onTemplateSelect(template)}
                          className="w-full flex items-center gap-3 p-2 rounded hover:bg-white transition-colors text-left"
                        >
                          <span className="text-base">{template.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900">{template.name}</div>
                            <div className="text-xs text-gray-500 truncate">{template.description}</div>
                          </div>
                          {template.isPopular && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full shrink-0">
                              Popular
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
