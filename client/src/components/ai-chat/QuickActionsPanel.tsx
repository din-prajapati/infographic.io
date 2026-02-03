/**
 * Quick Actions Panel
 * Common actions for real estate templates
 */

import { motion, AnimatePresence } from 'motion/react';
import { Home, DollarSign, Calendar, Award, MapPin, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QuickActionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onActionClick: (action: string) => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

const actions = [
  {
    icon: Home,
    label: 'Property Details',
    description: 'Add property information',
    action: 'property-details',
  },
  {
    icon: DollarSign,
    label: 'Pricing',
    description: 'Set property price',
    action: 'pricing',
  },
  {
    icon: Calendar,
    label: 'Availability',
    description: 'Set availability dates',
    action: 'availability',
  },
  {
    icon: Award,
    label: 'Amenities',
    description: 'Add property amenities',
    action: 'amenities',
  },
  {
    icon: MapPin,
    label: 'Location',
    description: 'Add property location',
    action: 'location',
  },
  {
    icon: Users,
    label: 'Contact Information',
    description: 'Add contact details',
    action: 'contact-info',
  },
];

export function QuickActionsPanel({ isOpen, onClose, onActionClick, buttonRef }: QuickActionsPanelProps) {
  const [position, setPosition] = useState({ bottom: '8rem', left: '50%' });

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        bottom: `${window.innerHeight - rect.top + 8}px`, // 8px above button
        left: `${rect.left + rect.width / 2}px`, // center on button
      });
    }
  }, [isOpen, buttonRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[100]"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ bottom: position.bottom, left: position.left }}
            className="fixed -translate-x-1/2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[110]"
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm">Quick Actions ⚡</h3>
              <p className="text-xs text-gray-500 mt-1">Instant AI enhancements</p>
            </div>

            <div className="p-2">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onActionClick(action.action);
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <action.icon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm">{action.label}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}