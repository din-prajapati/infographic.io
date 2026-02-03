---
name: AI Chat Backend Integration Plan
overview: Plan for connecting the AI Chat Box UI to real backend infographic generation, including LLM recommendations, cost analysis, and subscription model suggestions.
todos:
  - id: create-generations-controller
    content: Create GenerationsController with POST /api/v1/infographics/generations endpoint for AI chat-based generation
    status: completed
  - id: create-extractions-controller
    content: Create ExtractionsController with POST /api/v1/infographics/generations/extractions endpoint for prompt extraction
    status: completed
  - id: create-prompt-extractor
    content: Implement PromptExtractorService to parse natural language and extract structured property data using GPT-5
    status: completed
  - id: enhance-orchestrator
    content: Add multi-variation generation and style preset support to AiOrchestrator service
    status: completed
  - id: create-websocket-service
    content: Implement WebSocket service for real-time generation progress updates
    status: pending
    dependencies:
      - enhance-orchestrator
  - id: update-frontend-api
    content: Add generationsApi and extractionsApi methods to client/src/lib/api.ts with correct REST endpoints
    status: completed
    dependencies:
      - create-generations-controller
      - create-extractions-controller
  - id: connect-chatbox-backend
    content: Replace mock generation in AIChatBox.tsx handleGenerate() with real API calls and status polling
    status: completed
    dependencies:
      - update-frontend-api
      - create-prompt-extractor
  - id: add-conversation-persistence
    content: Create ConversationsController with REST endpoints at /api/v1/conversations and ConversationService for server-side storage
    status: completed
  - id: implement-error-handling
    content: Add comprehensive error handling for API failures, rate limits, and quota exceeded scenarios
    status: completed
    dependencies:
      - connect-chatbox-backend
  - id: add-usage-alerts
    content: Implement usage tracking and alerts at 80% of monthly limit for each subscription tier
    status: completed
  - id: update-pricing-config
    content: Review and update PLAN_CONFIG pricing to ensure profitable margins based on cost analysis
    status: completed
  - id: add-conversation-db-models
    content: Add Prisma models for Conversation and Message with proper relationships
    status: pending
  - id: migrate-conversation-service
    content: Migrate ConversationService from in-memory storage to Prisma database persistence
    status: pending
    dependencies:
      - add-conversation-db-models
  - id: add-extraction-db-models
    content: Add Prisma model for Extraction to persist extraction results
    status: pending
  - id: persist-extractions
    content: Update ExtractionsController to persist extraction results to database
    status: pending
    dependencies:
      - add-extraction-db-models
  - id: test-api-endpoints
    content: Test all API endpoints end-to-end and validate error handling scenarios
    status: pending
---

# AI Chat Backend Integration & LLM Strategy Plan

## Current State Analysis

### Frontend (AI Chat Box UI)

- **Location**: `client/src/components/ai-chat/AIChatBox.tsx`
- **Status**: ✅ Fully implemented and connected to real backend APIs
- **Key Features**: Conversation history, category chips, prompt suggestions, generation progress tracking
- **Current Flow**: Uses real API calls to `generationsApi.generate()`, polls for status updates, retrieves variations

### Backend (Infographic Generation)

- **API Endpoints**: 
- `POST /api/v1/infographics/generations` - AI chat-based generation ✅
- `POST /api/v1/infographics/generations/extractions` - Prompt extraction ✅
- `GET /api/v1/infographics/generations/:id/status` - Generation status ✅
- `GET /api/v1/infographics/generations/:id/variations` - Get variations ✅
- `POST /api/v1/conversations` - Create conversation ✅
- **Current Stack**: 
- OpenAI GPT-5 for text analysis ($0.004/request)
- Ideogram Turbo/V2 for image generation ($0.025-$0.080/image)
- Total cost: ~$0.029-$0.084 per infographic
- **Status**: ✅ Backend fully connected to AI Chat UI. All core endpoints implemented.
- **Current Limitations**: 
- Conversations stored in-memory (Map-based) - needs database persistence
- Extractions not persisted to database
- WebSocket not implemented (using polling instead)

## REST API Naming Conventions Summary

### Standard Compliant Endpoint Structure

All endpoints follow REST API best practices with sub-resource patterns:**Base Pattern:** `/api/v1/{resource}/{sub-resource}/{action}`**Key Endpoints:**

