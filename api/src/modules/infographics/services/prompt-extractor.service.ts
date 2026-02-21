import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { OpenAiService } from '../../ai-generation/services/openai.service';

export interface ExtractedPropertyData {
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
}

export interface ExtractionResult {
  id: string;
  extractedData: ExtractedPropertyData;
  confidence: number;
  missingFields: string[];
  suggestions: string[];
  createdAt: Date;
  conversationId?: string | null;
}

@Injectable()
export class PromptExtractorService {
  constructor(
    @Inject(OpenAiService) private openAiService: OpenAiService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {}

  async extractPropertyData(
    prompt: string,
    conversationContext?: Array<{ role: string; content: string }>,
    userId?: string,
    organizationId?: string,
    conversationId?: string,
  ): Promise<ExtractionResult> {
    console.log(`🔍 [Extractor] Extracting property data from prompt: "${prompt.substring(0, 100)}..."`);

    const isDemoMode = process.env.DEMO_MODE === 'true';
    
    if (isDemoMode) {
      return this.generateDemoExtraction(prompt, userId, conversationId);
    }

    try {
      // Build context from conversation history if available
      const contextMessages = conversationContext || [];
      const systemPrompt = `You are a real estate data extraction assistant. Extract structured property information from natural language prompts.

Extract the following fields if mentioned:
- propertyType: residential, commercial, or land
- listingType: for_sale, for_rent, or sold
- address: full property address
- price: numeric price value
- beds: number of bedrooms
- baths: number of bathrooms
- sqft: square footage
- features: array of property features/amenities
- agent: object with name, brokerage, brandColors (array of hex colors), logoUrl

Return ONLY valid JSON in this exact format:
{
  "propertyType": "residential" | "commercial" | "land" | null,
  "listingType": "for_sale" | "for_rent" | "sold" | null,
  "address": "string" | null,
  "price": number | null,
  "beds": number | null,
  "baths": number | null,
  "sqft": number | null,
  "features": ["string"] | null,
  "agent": {
    "name": "string" | null,
    "brokerage": "string" | null,
    "brandColors": ["#hex"] | null,
    "logoUrl": "string" | null
  } | null
}

If a field is not mentioned, use null. Be precise with numbers and addresses.`;

      const userPrompt = `Extract property data from this prompt: "${prompt}"

${contextMessages.length > 0 ? `\nPrevious conversation context:\n${contextMessages.map(m => `${m.role}: ${m.content}`).join('\n')}` : ''}

Return the extracted data as JSON.`;

      // Call GPT-5 for extraction
      const openai = (this.openAiService as any).openai;
      if (!openai) {
        throw new Error('OpenAI service not configured');
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        // Note: gpt-5 only supports default temperature (1), custom values are not supported
      });

      const extractedJson = JSON.parse(response.choices[0].message.content || '{}');
      const extractedData: ExtractedPropertyData = {
        propertyType: extractedJson.propertyType || undefined,
        listingType: extractedJson.listingType || undefined,
        address: extractedJson.address || undefined,
        price: extractedJson.price || undefined,
        beds: extractedJson.beds || undefined,
        baths: extractedJson.baths || undefined,
        sqft: extractedJson.sqft || undefined,
        features: extractedJson.features || undefined,
        agent: extractedJson.agent || undefined,
      };

      // Calculate confidence and missing fields
      const requiredFields = ['propertyType', 'address', 'price', 'beds', 'baths', 'sqft'];
      const missingFields = requiredFields.filter(field => !extractedData[field as keyof ExtractedPropertyData]);
      const confidence = 1 - (missingFields.length / requiredFields.length);

      // Generate suggestions for missing fields
      const suggestions = this.generateSuggestions(missingFields, extractedData);

      console.log(`✅ [Extractor] Extraction completed, confidence: ${confidence.toFixed(2)}`);

      // Persist extraction to database if userId provided
      if (userId) {
        if (!this.prisma) {
          console.error('❌ [Extractor] PrismaService is undefined');
          throw new Error('PrismaService is not available - database module may not be initialized');
        }
        
        if (!this.prisma || typeof (this.prisma as any).extraction === 'undefined') {
          const availableModels = this.prisma ? Object.keys(this.prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')).join(', ') : 'none (PrismaService undefined)';
          console.warn('⚠️ [Extractor] Prisma client missing extraction model. Falling back to in-memory result. Available models:', availableModels);
        } else {
          // Validate conversationId exists in DB before using as FK
          let validConversationId: string | null = null;
          if (conversationId) {
            const conversation = await this.prisma.conversation.findUnique({
              where: { id: conversationId },
              select: { id: true },
            }).catch(() => null);

            if (conversation) {
              validConversationId = conversation.id;
            } else {
              console.warn(`⚠️ [Extractor] Conversation ${conversationId} not found in DB, storing extraction without conversation link`);
            }
          }

          const persisted = await this.prisma.extraction.create({
            data: {
              userId,
              conversationId: validConversationId,
              prompt,
              extractedData: extractedData as any,
              confidence,
              missingFields,
              suggestions,
            },
          });

          console.log(`💾 [Extractor] Extraction persisted: ${persisted.id}`);


          return {
            id: persisted.id,
            extractedData,
            confidence,
            missingFields,
            suggestions,
            createdAt: persisted.createdAt,
            conversationId: persisted.conversationId,
          };
        }
      }

      // Fallback: return in-memory result if no userId (backward compatibility)
      const extractionId = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: extractionId,
        extractedData,
        confidence,
        missingFields,
        suggestions,
        createdAt: new Date(),
        conversationId,
      };
    } catch (error: any) {
      console.error(`❌ [Extractor] Extraction failed:`, error?.message || error);
      throw new Error(`Failed to extract property data: ${error?.message || 'Unknown error'}`);
    }
  }

