/**
 * Prompt Suggestions Data
 * 36 prompts across 6 categories with preview images
 */

import { PromptSuggestion } from './types';

export const promptSuggestions: PromptSuggestion[] = [
  // Property Listings (6)
  {
    id: 'pl-1',
    categoryId: 'property-listings',
    text: 'Create a luxury waterfront property listing',
    previewImage: 'https://images.unsplash.com/photo-1759020623226-73ec7a068b11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRlcmZyb250JTIwaG91c2V8ZW58MXx8fHwxNzY0OTM0ODA3fDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'pl-2',
    categoryId: 'property-listings',
    text: 'Generate a modern downtown condo showcase',
    previewImage: 'https://images.unsplash.com/photo-1601630164609-af849e05b776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkb3dudG93biUyMGNvbmRvfGVufDF8fHx8MTc2NDkzNDgwN3ww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'pl-3',
    categoryId: 'property-listings',
    text: 'Design a family home with feature highlights',
    previewImage: 'https://images.unsplash.com/photo-1762374974129-f9266d9c4efc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW1pbHklMjBzdWJ1cmJhbiUyMGhvbWV8ZW58MXx8fHwxNzY0OTM0ODA3fDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'pl-4',
    categoryId: 'property-listings',
    text: 'Create an exclusive estate presentation',
    previewImage: 'https://images.unsplash.com/photo-1760372058247-0067beeeef70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleGNsdXNpdmUlMjBlc3RhdGUlMjBtYW5zaW9ufGVufDF8fHx8MTc2NDkzNDgwOHww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'pl-5',
    categoryId: 'property-listings',
    text: 'Generate a new construction property ad',
    previewImage: 'https://images.unsplash.com/photo-1686358244570-631340cbbd22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjBjb25zdHJ1Y3Rpb24lMjBob3VzZXxlbnwxfHx8fDE3NjQ5MzQ4MDh8MA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'pl-6',
    categoryId: 'property-listings',
    text: 'Design a cozy suburban home listing',
    previewImage: 'https://images.unsplash.com/photo-1760783320571-36ebe8b9a350?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY290dGFnZSUyMGhvbWV8ZW58MXx8fHwxNzY0OTM0ODA4fDA&ixlib=rb-4.1.0&q=80&w=400',
  },

  // Open House (6)
  {
    id: 'oh-1',
    categoryId: 'open-house',
    text: 'Create an inviting open house invitation',
    previewImage: 'https://images.unsplash.com/photo-1746021278356-66b31ca55dbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwaG91c2UlMjBldmVudHxlbnwxfHx8fDE3NjQ5MzQ4MTF8MA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'oh-2',
    categoryId: 'open-house',
    text: 'Generate a virtual tour announcement',
    previewImage: 'https://images.unsplash.com/photo-1616092017315-e54c88662814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXJ0dWFsJTIwaG9tZSUyMHRvdXJ8ZW58MXx8fHwxNzY0OTM0ODExfDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'oh-3',
    categoryId: 'open-house',
    text: 'Design a staged property showcase',
    previewImage: 'https://images.unsplash.com/photo-1613545564259-ede280773613?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMGludGVyaW9yJTIwc3RhZ2luZ3xlbnwxfHx8fDE3NjQ5MzQ4MTJ8MA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'oh-4',
    categoryId: 'open-house',
    text: 'Create a private showing announcement',
    previewImage: 'https://images.unsplash.com/photo-1719938073286-437141b562e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwc2hvd2luZ3xlbnwxfHx8fDE3NjQ5MzQ4MTJ8MA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'oh-5',
    categoryId: 'open-house',
    text: 'Generate a walkthrough tour schedule',
    previewImage: 'https://images.unsplash.com/photo-1656947847511-a041b540b106?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwaW5zcGVjdGlvbiUyMHdhbGt0aHJvdWdofGVufDF8fHx8MTc2NDkzNDgxM3ww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'oh-6',
    categoryId: 'open-house',
    text: 'Design a viewing appointment reminder',
    previewImage: 'https://images.unsplash.com/photo-1757967674758-db9fe6da8d16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMHZpZXdpbmclMjBhcHBvaW50bWVudHxlbnwxfHx8fDE3NjQ5MzQ4MTN8MA&ixlib=rb-4.1.0&q=80&w=400',
  },

  // Just Sold (6)
  {
    id: 'js-1',
    categoryId: 'just-sold',
    text: 'Create a celebratory sold announcement',
    previewImage: 'https://images.unsplash.com/photo-1670100408549-f9c409d429a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xkJTIwaG91c2UlMjBzaWdufGVufDF8fHx8MTc2NDkzNDgxNXww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'js-2',
    categoryId: 'just-sold',
    text: 'Generate a successful sale showcase',
    previewImage: 'https://images.unsplash.com/photo-1569184825833-0b1b3ea211db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdWNjZXNzZnVsJTIwcHJvcGVydHklMjBzYWxlfGVufDF8fHx8MTc2NDkzNDgxNnww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'js-3',
    categoryId: 'just-sold',
    text: 'Design a closing day celebration post',
    previewImage: 'https://images.unsplash.com/photo-1759429255330-51145b170dad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMGtleXMlMjBjbG9zaW5nfGVufDF8fHx8MTc2NDkzNDgxNnww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'js-4',
    categoryId: 'just-sold',
    text: 'Create a happy homeowner testimonial',
    previewImage: 'https://images.unsplash.com/photo-1758523671637-5a39ea2c129b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGhvbWVvd25lcnN8ZW58MXx8fHwxNzY0OTM0ODE3fDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'js-5',
    categoryId: 'just-sold',
    text: 'Generate a record sale announcement',
    previewImage: 'https://images.unsplash.com/photo-1714978444599-6f9159ebdee4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMHNvbGQlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjQ5MzQ4MTd8MA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'js-6',
    categoryId: 'just-sold',
    text: 'Design a transaction success story',
    previewImage: 'https://images.unsplash.com/photo-1759429255330-51145b170dad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwdHJhbnNhY3Rpb258ZW58MXx8fHwxNzY0OTM0ODE3fDA&ixlib=rb-4.1.0&q=80&w=400',
  },

  // Agent Branding (6)
  {
    id: 'ab-1',
    categoryId: 'agent-branding',
    text: 'Create a professional agent introduction',
    previewImage: 'https://images.unsplash.com/photo-1763478958776-ebd04b6459ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwYWdlbnQlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjQ5MzQ4MjB8MA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'ab-2',
    categoryId: 'agent-branding',
    text: 'Generate a realtor headshot card',
    previewImage: 'https://images.unsplash.com/photo-1670236246338-c619dec5203c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjByZWFsdG9yJTIwaGVhZHNob3R8ZW58MXx8fHwxNzY0OTM0ODIwfDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'ab-3',
    categoryId: 'agent-branding',
    text: 'Design a personal branding business card',
    previewImage: 'https://images.unsplash.com/photo-1762941177632-fe37c485c428?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwYnVzaW5lc3MlMjBjYXJkfGVufDF8fHx8MTc2NDkzNDgyMHww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'ab-4',
    categoryId: 'agent-branding',
    text: 'Create a client testimonial showcase',
    previewImage: 'https://images.unsplash.com/photo-1734659276207-e14f60a8bd44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ2VudCUyMHRlc3RpbW9uaWFsJTIwcmV2aWV3fGVufDF8fHx8MTc2NDkzNDgyMXww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'ab-5',
    categoryId: 'agent-branding',
    text: 'Generate a marketing portfolio piece',
    previewImage: 'https://images.unsplash.com/photo-1763479169474-728a7de108c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsdG9yJTIwYnJhbmRpbmclMjBtYXJrZXRpbmd8ZW58MXx8fHwxNzY0OTM0ODIxfDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'ab-6',
    categoryId: 'agent-branding',
    text: 'Design a team introduction post',
    previewImage: 'https://images.unsplash.com/photo-1763736809788-693e57ffe84c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ2VudCUyMHRlYW0lMjBwaG90b3xlbnwxfHx8fDE3NjQ5MzQ4MjJ8MA&ixlib=rb-4.1.0&q=80&w=400',
  },

  // Market Stats (6)
  {
    id: 'ms-1',
    categoryId: 'market-stats',
    text: 'Create a market trends report infographic',
    previewImage: 'https://images.unsplash.com/photo-1717957566742-fd92d32e01d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzaW5nJTIwbWFya2V0JTIwdHJlbmRzJTIwY2hhcnR8ZW58MXx8fHwxNzY0OTM0ODI0fDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'ms-2',
    categoryId: 'market-stats',
    text: 'Generate a statistics data visualization',
    previewImage: 'https://images.unsplash.com/photo-1717957566742-fd92d32e01d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwc3RhdGlzdGljcyUyMGRhdGF8ZW58MXx8fHwxNzY0OTM0ODI1fDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'ms-3',
    categoryId: 'market-stats',
    text: 'Design a property value growth chart',
    previewImage: 'https://images.unsplash.com/photo-1743486780771-afd09eea3624?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzaW5nJTIwcHJpY2UlMjB0cmVuZHN8ZW58MXx8fHwxNzY0OTM0ODI2fDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'ms-4',
    categoryId: 'market-stats',
    text: 'Create a quarterly market analysis',
    previewImage: 'https://images.unsplash.com/photo-1738739905706-2cc26e57f67d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJrZXQlMjBhbmFseXNpcyUyMHJlcG9ydHxlbnwxfHx8fDE3NjQ5MzQ4MjZ8MA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'ms-5',
    categoryId: 'market-stats',
    text: 'Generate a housing price comparison',
    previewImage: 'https://images.unsplash.com/photo-1717957566742-fd92d32e01d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMHZhbHVlJTIwZ3JhcGh8ZW58MXx8fHwxNzY0OTM0ODI1fDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'ms-6',
    categoryId: 'market-stats',
    text: 'Design a monthly market update post',
    previewImage: 'https://images.unsplash.com/flagged/photo-1558954157-aa76c0d246c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFsJTIwZXN0YXRlJTIwbWFya2V0JTIwdXBkYXRlfGVufDF8fHx8MTc2NDkzNDgyNnww&ixlib=rb-4.1.0&q=80&w=400',
  },

  // Neighborhood (6)
  {
    id: 'nb-1',
    categoryId: 'neighborhood',
    text: 'Create a community amenities guide',
    previewImage: 'https://images.unsplash.com/photo-1701457916764-7cc7c990b37a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZWlnaGJvcmhvb2QlMjBjb21tdW5pdHklMjBwYXJrfGVufDF8fHx8MTc2NDkzNDgyOXww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'nb-2',
    categoryId: 'neighborhood',
    text: 'Generate a local shopping highlights post',
    previewImage: 'https://images.unsplash.com/photo-1759178388578-d3589d058c0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2NhbCUyMGFtZW5pdGllcyUyMHNob3BwaW5nfGVufDF8fHx8MTc2NDkzNDgyOXww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'nb-3',
    categoryId: 'neighborhood',
    text: 'Design a residential area showcase',
    previewImage: 'https://images.unsplash.com/photo-1721273305283-955dc599d655?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdWJ1cmJhbiUyMHN0cmVldCUyMHJlc2lkZW50aWFsfGVufDF8fHx8MTc2NDkzNDgyOXww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'nb-4',
    categoryId: 'neighborhood',
    text: 'Create a community center highlights post',
    previewImage: 'https://images.unsplash.com/photo-1758304481749-56fe042af8ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBjZW50ZXIlMjBmYWNpbGl0aWVzfGVufDF8fHx8MTc2NDkzNDgzMHww&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'nb-5',
    categoryId: 'neighborhood',
    text: 'Generate a school district overview',
    previewImage: 'https://images.unsplash.com/photo-1763637675793-da207ba1fe18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2NhbCUyMHNjaG9vbHMlMjBlZHVjYXRpb258ZW58MXx8fHwxNzY0OTM0ODMwfDA&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 'nb-6',
    categoryId: 'neighborhood',
    text: 'Design a walkability score infographic',
    previewImage: 'https://images.unsplash.com/photo-1685630484363-7a026d15ef36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZWlnaGJvcmhvb2QlMjB3YWxrYWJpbGl0eXxlbnwxfHx8fDE3NjQ5MzQ4MzB8MA&ixlib=rb-4.1.0&q=80&w=400',
  },
];

export function getPromptsByCategoryId(categoryId: string): PromptSuggestion[] {
  return promptSuggestions.filter(prompt => prompt.categoryId === categoryId);
}
