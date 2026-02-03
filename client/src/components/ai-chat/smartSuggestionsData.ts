/**
 * Smart Suggestions Data
 * Property-aware suggestions based on property type and price range
 */

import { SmartSuggestion } from './types';

export const smartSuggestionsData: SmartSuggestion[] = [
  // Luxury property suggestions
  {
    id: 'lux-1',
    text: 'Highlight premium amenities',
    propertyTypes: ['luxury'],
    priceRanges: ['luxury', 'high'],
  },
  {
    id: 'lux-2',
    text: 'Showcase luxury features',
    propertyTypes: ['luxury'],
    priceRanges: ['luxury'],
  },
  {
    id: 'lux-3',
    text: 'Add aerial views',
    propertyTypes: ['luxury', 'residential'],
    priceRanges: ['luxury', 'high'],
  },
  {
    id: 'lux-4',
    text: 'Elegant gold & black theme',
    propertyTypes: ['luxury'],
    priceRanges: ['luxury'],
  },
  
  // Residential property suggestions
  {
    id: 'res-1',
    text: 'Family-friendly features',
    propertyTypes: ['residential'],
    priceRanges: ['low', 'mid', 'high'],
  },
  {
    id: 'res-2',
    text: 'School district info',
    propertyTypes: ['residential'],
    priceRanges: ['low', 'mid', 'high'],
  },
  {
    id: 'res-3',
    text: 'Neighborhood highlights',
    propertyTypes: ['residential'],
    priceRanges: ['low', 'mid', 'high'],
  },
  {
    id: 'res-4',
    text: 'Show floor plan',
    propertyTypes: ['residential'],
    priceRanges: ['mid', 'high'],
  },

  // Commercial property suggestions
  {
    id: 'com-1',
    text: 'ROI projections',
    propertyTypes: ['commercial'],
    priceRanges: ['mid', 'high', 'luxury'],
  },
  {
    id: 'com-2',
    text: 'Zoning details',
    propertyTypes: ['commercial', 'land'],
  },
  {
    id: 'com-3',
    text: 'Traffic & accessibility data',
    propertyTypes: ['commercial'],
  },
  {
    id: 'com-4',
    text: 'Professional corporate style',
    propertyTypes: ['commercial'],
  },

  // Land property suggestions
  {
    id: 'land-1',
    text: 'Development potential',
    propertyTypes: ['land'],
  },
  {
    id: 'land-2',
    text: 'Topography & utilities',
    propertyTypes: ['land'],
  },
  {
    id: 'land-3',
    text: 'Location advantages',
    propertyTypes: ['land'],
  },

  // General suggestions (all types)
  {
    id: 'gen-1',
    text: 'Modern minimalist style',
    propertyTypes: ['residential', 'commercial', 'luxury', 'land'],
  },
  {
    id: 'gen-2',
    text: 'Add virtual tour QR code',
    propertyTypes: ['residential', 'commercial', 'luxury'],
    priceRanges: ['mid', 'high', 'luxury'],
  },
  {
    id: 'gen-3',
    text: 'Investment highlights',
    propertyTypes: ['residential', 'commercial', 'luxury'],
  },
  {
    id: 'gen-4',
    text: 'Contact information prominently',
    propertyTypes: ['residential', 'commercial', 'luxury', 'land'],
  },
];

/**
 * Get smart suggestions based on property type and price range
 */
export function getSmartSuggestions(
  propertyType?: 'residential' | 'commercial' | 'luxury' | 'land',
  priceRange?: 'low' | 'mid' | 'high' | 'luxury'
): SmartSuggestion[] {
  return smartSuggestionsData.filter((suggestion) => {
    // Check if property type matches
    const typeMatches = !propertyType || suggestion.propertyTypes.includes(propertyType);
    
    // Check if price range matches (if specified in suggestion)
    const priceMatches =
      !priceRange ||
      !suggestion.priceRanges ||
      suggestion.priceRanges.includes(priceRange);

    return typeMatches && priceMatches;
  });
}
