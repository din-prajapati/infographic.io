import { apiRequest } from './queryClient';
import type { RegisterInput, LoginInput, GenerateInfographicInput, AuthResponse, Template, Infographic, PlanTier } from '@shared/schema';
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
export const getApiUrl = (path: string): string => {
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

  forgotPassword: (data: { email: string }) =>
    apiRequest<{ message: string }>(getApiUrl('/auth/forgot-password'), {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiRequest<{ message: string }>(getApiUrl('/auth/reset-password'), {
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
export interface AgentInput {
  name?: string;
  brokerage?: string;
  phone?: string;
  email?: string;
  brandColors?: string[];
}

export interface GenerateFromChatInput {
  prompt: string;
  extractionId?: string;
  conversationId?: string;
  style?: string;
  model?: 'ideogram-turbo' | 'ideogram-v2' | 'nano-banana-pro' | 'ideogram-3' | 'ideogram-4';
  orientation?: 'landscape' | 'portrait' | 'square';
  variations?: number;
  agent?: AgentInput;
  /** User-written headline; if provided the backend skips the LLM headline call. */
  headline?: string;
  /** Photo ID returned by POST /infographics/upload-photo; attaches property photo as generation style reference. */
  photoReference?: string;
  /**
   * Output locale for on-image formatting (US-GEN-003). Resolved here rather than
   * server-side because the currency symbol the user typed is destroyed by extraction.
   * Omit for passthrough. Nothing to do with billing currency.
   */
  locale?: 'en-US' | 'en-IN';
  /** The currency token the user typed, echoed verbatim when `locale` is unresolved. */
  currencyToken?: string;
  // US-EDIT-009 removed `renderMode` from this request. Generation is always
  // flat; whether text becomes editable is decided later, on the canvas.
}

// ── ComposedDesign contract (mirrors api/src/modules/ai-generation/types/composed-design.types.ts) ──

/** Geometry and style hints recovered for one text region. Values in source-image pixel space. */
export interface ComposedTextElementGeometry {
  x: number; y: number;
  width: number; height: number;
  angle: number;
  fontFamily: string | null;
  fontSize: number | null;
  lineHeight: number | null;
  color: string | null;
  alignment: 'left' | 'center' | 'right' | null;
}

/** One canonical text element from the layer-extraction + binding step (US-AI-031b). */
export interface ComposedTextElement {
  /** Canonical listing field when matched; null for unmatched decorative blocks. */
  slot: 'headline' | 'address' | 'price' | 'stats' | 'agentName' | 'brokerage' | null;
  /** Canonical listing value (slot set) or detected text (slot null). Never model-authored. */
  text: string;
  geometry: ComposedTextElementGeometry;
  /** 'measured' = geometry from extraction; 'fallback' = prose-inferred layout. */
  placement: 'measured' | 'fallback';
}

/**
 * What the Edit action hands to the client canvas loader (US-AI-031b → US-AI-032).
 * Provider-free — no vendor shapes cross this boundary.
 */
export interface ComposedDesign {
  /** Text-erased composition URL — becomes the background image element. */
  backgroundUrl: string;
  elements: ComposedTextElement[];
  extraction: { attempted: boolean; blocksDetected: number; matched: number };
  /**
   * The application's own listing values (US-AI-046).
   *
   * Lets the client compose a layout with the layout engine rather than relying
   * on whatever layer extraction managed to find. Optional: absent on responses
   * from before this field existed.
   */
  canonicalValues?: Partial<Record<
    'headline' | 'address' | 'price' | 'stats' | 'agentName' | 'brokerage',
    string
  >>;
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
  planTier: PlanTier; // US-PAY-102 — single-sourced from PLAN_CONFIG's PlanTier, not a duplicated literal union
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
  createdAt?: string;
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

// US-PAY-112 — public, unauthenticated pricing-resolution endpoint. Never recompute a discounted
// price client-side (AC3) — this is the only source for regularPrice/effectivePrice/campaignId.
export interface EffectivePriceResult {
  regularPrice: number;
  effectivePrice: number;
  campaignId: string | null;
  badge?: string;
}

export const pricingApi = {
  getPricing: () =>
    apiRequest<{
      plans: Array<{ tier: PlanTier; monthly: EffectivePriceResult; annual: EffectivePriceResult }>;
    }>(getApiUrl('/pricing')),
};

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
    apiRequest<{ success: boolean; subscription: Subscription; provider: string; providerSubscription?: { id: string }; shortUrl?: string; checkoutUrl?: string }>(
      getApiUrl('/payments/create-subscription'),
      { method: 'POST', body: JSON.stringify(data) }
    ),

  getSubscription: () =>
    apiRequest<{
      subscription: Subscription | null;
      usage?: { current: number; limit: number };
    }>(getApiUrl('/payments/subscription')),

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

  syncSubscription: () =>
    apiRequest<{ localStatus: string; promoted: boolean; message: string }>(
      getApiUrl('/payments/subscription/sync'),
      { method: 'POST' }
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

/**
 * Client-side request timeout for POST /:id/compose (US-AI-050 AC4).
 *
 * Must be ≥ LAYERIZE_TIMEOUT_MS (90 000ms, server-side US-AI-031b) so the
 * server always gets to respond before the client gives up.  Set to 120 000ms
 * to give a generous safety margin over the 90s server budget.
 *
 * Exported so the AC4 unit test can reference the same constant instead of
 * repeating the literal.
 */
export const COMPOSE_REQUEST_TIMEOUT_MS = 120_000;

export const generationsApi = {
  getUsageQuota: () =>
    apiRequest<{
      organizationId: string | null;
      planTier: string;
      current: number;
      limit: number;
      remaining: number;
    }>(getApiUrl('/infographics/generations/usage/quota')),

  // US-PAY-103 — display-only editable-design remaining count
  getEditableUsageQuota: () =>
    apiRequest<{
      organizationId: string;
      planTier: string;
      editableLimit: number;
      editableUsed: number;
      editableRemaining: number;
    }>(getApiUrl('/infographics/generations/usage/quota/editable')),

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

  /**
   * Lazy layer extraction — triggered only when the user clicks "Edit" in renderMode='editable'.
   * Runs Ideogram Layerize-Text on the chosen variation, binds blocks to canonical listing
   * fields, and returns a ComposedDesign for the client canvas loader.
   * AC2 of US-AI-031b: extraction never runs at generate time.
   *
   * AC4 of US-AI-050: client timeout is COMPOSE_REQUEST_TIMEOUT_MS (≥ 90 000ms) so the
   * server's own LAYERIZE_TIMEOUT_MS (90 000ms) can always fire first — the client never
   * gives up while the server is still legitimately working.
   */
  getComposedDesign: (id: string, imageUrl: string) =>
    apiRequest<ComposedDesign>(
      getApiUrl(`/infographics/generations/${id}/compose`),
      {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
        signal: AbortSignal.timeout(COMPOSE_REQUEST_TIMEOUT_MS),
      },
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
  // Save a design (create or update) — always uses POST to create new DB records
  save: async (design: DesignMetadata): Promise<DesignMetadata> => {
    const body = JSON.stringify({
      name: design.name,
      type: design.type,
      category: design.category,
      thumbnail: design.thumbnail,
      canvasData: design.canvasData,
      tags: design.tags,
    });

    // Check if ID is a DB-generated cuid (starts with 'c', 25 chars, alphanumeric only)
    const isDbId = design.id && /^c[a-z0-9]{24}$/.test(design.id);

    if (isDbId) {
      // Existing DB record — try PUT update
      try {
        const response = await apiRequest<any>(getApiUrl(`/designs/${design.id}`), {
          method: 'PUT',
          body,
        });
        if (response?.id) {
          return { ...design, id: response.id, updatedAt: response.updatedAt || design.updatedAt };
        }
        return design;
      } catch (error) {
        throw error;
      }
    } else {
      // New design (LocalStorage ID or no ID) — use POST to create
      const response = await apiRequest<any>(getApiUrl('/designs'), {
        method: 'POST',
        body,
      });
      if (response?.id) {
        return {
          ...design,
          id: response.id,
          createdAt: response.createdAt || design.createdAt,
          updatedAt: response.updatedAt || design.updatedAt,
        };
      }
      return design;
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

/** Extended metadata returned for admin-curated gallery entries. */
export interface AdminCuratedTemplate extends DesignMetadata {
  visibility: 'admin_curated';
  description?: string;
  badge?: string;
}

// Template API - for saving/loading canvas templates
export const canvasTemplatesApi = {
  // Save a template (create or update)
  save: async (template: DesignMetadata & { visibility?: 'private' | 'admin_curated' | 'for_sale' }): Promise<DesignMetadata> => {
    const body = JSON.stringify({
      name: template.name,
      type: 'template',
      category: template.category,
      thumbnail: template.thumbnail,
      canvasData: template.canvasData,
      tags: template.tags,
      visibility: template.visibility ?? 'private',
    });

    // Check if ID is a DB-generated cuid
    const isDbId = template.id && /^c[a-z0-9]{24}$/.test(template.id);

    const endpoint = isDbId ? getApiUrl(`/canvas-templates/${template.id}`) : getApiUrl('/canvas-templates');
    const response = await apiRequest<any>(endpoint, {
      method: isDbId ? 'PUT' : 'POST',
      body,
    });

    if (response?.id) {
      return {
        ...template,
        id: response.id,
        createdAt: response.createdAt || template.createdAt,
        updatedAt: response.updatedAt || template.updatedAt,
      };
    }
    return template;
  },

  // Get all templates (current user's private templates)
  getAll: async (): Promise<DesignMetadata[]> => {
    try {
      return await apiRequest<DesignMetadata[]>(getApiUrl('/canvas-templates'));
    } catch (error) {
      throw error;
    }
  },

  // Get admin-curated (premium) templates from the database
  getAdminCurated: async (): Promise<AdminCuratedTemplate[]> => {
    return await apiRequest<AdminCuratedTemplate[]>(
      getApiUrl('/canvas-templates?visibility=admin_curated'),
    );
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

  /**
   * Get the current user's own templates that are tagged with a given format id.
   * Filtering is done client-side: fetch all user templates then match `tags`.
   * Used by the Format Picker Library step (US-AI-038).
   */
  getByFormatTag: async (formatTag: string): Promise<DesignMetadata[]> => {
    const all = await apiRequest<DesignMetadata[]>(getApiUrl('/canvas-templates'));
    return all.filter(
      (t) => Array.isArray(t.tags) && t.tags.includes(formatTag),
    );
  },
};

// Users API - Organization management and user limits
export interface OrganizationInfo {
  organization: {
    id: string;
    name: string;
    planTier: string;
    monthlyLimit: number;
  };
  userSlots: {
    current: number;
    limit: number;
    remaining: number;
  };
  planLimits: {
    userLimit: number;
    monthlyLimit: number;
  };
}

export interface OrganizationMember {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export const usersApi = {
  getOrganizationInfo: () =>
    apiRequest<{ data: OrganizationInfo | null }>(getApiUrl('/users/organization')),

  getOrganizationMembers: () =>
    apiRequest<{ data: OrganizationMember[] }>(getApiUrl('/users/organization/members')),

  getRemainingSlots: () =>
    apiRequest<{ data: { current: number; limit: number; remaining: number } }>(getApiUrl('/users/organization/slots')),

  addMember: (userId: string) =>
    apiRequest<{ success: boolean; message: string }>(
      getApiUrl(`/users/organization/members/${userId}`),
      { method: 'POST' }
    ),

  removeMember: (userId: string) =>
    apiRequest<{ success: boolean; message: string }>(
      getApiUrl(`/users/organization/members/${userId}`),
      { method: 'DELETE' }
    ),

  /** Add an existing account to the org by email (backend: POST .../members/invite). */
  inviteMemberByEmail: (email: string) =>
    apiRequest<{ success: boolean; message: string }>(getApiUrl('/users/organization/members/invite'), {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
