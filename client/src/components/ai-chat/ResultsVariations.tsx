/**
 * Results Variations Component
 * Shows 3 generated variations for user to choose
 */

import { motion, AnimatePresence } from 'motion/react';
import { Check, RefreshCw, Edit, Download } from 'lucide-react';
import { Button } from '../ui/button';

export interface ResultVariation {
  id: string;
  previewUrl: string;
  title: string;
  description: string;
}

interface ResultsVariationsProps {
  variations: ResultVariation[];
  selectedVariationId: string | null;
  onSelectVariation: (id: string) => void;
  onRegenerateAll: () => void;
  onEditVariation: (id: string) => void;
  onUseVariation: (id: string) => void;
}

export function ResultsVariations({
  variations,
  selectedVariationId,
  onSelectVariation,
  onRegenerateAll,
  onEditVariation,
  onUseVariation,
}: ResultsVariationsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 px-4 pb-4"
    >
      {/* Variations Grid */}
      <div className="grid grid-cols-3 gap-3">
        {variations.map((variation, index) => (
          <motion.button
            key={variation.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelectVariation(variation.id)}
            className={`group relative flex flex-col bg-white border-2 rounded-lg overflow-hidden transition-all ${
              selectedVariationId === variation.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {/* Preview Image */}
            <div className="relative aspect-video bg-gray-100 overflow-hidden">
              <img
                src={variation.previewUrl}
                alt={variation.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Check Icon for Selected */}
              {selectedVariationId === variation.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2.5">
              <p className="text-xs font-medium text-gray-900 mb-0.5">{variation.title}</p>
              <p className="text-xs text-gray-500 line-clamp-1">{variation.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Regenerate Button - Below thumbnails */}
      <div className="flex justify-start">
        <Button
          size="sm"
          variant="outline"
          onClick={onRegenerateAll}
          className="h-8 px-3 gap-1.5 text-xs border-gray-300 hover:border-purple-400 hover:bg-purple-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </Button>
      </div>

      {/* Action Buttons - Show when variation selected */}
      {selectedVariationId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 pt-2 border-t border-gray-200"
        >
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => onUseVariation(selectedVariationId)}
          >
            Use This Design
          </Button>
          <Button
            variant="outline"
            onClick={() => onEditVariation(selectedVariationId)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}