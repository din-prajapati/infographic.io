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
    color: '#3B82F6',                       // Blue
    surfaceColor: 'rgba(59, 130, 246, 0.15)',
  },
  {
    id: 'open-house',
    name: 'Open House',
    icon: '🚪',
    color: '#F97316',                       // Orange
    surfaceColor: 'rgba(249, 115, 22, 0.15)',
  },
  {
    id: 'just-sold',
    name: 'Just Sold',
    icon: '✅',
    color: '#10B981',                       // Emerald
    surfaceColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'agent-branding',
    name: 'Agent Branding',
    icon: '👤',
    color: '#F59E0B',                       // Amber
    surfaceColor: 'rgba(245, 158, 11, 0.15)',
  },
  {
    id: 'market-stats',
    name: 'Market Stats',
    icon: '📊',
    color: '#6366F1',                       // Indigo
    surfaceColor: 'rgba(99, 102, 241, 0.15)',
  },
  {
    id: 'neighborhood',
    name: 'Neighborhood',
    icon: '🗺️',
    color: '#14B8A6',                       // Teal
    surfaceColor: 'rgba(20, 184, 166, 0.15)',
  },
];

export function getCategoryChipById(id: string): CategoryChip | undefined {
  return categoryChips.find(chip => chip.id === id);
}