- `POST /api/v1/infographics/generations` - AI chat-based generation
- `POST /api/v1/infographics/generations/extractions` - Prompt extraction (GPT-5)
- `GET /api/v1/infographics/generations/:id/status` - Generation status
- `GET /api/v1/infographics/generations/:id/variations` - Get variations
- `GET /api/v1/conversations` - List conversations
- `POST /api/v1/conversations` - Create conversation

**AI Calls Organization:**

- All AI operations (GPT-5, Ideogram, Nano Banana Pro) are called within sub-resource endpoints
- No separate `/ai/` namespace - AI is part of the workflow
- Extraction calls GPT-5 → Generation calls GPT-5 + Image Model

## REST API Naming Conventions (Standard Compliant)

### Core Principles

1. **Use Nouns, Not Verbs** - Resources are nouns (`/generations`, not `/generate`)
2. **Pluralize Collections** - `/infographics`, `/conversations`
3. **Use Hyphens for Multi-Word** - `property-infographics` (if needed)
4. **Lowercase Only** - `/api/v1/infographics`
5. **HTTP Methods Define Actions** - POST creates, GET reads, PUT updates, DELETE removes
6. **Version in URL** - `/api/v1/`
7. **Sub-Resources for Related Operations** - `/infographics/generations`

### Complete API Endpoint Structure

```typescript
// ==========================================
// AI Generations (Sub-Resource)
// ==========================================
POST   /api/v1/infographics/generations              // Generate from chat prompt
GET    /api/v1/infographics/generations/:id/status   // Get generation status
GET    /api/v1/infographics/generations/:id/variations // Get variations
POST   /api/v1/infographics/generations/:id/regenerate // Regenerate

// ==========================================
// Prompt Extractions (Sub-Resource of Generations)
// ==========================================
POST   /api/v1/infographics/generations/extractions  // Extract property data
GET    /api/v1/infographics/generations/extractions/:id // Get extraction result

// ==========================================
// Conversations (Separate Resource)
// ==========================================
GET    /api/v1/conversations                         // List conversations
POST   /api/v1/conversations                         // Create conversation
GET    /api/v1/conversations/:id                     // Get conversation
PUT    /api/v1/conversations/:id                     // Update conversation
DELETE /api/v1/conversations/:id                     // Delete conversation
GET    /api/v1/conversations/:id/messages            // Get messages
POST   /api/v1/conversations/:id/messages            // Add message
```

### AI Calls Organization

All AI operations are organized under sub-resources:

- **AI Generation**: `/infographics/generations` (calls GPT-5 + Ideogram/Nano Banana)
- **AI Extraction**: `/infographics/generations/extractions` (calls GPT-5)
- **Conversations**: `/conversations` (manages chat context)

## Backend Tasks for AI Chat Integration

### Task 1: Create Generations Controller (AI Chat-Based Generation)

**File**: `api/src/modules/infographics/controllers/generations.controller.ts` (new)Create REST-compliant controller for AI generation:

```typescript
@ApiTags('infographics-generations')
@Controller('infographics/generations')
export class GenerationsController {
  @Post()
  @ApiOperation({ summary: 'Generate infographic from AI chat prompt' })
  async generateFromChat(@Body() dto: GenerateFromChatDto) {
    // Accepts: { prompt, conversationId?, style?, model?, variations? }
    // Internally calls extraction service, then generation
  }
  
  @Get(':id/status')
  async getStatus(@Param('id') id: string) { ... }
  
  @Get(':id/variations')
  async getVariations(@Param('id') id: string) { ... }
  
  @Post(':id/regenerate')
  async regenerate(@Param('id') id: string, @Body() dto: RegenerateDto) { ... }
}
```

**Endpoints:**

- `POST /api/v1/infographics/generations` - Generate from natural language prompt
- `GET /api/v1/infographics/generations/:id/status` - Get generation status
- `GET /api/v1/infographics/generations/:id/variations` - Get generated variations
- `POST /api/v1/infographics/generations/:id/regenerate` - Regenerate with modifications

### Task 2: Create Extractions Controller (Prompt Extraction)

**File**: `api/src/modules/infographics/controllers/extractions.controller.ts` (new)Create REST-compliant controller for prompt extraction:

```typescript
@ApiTags('infographics-extractions')
@Controller('infographics/generations/extractions')
export class ExtractionsController {
  @Post()
  @ApiOperation({ summary: 'Extract property data from natural language prompt' })
  async extract(@Body() dto: ExtractPropertyDataDto) {
    // Uses GPT-5 to extract structured property data
    // Returns: { id, extractedData, confidence, missingFields, suggestions }
  }
  
  @Get(':id')
  async getExtraction(@Param('id') id: string) { ... }
}
```

