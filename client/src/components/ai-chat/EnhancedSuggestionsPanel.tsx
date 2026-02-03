/**
 * Enhanced Suggestions Panel Component
 * Visual cards with property-specific suggestions
 */

import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, TrendingUp, Home, Building2, Crown, Palette, Layout, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

interface SuggestionCard {
  id: string;
  title: string;
  description: string;
  category: 'design' | 'content' | 'layout';
  icon: React.ReactNode;
  imageUrl?: string;
  tags?: string[];
}

interface EnhancedSuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuggestionClick: (suggestion: string) => void;
  propertyType?: 'residential' | 'commercial' | 'luxury' | 'land';
  priceRange?: 'low' | 'mid' | 'high' | 'luxury';
}

export function EnhancedSuggestionsPanel({
  isOpen,
  onClose,
  onSuggestionClick,
  propertyType = 'residential',
  priceRange = 'mid',
}: EnhancedSuggestionsPanelProps) {
  
  // Generate property-specific suggestions
  const getSuggestions = (): SuggestionCard[] => {
    const suggestions: SuggestionCard[] = [];

    // Luxury property suggestions
    if (propertyType === 'luxury' || priceRange === 'luxury') {
      suggestions.push(
        {
          id: 'lux-1',
          title: 'Elegant Gold & Black Theme',
          description: 'Sophisticated color palette with premium typography',
          category: 'design',
          icon: <Crown className="w-5 h-5" />,
          imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=300',
          tags: ['Luxury', 'Premium'],
        },
        {
          id: 'lux-2',
          title: 'Highlight Premium Amenities',
          description: 'Showcase spa, gym, concierge, and exclusive features',
          category: 'content',
          icon: <Sparkles className="w-5 h-5" />,
          imageUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=300',
          tags: ['Amenities', 'Features'],
        },
        {
          id: 'lux-3',
          title: 'Full-Page Hero Layout',
          description: 'Dramatic full-bleed images with minimal text overlay',
          category: 'layout',
          icon: <Layout className="w-5 h-5" />,
          imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=300',
          tags: ['Hero', 'Dramatic'],
        }
      );
    }

    // Residential property suggestions
    if (propertyType === 'residential') {
      suggestions.push(
        {
          id: 'res-1',
          title: 'Family-Friendly Layout',
          description: 'Warm colors with bedroom/bathroom highlights',
          category: 'design',
          icon: <Home className="w-5 h-5" />,
          imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300',
          tags: ['Family', 'Cozy'],
        },
        {
          id: 'res-2',
          title: 'School District & Safety',
          description: 'Emphasize nearby schools, parks, and community features',
          category: 'content',
          icon: <FileText className="w-5 h-5" />,
          imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=300',
          tags: ['Community', 'Education'],
        },
        {
          id: 'res-3',
          title: 'Floor Plan Showcase',
          description: 'Side-by-side layout with floor plan and room details',
          category: 'layout',
          icon: <Layout className="w-5 h-5" />,
          imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300',
          tags: ['Floor Plan', 'Details'],
        }
      );
    }

    // Commercial property suggestions
    if (propertyType === 'commercial') {
      suggestions.push(
        {
          id: 'com-1',
          title: 'Professional Corporate Style',
          description: 'Clean lines, blue tones, data-driven design',
          category: 'design',
          icon: <Building2 className="w-5 h-5" />,
          imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300',
          tags: ['Corporate', 'Professional'],
        },
        {
          id: 'com-2',
          title: 'ROI & Investment Data',
          description: 'Include cap rate, cash flow projections, and analytics',
          category: 'content',
          icon: <TrendingUp className="w-5 h-5" />,
          imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300',
          tags: ['ROI', 'Analytics'],
        },
        {
          id: 'com-3',
          title: 'Grid-Based Info Layout',
          description: 'Structured data presentation with clear sections',
          category: 'layout',
          icon: <Layout className="w-5 h-5" />,
          imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300',
          tags: ['Grid', 'Structured'],
        }
      );
    }

    // General suggestions for all types
    suggestions.push(
      {
        id: 'gen-1',
        title: 'Modern Minimalist',
        description: 'Clean white space with bold typography',
        category: 'design',
        icon: <Palette className="w-5 h-5" />,
        imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300',
        tags: ['Minimal', 'Modern'],
      },
      {
        id: 'gen-2',
        title: 'Virtual Tour Integration',
        description: 'Add QR code and virtual tour information',
        category: 'content',
        icon: <Sparkles className="w-5 h-5" />,
        imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300',
        tags: ['Virtual Tour', 'Tech'],
      },
      {
        id: 'gen-3',
        title: 'Split-Screen Design',
        description: 'Half image, half details for balanced presentation',
        category: 'layout',
        icon: <Layout className="w-5 h-5" />,
        imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300',
        tags: ['Split', 'Balanced'],
      }
    );

    return suggestions.slice(0, 9); // Limit to 9 suggestions (3x3 grid)
  };

  const suggestions = getSuggestions();

  const designSuggestions = suggestions.filter(s => s.category === 'design');
  const contentSuggestions = suggestions.filter(s => s.category === 'content');
  const layoutSuggestions = suggestions.filter(s => s.category === 'layout');

  const handleCardClick = (card: SuggestionCard) => {
    onSuggestionClick(card.title);
    onClose();
  };

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] max-h-[80vh] bg-white rounded-2xl shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900">AI Design Suggestions</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Tailored for{' '}
                  <span className="text-gray-900 font-medium">{propertyType}</span> properties
                  {priceRange && (
                    <> in the <span className="text-gray-900 font-medium">{priceRange}</span> range</>
                  )}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Design Ideas */}
                {designSuggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-4 h-4 text-purple-600" />
                      <h4 className="font-medium text-gray-900">Design Ideas</h4>
                      <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-0">
                        {designSuggestions.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {designSuggestions.map((card) => (
                        <SuggestionCardItem
                          key={card.id}
                          card={card}
                          onClick={() => handleCardClick(card)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Suggestions */}
                {contentSuggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900">Content Suggestions</h4>
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-0">
                        {contentSuggestions.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {contentSuggestions.map((card) => (
                        <SuggestionCardItem
                          key={card.id}
                          card={card}
                          onClick={() => handleCardClick(card)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Layout Options */}
                {layoutSuggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Layout className="w-4 h-4 text-green-600" />
                      <h4 className="font-medium text-gray-900">Layout Options</h4>
                      <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-0">
                        {layoutSuggestions.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {layoutSuggestions.map((card) => (
                        <SuggestionCardItem
                          key={card.id}
                          card={card}
                          onClick={() => handleCardClick(card)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Suggestion Card Item Component
interface SuggestionCardItemProps {
  card: SuggestionCard;
  onClick: () => void;
}

function SuggestionCardItem({ card, onClick }: SuggestionCardItemProps) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all hover:shadow-md text-left bg-white"
    >
      {/* Image */}
      {card.imageUrl && (
        <div className="aspect-video overflow-hidden bg-gray-100">
          <img
            src={card.imageUrl}
            alt={card.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 text-white">
            {card.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-medium text-gray-900 line-clamp-1">{card.title}</h5>
          </div>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{card.description}</p>
        
        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-xl pointer-events-none" />
    </button>
  );
}