  private generateSuggestions(missingFields: string[], extractedData: ExtractedPropertyData): string[] {
    const suggestions: string[] = [];

    if (missingFields.includes('address')) {
      suggestions.push('Could you provide the property address?');
    }
    if (missingFields.includes('price')) {
      suggestions.push('What is the listing price?');
    }
    if (missingFields.includes('beds')) {
      suggestions.push('How many bedrooms does the property have?');
    }
    if (missingFields.includes('baths')) {
      suggestions.push('How many bathrooms does the property have?');
    }
    if (missingFields.includes('sqft')) {
      suggestions.push('What is the square footage of the property?');
    }
    if (missingFields.includes('propertyType')) {
      suggestions.push('Is this a residential, commercial, or land property?');
    }

    return suggestions;
  }

  private async generateDemoExtraction(
    prompt: string,
    userId?: string,
    conversationId?: string,
  ): Promise<ExtractionResult> {
    // Demo mode - extract basic info from prompt
    const lowerPrompt = prompt.toLowerCase();
    const extractedData: ExtractedPropertyData = {
      propertyType: lowerPrompt.includes('commercial') ? 'commercial' : 
                    lowerPrompt.includes('land') ? 'land' : 'residential',
      listingType: lowerPrompt.includes('rent') ? 'for_rent' :
                   lowerPrompt.includes('sold') ? 'sold' : 'for_sale',
      address: this.extractAddressFromPrompt(prompt),
      price: this.extractPriceFromPrompt(prompt),
      beds: this.extractNumberFromPrompt(prompt, ['bed', 'bedroom', 'br']),
      baths: this.extractNumberFromPrompt(prompt, ['bath', 'bathroom', 'ba']),
      sqft: this.extractNumberFromPrompt(prompt, ['sqft', 'sq ft', 'square feet', 'square foot']),
    };

    const requiredFields = ['propertyType', 'address', 'price', 'beds', 'baths', 'sqft'];
    const missingFields = requiredFields.filter(field => !extractedData[field as keyof ExtractedPropertyData]);
    const confidence = 1 - (missingFields.length / requiredFields.length);

    const suggestions = this.generateSuggestions(missingFields, extractedData);

    // Persist demo extraction if userId provided
    if (userId && this.prisma && typeof (this.prisma as any).extraction !== 'undefined') {
      // Validate conversationId exists in DB before using as FK
      let validConversationId: string | null = null;
      if (conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { id: true },
        }).catch(() => null);

        if (conversation) {
          validConversationId = conversation.id;
        }
      }

      const persisted = await this.prisma.extraction.create({
        data: {
          userId,
          conversationId: validConversationId,
          prompt,
          extractedData: extractedData as any,
          confidence,
          missingFields,
          suggestions,
        },
      });

      return {
        id: persisted.id,
        extractedData,
        confidence,
        missingFields,
        suggestions,
        createdAt: persisted.createdAt,
        conversationId: persisted.conversationId,
      };
    }

    return {
      id: `demo-extraction-${Date.now()}`,
      extractedData,
      confidence,
      missingFields,
      suggestions,
      createdAt: new Date(),
      conversationId,
    };
  }

  private extractAddressFromPrompt(prompt: string): string | undefined {
    // Simple regex to find addresses (basic pattern)
    const addressMatch = prompt.match(/\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|circle|cir)/i);
    return addressMatch ? addressMatch[0] : undefined;
  }

  private extractPriceFromPrompt(prompt: string): number | undefined {
    // Extract price patterns like $450000, $450k, 450000, etc.
    const priceMatch = prompt.match(/\$?(\d{1,3}(?:,\d{3})*(?:k|K)?)/);
    if (priceMatch) {
      let price = priceMatch[1].replace(/,/g, '');
      if (price.toLowerCase().endsWith('k')) {
        price = price.slice(0, -1) + '000';
      }
      return parseInt(price, 10);
    }
    return undefined;
  }

  private extractNumberFromPrompt(prompt: string, keywords: string[]): number | undefined {
    for (const keyword of keywords) {
      const regex = new RegExp(`(\\d+)\\s*${keyword}`, 'i');
      const match = prompt.match(regex);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return undefined;
  }

  async getExtraction(id: string, userId?: string): Promise<ExtractionResult> {
    if (!this.prisma || typeof (this.prisma as any).extraction === 'undefined') {
      throw new NotFoundException(`Extraction ${id} not found - Prisma client not available`);
    }
    
    const extraction = await this.prisma.extraction.findUnique({
      where: { id },
    });

    if (!extraction) {
      throw new NotFoundException(`Extraction ${id} not found`);
    }

    // Verify ownership if userId provided
    if (userId && extraction.userId !== userId) {
      throw new ForbiddenException('Access denied to this extraction');
    }

    return {
      id: extraction.id,
      extractedData: extraction.extractedData as ExtractedPropertyData,
      confidence: extraction.confidence,
      missingFields: extraction.missingFields,
      suggestions: extraction.suggestions,
      createdAt: extraction.createdAt,
      conversationId: extraction.conversationId,
    };
  }
}

