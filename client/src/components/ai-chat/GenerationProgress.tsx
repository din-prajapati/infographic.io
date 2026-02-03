/**
 * Generation Progress Component
 * Shows AI generation steps with progress
 */

import { motion } from 'motion/react';
import { Check, Loader2 } from 'lucide-react';

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface GenerationProgressProps {
  steps: GenerationStep[];
  currentStep: number;
}

export function GenerationProgress({ steps, currentStep }: GenerationProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pb-4"
    >
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
          <h3 className="text-sm text-purple-900">Generating your infographic...</h3>
        </div>

        <div className="space-y-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-3">
              {/* Icon */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  step.status === 'completed'
                    ? 'bg-green-500'
                    : step.status === 'in-progress'
                    ? 'bg-purple-500'
                    : 'bg-gray-200'
                }`}
              >
                {step.status === 'completed' ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : step.status === 'in-progress' ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <span className="text-xs text-gray-400">{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-sm flex-1 ${
                  step.status === 'completed'
                    ? 'text-green-700'
                    : step.status === 'in-progress'
                    ? 'text-purple-700'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>

              {/* Progress Bar */}
              {step.status === 'in-progress' && (
                <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                    className="h-full bg-purple-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            />
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
