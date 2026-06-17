/**
 * Results Variations Component
 * Shows 3 generated variations for user to choose
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, RefreshCw, Edit, ZoomIn, X, Maximize2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  InfographicOrientation,
  previewAspectClass,
} from '../../lib/aiGenerationSettings';

export interface ResultVariation {
  id: string;
  previewUrl: string;
  title: string;
  description: string;
}

interface ResultsVariationsProps {
  variations: ResultVariation[];
  selectedVariationId: string | null;
  orientation?: InfographicOrientation;
  onSelectVariation: (id: string) => void;
  onRegenerateAll: () => void;
  onEditVariation: (id: string) => void;
  onUseVariation: (id: string) => void;
}

export function ResultsVariations({
  variations,
  selectedVariationId,
  orientation = 'landscape',
  onSelectVariation,
  onRegenerateAll,
  onEditVariation,
  onUseVariation,
}: ResultsVariationsProps) {
  const [lightboxVariation, setLightboxVariation] = useState<ResultVariation | null>(null);

  const openLightbox = (variation: ResultVariation) => setLightboxVariation(variation);
  const closeLightbox = () => setLightboxVariation(null);

  return (
    <>
      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxVariation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/85 p-6"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative flex flex-col items-center gap-3 max-w-[85vw] max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute -top-4 -right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>

              {/* Full-size image */}
              <img
                src={lightboxVariation.previewUrl}
                alt={lightboxVariation.title}
                className="max-w-full max-h-[72vh] rounded-xl object-contain shadow-2xl"
              />

              {/* Caption + action buttons */}
              <div className="flex items-center gap-3 w-full">
                <div className="flex-1 text-center">
                  <p className="text-white font-medium text-sm">{lightboxVariation.title}</p>
                  <p className="text-white/60 text-xs mt-0.5">{lightboxVariation.description}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-white text-gray-900 hover:bg-gray-100 font-medium"
                  onClick={() => { onUseVariation(lightboxVariation.id); closeLightbox(); }}
                >
                  Use This Design
                </Button>
                <Button
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10"
                  onClick={() => { onEditVariation(lightboxVariation.id); closeLightbox(); }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Customize
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Variations panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 px-4 pb-4"
      >
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide pt-1">
          {variations.length} design variations — click image to preview full size
        </p>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-3">
          {variations.map((variation, index) => {
            const isSelected = selectedVariationId === variation.id;
            return (
              <motion.div
                key={variation.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`flex flex-col rounded-xl border-2 bg-background overflow-hidden transition-all duration-150 ${
                  isSelected
                    ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]'
                    : 'border-border hover:border-foreground/40 hover:shadow-md'
                }`}
              >
                {/* ── Thumbnail — click opens lightbox ── */}
                <div
                  className={`relative ${previewAspectClass(orientation)} bg-muted cursor-zoom-in`}
                  onClick={() => openLightbox(variation)}
                  title="Click to preview full size"
                >
                  <img
                    src={variation.previewUrl}
                    alt={variation.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Zoom affordance badge — always visible */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 text-white rounded-full px-1.5 py-0.5 pointer-events-none">
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-medium leading-none">Preview</span>
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* ── Card info + select ── */}
                <div
                  className="px-2.5 pt-2 pb-1 cursor-pointer"
                  onClick={() => onSelectVariation(variation.id)}
                >
                  <p className="text-xs font-semibold text-foreground leading-tight">
                    {variation.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {variation.description}
                  </p>
                </div>

                {/* ── Per-card action buttons ── */}
                <div className="px-2 pb-2 pt-1 flex gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={(e) => { e.stopPropagation(); onUseVariation(variation.id); }}
                  >
                    Use This
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={(e) => { e.stopPropagation(); onEditVariation(variation.id); }}
                    title="Customize in editor"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); openLightbox(variation); }}
                    title="Preview full size"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Regenerate */}
        <div className="flex justify-start pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerateAll}
            className="h-8 px-3 gap-1.5 text-xs border-border hover:border-ai-accent/60 hover:bg-ai-accent/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate all
          </Button>
        </div>
      </motion.div>
    </>
  );
}
