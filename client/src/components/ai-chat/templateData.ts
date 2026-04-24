/**
 * Real Estate Template Data
 * 15 templates across 4 categories
 */

import { Template, CategoryInfo, TemplateCategory } from './types';

// Category Definitions
export const categories: CategoryInfo[] = [
  {
    id: 'listing-announcements',
    name: 'Listing Announcements',
    description: 'New property listings and coming soon posts',
    icon: '🏡',
    templateCount: 4,
    color: 'var(--category-listing-announcements)',
  },
  {
    id: 'property-features',
    name: 'Property Features',
    description: 'Highlight unique amenities and features',
    icon: '⭐',
    templateCount: 4,
    color: 'var(--category-property-features)',
  },
  {
    id: 'status-updates',
    name: 'Status Updates',
    description: 'Price changes, sold, and pending status',
    icon: '📊',
    templateCount: 4,
    color: 'var(--category-status-updates)',
  },
  {
    id: 'agent-branding',
    name: 'Agent Branding',
    description: 'Personal branding and testimonials',
    icon: '👤',
    templateCount: 3,
    color: 'var(--category-agent-branding)',
  },
];

// Template Definitions (15 total)
export const templates: Template[] = [
  // Listing Announcements (4)
  {
    id: 'luxury-listing',
    name: 'Luxury Listing',
    category: 'listing-announcements',
    description: 'High-end property announcement with premium styling',
    emoji: '💎',
    isPopular: true,
  },
  {
    id: 'new-listing',
    name: 'New Listing',
    category: 'listing-announcements',
    description: 'Classic new property listing announcement',
    emoji: '🏠',
  },
  {
    id: 'coming-soon',
    name: 'Coming Soon',
    category: 'listing-announcements',
    description: 'Teaser for upcoming property listings',
    emoji: '⏰',
  },
  {
    id: 'exclusive-listing',
    name: 'Exclusive Listing',
    category: 'listing-announcements',
    description: 'Exclusive or off-market property announcement',
    emoji: '🔑',
  },

  // Property Features (4)
  {
    id: 'open-house',
    name: 'Open House',
    category: 'property-features',
    description: 'Open house event announcement with date and time',
    emoji: '🚪',
    isPopular: true,
  },
  {
    id: 'virtual-tour',
    name: 'Virtual Tour',
    category: 'property-features',
    description: '3D tour and virtual walkthrough promotion',
    emoji: '📱',
  },
  {
    id: 'property-highlights',
    name: 'Property Highlights',
    category: 'property-features',
    description: 'Showcase key features and amenities',
    emoji: '✨',
  },
  {
    id: 'neighborhood-guide',
    name: 'Neighborhood Guide',
    category: 'property-features',
    description: 'Highlight local area and community features',
    emoji: '🗺️',
  },

  // Status Updates (4)
  {
    id: 'just-sold',
    name: 'Just Sold',
    category: 'status-updates',
    description: 'Celebrate recent sale success',
    emoji: '✅',
    isPopular: true,
  },
  {
    id: 'price-reduced',
    name: 'Price Reduced',
    category: 'status-updates',
    description: 'Announce price reduction to attract buyers',
    emoji: '💰',
    isPopular: true,
  },
  {
    id: 'under-contract',
    name: 'Under Contract',
    category: 'status-updates',
    description: 'Property pending sale status',
    emoji: '📝',
  },
  {
    id: 'back-on-market',
    name: 'Back on Market',
    category: 'status-updates',
    description: 'Property available again after falling through',
    emoji: '🔄',
  },

  // Agent Branding (3)
  {
    id: 'agent-intro',
    name: 'Agent Introduction',
    category: 'agent-branding',
    description: 'Introduce yourself and your services',
    emoji: '👋',
  },
  {
    id: 'client-testimonial',
    name: 'Client Testimonial',
    category: 'agent-branding',
    description: 'Share client success stories and reviews',
    emoji: '⭐',
  },
  {
    id: 'market-update',
    name: 'Market Update',
    category: 'agent-branding',
    description: 'Share local market insights and statistics',
    emoji: '📈',
  },
];

// Helper Functions
export const getTemplatesByCategory = (category: TemplateCategory): Template[] => {
  return templates.filter(t => t.category === category);
};

export const getPopularTemplates = (): Template[] => {
  return templates.filter(t => t.isPopular);
};

export const getTemplateById = (id: string): Template | undefined => {
  return templates.find(t => t.id === id);
};

export const getCategoryInfo = (category: TemplateCategory): CategoryInfo | undefined => {
  return categories.find(c => c.id === category);
};
