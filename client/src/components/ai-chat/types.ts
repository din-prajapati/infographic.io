/**
 * AI Chat Box Type Definitions
 * Real Estate Infographic Template System
 */

import { LucideIcon } from 'lucide-react';

export type TemplateCategory = 
  | 'listing-announcements'
  | 'property-features'
  | 'status-updates'
  | 'agent-branding';

// NEW: Category Chip Types
export type CategoryChipType = 
  | 'property-listings'
  | 'open-house'
  | 'just-sold'
  | 'agent-branding'
  | 'market-stats'
  | 'neighborhood';

export interface CategoryChip {
  id: CategoryChipType;
  name: string;
  icon: string; // emoji for now
  color: string; // for selected state
}

export interface PromptSuggestion {
  id: string;
  categoryId: CategoryChipType;
  text: string;
  previewImage: string;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  previewImage?: string;
  isPopular?: boolean;
  emoji: string;
}

export interface TemplateData {
  propertyTitle?: string;
  propertyType?: string;
  price?: string;
  bedrooms?: string;
  bathrooms?: string;
  sqft?: string;
  address?: string;
  description?: string;
  features?: string[];
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentPhoto?: string;
  propertyImage?: string;
}

export interface AIChatState {
  isExpanded: boolean;
  inputValue: string;
  selectedTemplate: Template | null;
  selectedCategory: TemplateCategory | null;
  showCategoryView: boolean;
  showTemplateDropdown: boolean;
  isGenerating: boolean;
  error: string | null;
  // NEW: Chip selection state
  selectedChips: CategoryChip[];
  showPromptGrid: boolean;
  activeChipId: CategoryChipType | null;
}

export interface CategoryInfo {
  id: TemplateCategory;
  name: string;
  description: string;
  icon: string;
  templateCount: number;
  color: string;
}

// NEW: Conversation Message Types
export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  templateId?: string; // If AI generated a template
  isLoading?: boolean; // For typing indicator
  // NEW: Generation support
  isGenerating?: boolean;
  generationSteps?: Array<{
    id: string;
    label: string;
    status: 'pending' | 'in-progress' | 'completed';
  }>;
  currentStep?: number;
  resultPreviews?: Array<{
    id: string;
    thumbnail: string;
    title: string;
  }>;
}

// NEW: Conversation Types
export interface Conversation {
  id: string;
  title: string;
  propertyType?: 'residential' | 'commercial' | 'luxury' | 'land';
  priceRange?: 'low' | 'mid' | 'high' | 'luxury';
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
}

// NEW: Smart Suggestion Types
export interface SmartSuggestion {
  id: string;
  text: string;
  propertyTypes: string[];
  priceRanges?: string[];
}

// History Item Types
export interface HistoryItem {
  id: string;
  prompt: string;
  timestamp: Date;
  isFavorite: boolean;
  categoryId?: string;
}