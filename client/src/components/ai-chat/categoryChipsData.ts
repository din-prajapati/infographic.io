/**
 * Category Chips Data
 * 6 Real Estate Categories for Quick Selection
 */

import { CategoryChip } from './types';

export const categoryChips: CategoryChip[] = [
  {
    id: 'property-listings',
    name: 'Property Listings',
    icon: '🏡',
    color: '#FF8C00', // orange
  },
  {
    id: 'open-house',
    name: 'Open House',
    icon: '🚪',
    color: '#4CAF50', // green
  },
  {
    id: 'just-sold',
    name: 'Just Sold',
    icon: '✅',
    color: '#2196F3', // blue
  },
  {
    id: 'agent-branding',
    name: 'Agent Branding',
    icon: '👤',
    color: '#9C27B0', // purple
  },
  {
    id: 'market-stats',
    name: 'Market Stats',
    icon: '📊',
    color: '#FF5722', // deep orange
  },
  {
    id: 'neighborhood',
    name: 'Neighborhood',
    icon: '🗺️',
    color: '#00BCD4', // cyan
  },
];

export function getCategoryChipById(id: string): CategoryChip | undefined {
  return categoryChips.find(chip => chip.id === id);
}
