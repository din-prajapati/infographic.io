import { apiRequest } from './queryClient';
import type { RegisterInput, LoginInput, GenerateInfographicInput, AuthResponse, Template, Infographic } from '@shared/schema';
import type { DesignMetadata } from './storage';

// Use environment variable for API base URL
const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
const ENV_API_URL = import.meta.env.VITE_API_URL || '';

function isLoopback(url: string): boolean {
  try {
    const u = new URL(url, 'http://dummy');
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

// When loaded from a public origin (e.g. ngrok), never use loopback API URL —
// browser blocks public→loopback (Private Network Access). Use same-origin so
// the request hits this host and the server can proxy to the backend.
function getEffectiveApiBaseUrl(): string {
  if (typeof window === 'undefined') return ENV_API_URL;
  const origin = window.location.origin;
  if (!isLoopback(origin) && (ENV_API_URL === '' || isLoopback(ENV_API_URL))) {
    return ''; // same-origin (e.g. ngrok tunnel to dev server)
  }
  return ENV_API_URL;
}

const API_URL = getEffectiveApiBaseUrl();

// Helper function to build API URLs
const getApiUrl = (path: string): string => {
  if (API_URL) {
    // Cross-origin: use full URL
    return `${API_URL}${API_BASE}${path}`;
  }
  // Same-origin: use relative path
  return `${API_BASE}${path}`;
};

export const authApi = {
  register: (data: RegisterInput) =>
    apiRequest<AuthResponse>(getApiUrl('/auth/register'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginInput) =>
    apiRequest<AuthResponse>(getApiUrl('/auth/login'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const templatesApi = {
  getAll: () => apiRequest<Template[]>(getApiUrl('/templates')),
  getOne: (id: string) => apiRequest<Template>(getApiUrl(`/templates/${id}`)),
};

export const infographicsApi = {
  generate: (data: GenerateInfographicInput) =>
    apiRequest<{ id: string; status: string; message: string; userId?: string; organizationId?: string; templateId?: string }>(getApiUrl('/infographics/generate'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOne: (id: string) => apiRequest<Infographic>(getApiUrl(`/infographics/${id}`)),
  getAll: () => apiRequest<Infographic[]>(getApiUrl('/infographics')),
};

// AI Generations API (Sub-Resource)
export interface GenerateFromChatInput {
  prompt: string;
  extractionId?: string;
  conversationId?: string;
  style?: string;
  model?: 'ideogram-turbo' | 'ideogram-v2' | 'nano-banana-pro';
  variations?: number;
}

export interface GenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  currentStep?: string;
  errorMessage?: string;
}

export interface ResultVariation {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
}

// Payments API
export interface CreateSubscriptionInput {
  planTier: 'FREE' | 'SOLO' | 'TEAM' | 'BROKERAGE' | 'API_STARTER' | 'API_GROWTH' | 'API_ENTERPRISE';
  currency?: string;
  region?: string;
  successUrl?: string;
  cancelUrl?: string;
  billingPeriod?: 'monthly' | 'annual';
}

export interface Subscription {
  id: string;
  userId: string;
  organizationId?: string;
  paymentProvider: string;
  externalSubscriptionId: string;
  planTier: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  currency: string;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  paymentProvider: string;
  externalPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  createdAt: string;
}

export interface ProviderInfo {
  provider: 'RAZORPAY' | 'STRIPE';
  providerName: string;
  stripeEnabled: boolean;
  availableProviders: string[];
  razorpayKeyId: string | null;
  stripePublishableKey: string | null;
}

export const paymentsApi = {
  getProviderInfo: (currency?: string, region?: string) => {
    const params = new URLSearchParams();
    if (currency) params.append('currency', currency);
    if (region) params.append('region', region);
    return apiRequest<ProviderInfo>(getApiUrl(`/payments/provider-info?${params.toString()}`));
  },

  getPlans: () =>
    apiRequest<{ plans: any[] }>(getApiUrl('/payments/plans')),

  createSubscription: (data: CreateSubscriptionInput) =>
    apiRequest<{ success: boolean; subscription: Subscription; provider: string; shortUrl?: string; checkoutUrl?: string }>(
      getApiUrl('/payments/create-subscription'),
      { method: 'POST', body: JSON.stringify(data) }
    ),

  getSubscription: () =>
    apiRequest<{ subscription: Subscription | null }>(getApiUrl('/payments/subscription')),

  updatePlan: (planTier: string) =>
    apiRequest<{ success: boolean; subscription: Subscription }>(
      getApiUrl('/payments/update-plan'),
      { method: 'POST', body: JSON.stringify({ planTier }) }
    ),

  cancelSubscription: (immediate?: boolean) =>
    apiRequest<{ success: boolean; subscription: Subscription }>(
      getApiUrl('/payments/cancel'),
      { method: 'POST', body: JSON.stringify({ immediate }) }
    ),

  getPaymentHistory: () =>
    apiRequest<{ payments: Payment[] }>(getApiUrl('/payments/history')),

  verifyPayment: (data: { razorpayPaymentId: string; razorpaySubscriptionId: string; razorpaySignature: string }) =>
    apiRequest<{ success: boolean; verified: boolean }>(
      getApiUrl('/payments/verify'),
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

// Usage Analytics API
export interface MonthlyUsageData {
  month: string;
  count: number;
  costUsd: number;
}

export interface CostBreakdown {
  aiModel: string;
  count: number;
  totalCostUsd: number;
  averageCostUsd: number;
}

export interface UsageHistoryItem {
  date: string;
  count: number;
  costUsd: number;
  aiModel: string;
}

export const usageAnalyticsApi = {
  getMonthlyUsage: (months?: number) => {
    const params = months ? `?months=${months}` : '';
    return apiRequest<{ data: MonthlyUsageData[] }>(getApiUrl(`/payments/usage/monthly${params}`));
  },

  getCostBreakdown: () =>
    apiRequest<{ data: CostBreakdown[] }>(getApiUrl('/payments/usage/cost-breakdown')),

  getUsageHistory: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest<{ data: UsageHistoryItem[] }>(getApiUrl(`/payments/usage/history?${params.toString()}`));
  },

  exportUsageData: (format: 'csv' | 'json' = 'json') => {
    const url = getApiUrl(`/payments/usage/export?format=${format}`);
    return fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    }).then(res => {
      if (format === 'csv') return res.text();
      return res.json();
    });
  },
};

export const generationsApi = {
  // Generate from chat prompt
  generate: (data: GenerateFromChatInput) =>
    apiRequest<{ id: string; status: string; conversationId?: string }>(
      getApiUrl('/infographics/generations'),
      { method: 'POST', body: JSON.stringify(data) }
    ),
  
  // Get generation status
  getStatus: (id: string) =>
    apiRequest<GenerationStatus>(getApiUrl(`/infographics/generations/${id}/status`)),
  
  // Get variations
  getVariations: (id: string) =>
    apiRequest<ResultVariation[]>(getApiUrl(`/infographics/generations/${id}/variations`)),
  
  // Regenerate
  regenerate: (id: string, data: { modifications?: string[]; style?: string }) =>
    apiRequest<{ id: string; status: string }>(
      getApiUrl(`/infographics/generations/${id}/regenerate`),
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

// Prompt Extractions API (Sub-Resource)
export interface ExtractPropertyDataInput {
  prompt: string;
  conversationId?: string;
  context?: Array<{ role: string; content: string }>;
}

export interface ExtractionResult {
  id: string;
  extractedData: {
    propertyType?: 'residential' | 'commercial' | 'land';
    listingType?: 'for_sale' | 'for_rent' | 'sold';
    address?: string;
    price?: number;
    beds?: number;
    baths?: number;
    sqft?: number;
    features?: string[];
    agent?: {
      name?: string;
      brokerage?: string;
      brandColors?: string[];
      logoUrl?: string;
    };
  };
  confidence: number;
  missingFields: string[];
  suggestions: string[];
  createdAt: string;
}

export const extractionsApi = {
  // Extract property data from prompt
  extract: (data: ExtractPropertyDataInput) =>
    apiRequest<ExtractionResult>(
      getApiUrl('/infographics/generations/extractions'),
      { method: 'POST', body: JSON.stringify(data) }
    ),
  
  // Get extraction result
  getOne: (id: string) =>
    apiRequest<ExtractionResult>(getApiUrl(`/infographics/generations/extractions/${id}`)),
};

// Conversations API (Separate Resource)
export interface Conversation {
  id: string;
  title: string;
  propertyType?: 'residential' | 'commercial' | 'luxury' | 'land';
  priceRange?: 'low' | 'mid' | 'high' | 'luxury';
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  templateId?: string;
  isLoading?: boolean;
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

export interface CreateConversationInput {
  title: string;
  propertyType?: 'residential' | 'commercial' | 'luxury' | 'land';
  priceRange?: 'low' | 'mid' | 'high' | 'luxury';
}

export interface UpdateConversationInput {
  title?: string;
  isFavorite?: boolean;
}

export interface AddMessageInput {
  content: string;
  type: 'user' | 'ai';
}

export const conversationsApi = {
  getAll: () => apiRequest<Conversation[]>(getApiUrl('/conversations')),
  create: (data: CreateConversationInput) =>
    apiRequest<Conversation>(getApiUrl('/conversations'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOne: (id: string) => apiRequest<Conversation>(getApiUrl(`/conversations/${id}`)),
  update: (id: string, data: UpdateConversationInput) =>
    apiRequest<Conversation>(getApiUrl(`/conversations/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<void>(getApiUrl(`/conversations/${id}`), { method: 'DELETE' }),
  getMessages: (id: string) =>
    apiRequest<Message[]>(getApiUrl(`/conversations/${id}/messages`)),
  addMessage: (id: string, data: AddMessageInput) =>
    apiRequest<Message>(getApiUrl(`/conversations/${id}/messages`), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Design API - for saving/loading canvas designs
export const designsApi = {
  // Save a design (create or update)
  save: async (design: DesignMetadata): Promise<DesignMetadata> => {
    try {
      const endpoint = design.id ? getApiUrl(`/designs/${design.id}`) : getApiUrl('/designs');
      const response = await apiRequest<any>(endpoint, {
        method: design.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: design.name,
          type: design.type,
          category: design.category,
          thumbnail: design.thumbnail,
          canvasData: design.canvasData,
          tags: design.tags,
        }),
      });
      
      // Transform backend response to DesignMetadata format
      if (response.id) {
        return {
          id: response.id,
          name: design.name,
          type: design.type,
          category: design.category,
          thumbnail: design.thumbnail,
          canvasData: design.canvasData,
          tags: design.tags,
          createdAt: response.createdAt || design.createdAt,
          updatedAt: response.updatedAt || design.updatedAt,
        };
      }
      return design;
    } catch (error) {
      // If API fails, throw error so storage.ts can fall back to LocalStorage
      throw error;
    }
  },

  // Get all designs for current user
  getAll: async (): Promise<DesignMetadata[]> => {
    try {
      const designs = await apiRequest<DesignMetadata[]>(getApiUrl('/designs'));
      return designs.filter(d => d.type === 'design');
    } catch (error) {
      throw error;
    }
  },

  // Get a specific design by ID
  getOne: async (id: string): Promise<DesignMetadata> => {
    try {
      return await apiRequest<DesignMetadata>(getApiUrl(`/designs/${id}`));
    } catch (error) {
      throw error;
    }
  },

  // Delete a design
  delete: async (id: string): Promise<void> => {
    try {
      await apiRequest<void>(getApiUrl(`/designs/${id}`), {
        method: 'DELETE',
      });
    } catch (error) {
      throw error;
    }
  },
};

// Template API - for saving/loading canvas templates
export const canvasTemplatesApi = {
  // Save a template (create or update)
  save: async (template: DesignMetadata): Promise<DesignMetadata> => {
    try {
      const endpoint = template.id ? getApiUrl(`/canvas-templates/${template.id}`) : getApiUrl('/canvas-templates');
      const response = await apiRequest<any>(endpoint, {
        method: template.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: template.name,
          type: 'template',
          category: template.category,
          thumbnail: template.thumbnail,
          canvasData: template.canvasData,
          tags: template.tags,
        }),
      });
      
      // Transform backend response to DesignMetadata format
      if (response.id) {
        return {
          id: response.id,
          name: template.name,
          type: 'template',
          category: template.category,
          thumbnail: template.thumbnail,
          canvasData: template.canvasData,
          tags: template.tags,
          createdAt: response.createdAt || template.createdAt,
          updatedAt: response.updatedAt || template.updatedAt,
        };
      }
      return template;
    } catch (error) {
      throw error;
    }
  },

  // Get all templates
  getAll: async (): Promise<DesignMetadata[]> => {
    try {
      return await apiRequest<DesignMetadata[]>(getApiUrl('/canvas-templates'));
    } catch (error) {
      throw error;
    }
  },

  // Get a specific template by ID
  getOne: async (id: string): Promise<DesignMetadata> => {
    try {
      return await apiRequest<DesignMetadata>(getApiUrl(`/canvas-templates/${id}`));
    } catch (error) {
      throw error;
    }
  },

  // Delete a template
  delete: async (id: string): Promise<void> => {
    try {
      await apiRequest<void>(getApiUrl(`/canvas-templates/${id}`), {
        method: 'DELETE',
      });
    } catch (error) {
      throw error;
    }
  },
};
