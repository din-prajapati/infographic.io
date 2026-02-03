/**
 * Test Conversations Data
 * For development and testing purposes
 */

import { Conversation, Message } from './types';

export function createTestConversations(): Conversation[] {
  const now = new Date();
  
  return [
    {
      id: 'conv-1',
      title: 'Modern Luxury Villa Design',
      propertyType: 'luxury',
      priceRange: 'luxury',
      isFavorite: true,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      messages: [
        {
          id: 'msg-1',
          type: 'user',
          content: 'Create a luxury villa infographic with modern design',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
        {
          id: 'msg-2',
          type: 'ai',
          content: 'I\'ll create a stunning luxury villa infographic with elegant gold accents, premium typography, and spacious layout. The design will emphasize high-end amenities and sophisticated styling.',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 3000),
        },
        {
          id: 'msg-3',
          type: 'user',
          content: 'Add more emphasis on the spa and gym facilities',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 60000),
        },
        {
          id: 'msg-4',
          type: 'ai',
          content: 'Perfect! I\'ve updated the design to highlight the spa with massage therapy rooms, sauna, and the state-of-the-art fitness center with personal training available. These luxury amenities are now prominently featured.',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000 + 63000),
        },
      ],
    },
    {
      id: 'conv-2',
      title: 'Downtown Condo Marketing',
      propertyType: 'residential',
      priceRange: 'mid',
      isFavorite: false,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
      updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      messages: [
        {
          id: 'msg-5',
          type: 'user',
          content: 'I need an infographic for a downtown condo with walkability score',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        },
        {
          id: 'msg-6',
          type: 'ai',
          content: 'Great! I\'ll design a modern condo infographic featuring the walkability score prominently, along with nearby amenities like restaurants, shops, and public transportation. The urban lifestyle will be the central theme.',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 2500),
        },
      ],
    },
    {
      id: 'conv-3',
      title: 'Commercial Office Space',
      propertyType: 'commercial',
      priceRange: 'high',
      isFavorite: false,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      messages: [
        {
          id: 'msg-7',
          type: 'user',
          content: 'Create professional office space listing with ROI data',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'msg-8',
          type: 'ai',
          content: 'I\'ll design a professional corporate-style infographic with clean lines and blue tones. The ROI projections, cap rate, and cash flow analytics will be displayed prominently with charts and graphs for investor appeal.',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3200),
        },
        {
          id: 'msg-9',
          type: 'user',
          content: 'Also include parking information and building amenities',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 120000),
        },
        {
          id: 'msg-10',
          type: 'ai',
          content: 'Updated! The infographic now features a dedicated section for parking (200 spaces, underground secured), building amenities (conference rooms, fitness center, cafeteria), and 24/7 security system.',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 123000),
        },
      ],
    },
    {
      id: 'conv-4',
      title: 'Suburban Family Home',
      propertyType: 'residential',
      priceRange: 'mid',
      isFavorite: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      messages: [
        {
          id: 'msg-11',
          type: 'user',
          content: 'Family home infographic with school district emphasis',
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'msg-12',
          type: 'ai',
          content: 'Creating a warm, family-friendly design highlighting the excellent school district (rated 9/10), nearby parks, safe neighborhood, and family-oriented amenities. The layout will use inviting colors and showcase the spacious backyard.',
          timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 2800),
        },
      ],
    },
    {
      id: 'conv-5',
      title: 'Beachfront Property Showcase',
      propertyType: 'luxury',
      priceRange: 'luxury',
      isFavorite: false,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      messages: [
        {
          id: 'msg-13',
          type: 'user',
          content: 'Beachfront luxury property with ocean views',
          timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'msg-14',
          type: 'ai',
          content: 'I\'ll create a breathtaking infographic emphasizing the panoramic ocean views, private beach access, and coastal luxury lifestyle. The design will feature elegant blue and white tones reminiscent of the ocean, with emphasis on outdoor living spaces.',
          timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 3100),
        },
        {
          id: 'msg-15',
          type: 'user',
          content: 'Add sunset viewing deck details',
          timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 90000),
        },
        {
          id: 'msg-16',
          type: 'ai',
          content: 'Excellent addition! The infographic now prominently features the expansive sunset viewing deck with infinity edge glass railings, outdoor kitchen, and fire pit lounge area - perfect for entertaining while watching spectacular sunsets over the ocean.',
          timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 93500),
        },
      ],
    },
  ];
}

/**
 * Load test conversations into LocalStorage
 * Useful for development and testing
 */
export function loadTestConversations(): void {
  const testConversations = createTestConversations();
  localStorage.setItem('ai-chat-conversations', JSON.stringify(testConversations));
  console.log('✅ Test conversations loaded:', testConversations.length);
}

/**
 * Clear all conversations from LocalStorage
 */
export function clearConversations(): void {
  localStorage.removeItem('ai-chat-conversations');
  console.log('🗑️ Conversations cleared');
}

// Make functions available globally for easy testing in console
if (typeof window !== 'undefined') {
  (window as any).loadTestConversations = loadTestConversations;
  (window as any).clearConversations = clearConversations;
  console.log('💡 Dev helpers available: loadTestConversations(), clearConversations()');
}