**Service File**: `api/src/modules/infographics/services/prompt-extractor.service.ts` (new)Service to extract structured property data from natural language:

- Use GPT-5 to parse user prompts and extract:
- Property type, address, price, beds, baths, sqft
- Listing type (for_sale/for_rent/sold)
- Features and amenities
- Agent information
- Handle partial information and ask clarifying questions
- Support conversational refinement ("make it more luxury", "add pool feature")
- Return confidence scores and missing field suggestions

### Task 3: Enhance AI Orchestrator for Chat Context

**File**: `api/src/modules/ai-generation/services/ai-orchestrator.service.ts` (modify)Add methods to:

- Generate multiple variations (3) as shown in UI
- Support style presets from chat UI
- Handle image upload references
- Return progress updates via WebSocket or polling

### Task 4: Create WebSocket Service for Real-time Updates

**File**: `api/src/modules/ai-chat/services/chat-websocket.service.ts` (new)Real-time generation progress:

- Emit step-by-step progress updates
- Send variation previews as they're generated
- Handle connection management and reconnection

### Task 5: Update Frontend API Client

**File**: `client/src/lib/api.ts` (modify)Add REST-compliant API methods following sub-resource pattern:

```typescript
// AI Generations API (Sub-Resource)
export const generationsApi = {
  // Generate from chat prompt
  generate: (data: GenerateFromChatInput) =>
    apiRequest<{ id: string; status: string; conversationId?: string }>(
      `${API_BASE}/infographics/generations`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
  
  // Get generation status
  getStatus: (id: string) =>
    apiRequest<GenerationStatus>(`${API_BASE}/infographics/generations/${id}/status`),
  
  // Get variations
  getVariations: (id: string) =>
    apiRequest<ResultVariation[]>(`${API_BASE}/infographics/generations/${id}/variations`),
  
  // Regenerate
  regenerate: (id: string, data: RegenerateInput) =>
    apiRequest<{ id: string; status: string }>(
      `${API_BASE}/infographics/generations/${id}/regenerate`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
};

// Prompt Extractions API (Sub-Resource)
export const extractionsApi = {
  // Extract property data from prompt
  extract: (data: ExtractPropertyDataInput) =>
    apiRequest<ExtractionResult>(
      `${API_BASE}/infographics/generations/extractions`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
  
  // Get extraction result
  getOne: (id: string) =>
    apiRequest<ExtractionResult>(`${API_BASE}/infographics/generations/extractions/${id}`),
};

// Conversations API (Separate Resource)
export const conversationsApi = {
  getAll: () => apiRequest<Conversation[]>(`${API_BASE}/conversations`),
  create: (data: CreateConversationInput) =>
    apiRequest<Conversation>(`${API_BASE}/conversations`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOne: (id: string) => apiRequest<Conversation>(`${API_BASE}/conversations/${id}`),
  update: (id: string, data: UpdateConversationInput) =>
    apiRequest<Conversation>(`${API_BASE}/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<void>(`${API_BASE}/conversations/${id}`, { method: 'DELETE' }),
  getMessages: (id: string) =>
    apiRequest<Message[]>(`${API_BASE}/conversations/${id}/messages`),
  addMessage: (id: string, data: AddMessageInput) =>
    apiRequest<Message>(`${API_BASE}/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

### Task 6: Connect AIChatBox to Real Backend

**File**: `client/src/components/ai-chat/AIChatBox.tsx` (modify)Replace mock generation in `handleGenerate()`:

- Call `generationsApi.generate()` instead of setTimeout simulation
- Optionally call `extractionsApi.extract()` first for preview
- Poll for status updates using `generationsApi.getStatus()`
- Get variations using `generationsApi.getVariations()`
- Map backend variations to UI `ResultVariation[]` format
- Handle errors and rate limiting
- Use `conversationsApi` for conversation management

### Task 7: Create Conversations Controller and Service

**File**: `api/src/modules/conversations/controllers/conversations.controller.ts` (new)Create REST-compliant conversations controller:

```typescript
@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  @Get()
  async findAll(@Req() req: any) { ... }
  
  @Post()
  async create(@Body() dto: CreateConversationDto, @Req() req: any) { ... }
  
  @Get(':id')
  async findOne(@Param('id') id: string) { ... }
  
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateConversationDto) { ... }
  
  @Delete(':id')
  async delete(@Param('id') id: string) { ... }
  
  @Get(':id/messages')
  async getMessages(@Param('id') id: string) { ... }
  
  @Post(':id/messages')
  async addMessage(@Param('id') id: string, @Body() dto: AddMessageDto) { ... }
}
```

**File**: `api/src/modules/conversations/services/conversation.service.ts` (new)Service to store conversations server-side:

- Save conversation history per user
- Link conversations to generated infographics
- Support conversation search and filtering
- Manage conversation metadata (title, favorites, etc.)

## Comprehensive LLM Comparison & Rankings for Infographic Generation

### Image Generation Models (Primary Focus)

| Rank | Model | Provider | Cost/Image | Resolution | Text Quality | Speed | Best For | Overall Score ||------|-------|----------|------------|------------|--------------|-------|----------|---------------|| 🥇 **1** | **Ideogram Turbo** | Ideogram | **$0.025** | 1024x1024 | ⭐⭐⭐⭐⭐ Excellent | ⚡⚡⚡ Fast | **Budget-conscious, high-volume production** | **9.5/10** || 🥈 **2** | **Nano Banana Pro** | Google | **$0.134** (2K)<br>$0.24 (4K) | 2K-4K | ⭐⭐⭐⭐⭐ Excellent | ⚡⚡ Medium | **Premium quality, high-res infographics** | **9.0/10** || 🥉 **3** | **Ideogram V2** | Ideogram | **$0.080** | 1024x1024 | ⭐⭐⭐⭐⭐ Excellent | ⚡⚡⚡ Fast | **Balanced quality/cost for professional use** | **8.5/10** || 4 | **FLUX Pro** | Black Forest Labs | $0.040 | 1024x1024 | ⭐⭐⭐⭐ Good | ⚡⚡ Medium | **Artistic infographics, less text-heavy** | **7.5/10** || 5 | **Stable Diffusion XL** | Stability AI | $0.035 | 1024x1024 | ⭐⭐⭐ Fair | ⚡⚡⚡ Fast | **Custom models, on-premise deployment** | **7.0/10** || 6 | **DALL-E 3** | OpenAI | $0.040 | 1024x1024 | ⭐⭐⭐⭐ Good | ⚡⚡ Medium | **General purpose, OpenAI ecosystem** | **7.0/10** || 7 | **Midjourney** | Midjourney | $0.04-$0.08 | Variable | ⭐⭐ Poor | ⚡ Slow | **Artistic visuals, NOT for text-heavy infographics** | **4.0/10** |

### Text Generation Models (For Analysis & Prompt Extraction)

| Rank | Model | Provider | Input Cost | Output Cost | Context | Best For | Overall Score ||------|-------|----------|------------|-------------|---------|----------|---------------|| 🥇 **1** | **GPT-5** | OpenAI | $0.004/request | $0.004/request | 128K | **Property analysis, structured extraction** | **9.5/10** || 🥈 **2** | **Claude 3.5 Sonnet** | Anthropic | $0.003/1K | $0.015/1K | 200K | **Long context, safety-focused tasks** | **8.5/10** || 🥉 **3** | **GPT-4o** | OpenAI | $0.01-0.03/1K | $0.06/1K | 128K | **Multimodal, general purpose** | **8.0/10** || 4 | **Gemini 1.5 Pro** | Google | $0.00125/1K | $0.005/1K | 1M+ | **Very long documents, Google ecosystem** | **7.5/10** || 5 | **Llama 3.1 405B** | Meta | Free (self-host) | Free | 128K | **Customization, on-premise, privacy** | **6.0/10** |

### Detailed Model Analysis

#### 🥇 Ideogram Turbo (RECOMMENDED - Best Value)

**Why Rank #1:**

- **Lowest cost** at $0.025/image while maintaining excellent text rendering
- **Fastest generation** time (~5-10 seconds)
- **Superior text legibility** - specifically designed for text-in-image
- **Perfect for infographics** - handles property data, prices, addresses beautifully
- **API-friendly** - clean REST API, easy integration

**When to Use:**

- Default choice for all subscription tiers
- High-volume generation (50+ infographics/month)
- Budget-conscious customers
- Fast turnaround requirements

**Cost per Infographic:** $0.033 (GPT-5 text + Ideogram Turbo image)

#### 🥈 Nano Banana Pro (PREMIUM OPTION)

**Why Rank #2:**

- **Highest resolution** - 2K ($0.134) and 4K ($0.24) options
- **Excellent text rendering** - Google's latest model optimized for text
- **Advanced editing** - supports detailed modifications
- **Web search grounding** - can incorporate real-time data

**When to Use:**

- Premium/Brokerage tier customers
- High-resolution print materials (4K)
- When quality > cost considerations
- Professional marketing materials

**Cost per Infographic:** $0.142 (GPT-5 text + Nano Banana Pro 2K) or $0.248 (4K)**Limitations:**

- 5x more expensive than Ideogram Turbo
- Slower generation time
- May be overkill for web/social media use

#### 🥉 Ideogram V2 (BALANCED OPTION)

**Why Rank #3:**

- **Better quality** than Turbo with reasonable cost
- **Same text rendering excellence** as Turbo
- **Good middle ground** between Turbo and Nano Banana Pro

**When to Use:**

- Team/Brokerage tiers wanting premium quality
- When Turbo quality isn't quite enough
- Professional presentations

**Cost per Infographic:** $0.088 (GPT-5 text + Ideogram V2)

### Recommended LLM Stack by Use Case

#### Budget Stack (Free/Solo Tiers)

```javascript
Text: GPT-5 ($0.004)
Image: Ideogram Turbo ($0.025)
Total: $0.033/infographic
```

**Best for:** High volume, cost-sensitive customers

#### Standard Stack (Team/Brokerage Tiers)

```javascript
Text: GPT-5 ($0.004)
Image: Ideogram V2 ($0.080)
Total: $0.088/infographic
```

**Best for:** Professional quality with reasonable cost

#### Premium Stack (Enterprise/High-Value Customers)

```javascript
Text: GPT-5 ($0.004)
Image: Nano Banana Pro 2K ($0.134)
Total: $0.142/infographic
```

**Best for:** Print materials, high-resolution needs

#### Ultra-Premium Stack (Special Projects)

```javascript
Text: GPT-5 ($0.004)
Image: Nano Banana Pro 4K ($0.24)
Total: $0.248/infographic
```

**Best for:** Large format printing, billboards, premium marketing

### Cost Comparison Table

| Stack | Text Model | Image Model | Cost/Infographic | Monthly Cost (1000 infos) | Best Tier ||-------|------------|-------------|-------------------|---------------------------|-----------|| Budget | GPT-5 | Ideogram Turbo | **$0.033** | **$33** | Free/Solo || Standard | GPT-5 | Ideogram V2 | $0.088 | $88 | Team || Premium | GPT-5 | Nano Banana 2K | $0.142 | $142 | Brokerage || Ultra | GPT-5 | Nano Banana 4K | $0.248 | $248 | Enterprise |

### Implementation Recommendation

**Phase 1 (Launch):** Use Ideogram Turbo as default

- Lowest cost, fastest, excellent quality
- Perfect for MVP and early customers

**Phase 2 (Growth):** Add Ideogram V2 as premium option

- Allow users to choose quality tier
- Charge premium for V2 generation

**Phase 3 (Scale):** Integrate Nano Banana Pro for enterprise

- Offer as "Ultra HD" option
- Target high-value customers willing to pay premium

### Cost Breakdown per Infographic (Updated)

| Component | Service | Cost | Notes ||-----------|---------|------|-------|| Text Analysis | GPT-5 | $0.004 | Property analysis + headline || Image Prompt | GPT-5 | $0.004 | Image prompt generation || Image Generation (Budget) | Ideogram Turbo | $0.025 | Default quality - RECOMMENDED || Image Generation (Standard) | Ideogram V2 | $0.080 | Premium quality || Image Generation (Premium) | Nano Banana Pro 2K | $0.134 | High-resolution option || Image Generation (Ultra) | Nano Banana Pro 4K | $0.24 | Maximum quality || **Total (Budget)** | | **$0.033** | Turbo option - Best value || **Total (Standard)** | | **$0.088** | V2 option || **Total (Premium)** | | **$0.142** | Nano Banana 2K || **Total (Ultra)** | | **$0.248** | Nano Banana 4K |**Monthly Cost Estimates** (assuming 70% margin):

- 100 infographics/month: $3.30 (cost) → $11.00 (price) - Budget stack
- 1,000 infographics/month: $33.00 (cost) → $110.00 (price) - Budget stack
- 10,000 infographics/month: $330.00 (cost) → $1,100.00 (price) - Budget stack

### Quick Decision Guide: Which LLM to Use When?

**Use Ideogram Turbo ($0.025/image) when:**

- ✅ Generating 50+ infographics/month
- ✅ Cost is primary concern
- ✅ Web/social media use (1024x1024 sufficient)
- ✅ Fast turnaround needed (<10 seconds)
- ✅ Default for Free/Solo/Team tiers

**Use Ideogram V2 ($0.080/image) when:**

- ✅ Need slightly better quality than Turbo
- ✅ Professional presentations
- ✅ Team/Brokerage tier customers
- ✅ Budget allows 3x cost increase

**Use Nano Banana Pro 2K ($0.134/image) when:**

- ✅ High-resolution print materials needed
- ✅ Premium/Brokerage tier customers
- ✅ Quality > cost considerations
- ✅ Professional marketing materials

**Use Nano Banana Pro 4K ($0.24/image) when:**

- ✅ Large format printing (billboards, posters)
- ✅ Maximum quality required
- ✅ Enterprise customers
- ✅ Cost not a primary concern

**Avoid Midjourney when:**

- ❌ Text-heavy infographics (poor text rendering)
- ❌ API integration needed (Discord-only)
- ❌ Consistent branding required
- ❌ Property listings with addresses/prices

**Avoid FLUX/Stable Diffusion when:**

- ❌ Text legibility is critical
- ❌ Property data must be accurate
- ❌ Consistent style across generations

### Final Recommendation

**Primary Stack (90% of use cases):**

- Text: GPT-5 ($0.004)
- Image: Ideogram Turbo ($0.025)
- **Total: $0.033/infographic**

**Why:** Best balance of cost, quality, and speed. Ideogram Turbo excels at text rendering which is critical for real estate infographics.**Premium Option (10% of use cases):**

- Text: GPT-5 ($0.004)
- Image: Nano Banana Pro 2K ($0.134)
- **Total: $0.142/infographic**

**Why:** When customers need high-resolution output for print materials or premium marketing.

## Subscription Model & Pricing Recommendations

### Recommended Pricing Strategy

**Tiered Subscription Model** (aligns with existing `PLAN_CONFIG`):

#### Free Tier

- **Price**: ₹0/month (FREE)
- **Limit**: 3 infographics/month
- **Target**: Individual agents testing the platform
- **Margin**: N/A (loss leader)

#### Solo Tier (Most Popular)

- **Price**: ₹2,399/month (~$29 USD)
- **Limit**: 50 infographics/month
- **Cost**: ₹1,650/month (~$20 USD at $0.033/infographic)
- **Margin**: 31% (₹749 profit)
- **Target**: Individual real estate agents
- **Value Prop**: "Perfect for agents generating 1-2 infographics per day"

#### Team Tier

- **Price**: ₹4,999/month (~$60 USD)
- **Limit**: 200 infographics/month
- **Cost**: ₹6,600/month (~$80 USD)
- **Margin**: -32% (loss leader, but drives volume)
- **Target**: Small teams (3-5 agents)
- **Note**: Consider increasing price to ₹6,999 for profitability

#### Brokerage Tier

- **Price**: ₹16,499/month (~$199 USD)
- **Limit**: 1,000 infographics/month
- **Cost**: ₹33,000/month (~$400 USD)
- **Margin**: -100% (major loss)
- **Target**: Large brokerages
- **Recommendation**: Increase to ₹24,999/month (~$300 USD) for 20% margin

#### API Starter Tier

- **Price**: ₹41,499/month (~$500 USD)
- **Limit**: 5,000 infographics/month
- **Cost**: ₹165,000/month (~$2,000 USD)
- **Margin**: -298% (unsustainable)
- **Target**: Developers/integrations
- **Recommendation**: Increase to ₹82,999/month (~$1,000 USD) for break-even

### Revised Pricing Recommendations

| Tier | Current Price | Recommended Price | Monthly Limit | Cost | Margin | Target ||------|---------------|-------------------|---------------|------|--------|--------|| Free | ₹0 | ₹0 | 3 | ₹0.10 | N/A | Testers || Solo | ₹2,399 | ₹2,999 | 50 | ₹1,650 | 45% | Individual agents || Team | ₹4,999 | ₹6,999 | 200 | ₹6,600 | 6% | Small teams || Brokerage | ₹16,499 | ₹24,999 | 1,000 | ₹33,000 | 20% | Large brokerages || API Starter | ₹41,499 | ₹82,999 | 5,000 | ₹165,000 | 50% | Developers || API Growth | ₹124,999 | ₹249,999 | 20,000 | ₹660,000 | 62% | Scale-ups || API Enterprise | Custom | Custom | Unlimited | Variable | 60%+ | Enterprise |

### Alternative: Usage-Based Pricing Model

Consider hybrid model:

- **Base Subscription**: ₹999/month (includes 10 infographics)
- **Overage**: ₹50 per additional infographic (~$0.60 USD)
- **Benefits**: 
- Lower barrier to entry
- Scales with usage
- More predictable costs for users
- Better margins on heavy users

### Pricing Psychology Recommendations

1. **Anchor High**: Show Enterprise tier first to make Solo look affordable
2. **Popular Badge**: Mark Solo as "Most Popular" (already done)
3. **Annual Discount**: Offer 20% off for annual payments
4. **Free Trial**: 7-day free trial with 10 infographics (not just 3)
5. **Referral Program**: Give 1 month free for successful referrals

## Implementation Priority

### Phase 1: Core Integration (Week 1-2)

1. Create ExtractionsController (`/api/v1/infographics/generations/extractions`)
2. Create GenerationsController (`/api/v1/infographics/generations`)
3. Implement PromptExtractorService (GPT-5 integration)
4. Update frontend API client with REST-compliant endpoints
5. Connect AIChatBox to backend API
6. Replace mock data with real generation
7. Add error handling and loading states

### Phase 2: Real-time Updates (Week 3)

1. Implement WebSocket service
2. Add progress tracking
3. Support multiple variations

### Phase 3: Enhanced Features (Week 4)

1. Conversation persistence
2. Style preset integration
3. Image upload support
4. Refinement prompts

### Phase 4: Optimization (Week 5+)

1. Caching for common prompts
2. Batch generation optimization
3. Cost monitoring dashboard
4. A/B testing for pricing

## Risk Mitigation

1. **Cost Overruns**: 

- Implement hard limits per tier ✅
- Add usage alerts at 80% of limit ✅
- Auto-downgrade if quota exceeded

2. **API Failures**:

- Retry logic with exponential backoff
- Fallback to demo mode if APIs unavailable
- Queue system for high load

## Next Steps - Phase 2: Database Persistence & Enhancements

### Priority 1: Database Persistence (High Priority)

**Task 1: Add Prisma Models for Conversations**Add to `api/prisma/schema.prisma`:

```prisma
model Conversation {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  propertyType String?
  priceRange   String?
  isFavorite   Boolean   @default(false)
  messages     Message[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId])
  @@index([createdAt])
}

model Message {
  id              String       @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  type            String       // 'user' | 'ai'
  content         String
  templateId      String?
  resultPreviews  Json?        // Array of result previews
  generationSteps Json?        // Array of generation steps
  currentStep     Int?
  timestamp       DateTime     @default(now())

  @@index([conversationId])
}
```

**Task 2: Add Prisma Model for Extractions**Add to `api/prisma/schema.prisma`:

```prisma
model Extraction {
  id             String       @id @default(cuid())
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  conversationId String?
  conversation   Conversation? @relation(fields: [conversationId], references: [id], onDelete: SetNull)
  prompt         String
  extractedData  Json         // ExtractedPropertyData
  confidence     Float
  missingFields  String[]     @default([])
  suggestions    String[]     @default([])
  createdAt      DateTime     @default(now())

  @@index([userId])
  @@index([conversationId])
}
```

**Task 3: Migrate ConversationService to Prisma**

- Update `api/src/modules/conversations/services/conversation.service.ts`
- Replace in-memory Map storage with Prisma queries
- Update all CRUD operations to use database

**Task 4: Persist Extractions**

- Update `api/src/modules/infographics/controllers/extractions.controller.ts`
- Store extraction results in database after GPT-5 extraction
- Link extractions to conversations when conversationId is provided

### Priority 2: Testing & Validation (Medium Priority)

- Test all API endpoints end-to-end
- Verify error handling scenarios (rate limits, quota exceeded)
- Test usage limit enforcement
- Validate conversation persistence after database migration

### Priority 3: Optional Enhancements (Low Priority)

- **WebSocket Service**: Replace polling with real-time WebSocket updates