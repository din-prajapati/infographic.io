import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { OpenAiService } from './openai.service';
import { IdeogramService } from './ideogram.service';
import { getTotalCost } from '../../../config/ai-models.config';

@Injectable()
export class AiOrchestrator {
  constructor(
    @Inject(OpenAiService) private openAiService: OpenAiService,
    @Inject(IdeogramService) private ideogramService: IdeogramService,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {}

  async generateInfographic(
    infographicId: string,
    propertyData: any,
    options?: { variations?: number; style?: string },
    progressGateway?: any, // Optional WebSocket gateway for progress updates
  ): Promise<void> {
    const startTime = Date.now();
    const variations = options?.variations || 1;
    const style = options?.style;
    
    try {
      const isDemoMode = process.env.DEMO_MODE === 'true';
      let headline: string;
      let imageUrls: string[] = [];
      
      console.log(`📝 [Orchestrator] Starting infographic generation ${infographicId} - Variations: ${variations}, Demo mode: ${isDemoMode}`);
      
      // Emit step 1: Analyzing property
      progressGateway?.emitProgress(infographicId, {
        status: 'processing',
        step: 1,
        stepLabel: 'Analyzing property details...',
        progress: 20,
      });
      
      if (isDemoMode) {
        console.log(`🎭 [Orchestrator] Demo mode enabled - generating mock infographic ${infographicId}`);
        headline = this.generateDemoHeadline(propertyData);
        // Generate multiple demo URLs for variations
        for (let i = 0; i < variations; i++) {
          imageUrls.push(this.generateDemoImageUrl(propertyData, i));
        }
      } else {
        try {
          console.log(`📊 [Orchestrator] Analyzing property with OpenAI for ${infographicId}...`);
          headline = await this.openAiService.analyzeProperty(propertyData);
          console.log(`✍️ [Orchestrator] Generated headline for ${infographicId}: ${headline}`);
        } catch (openaiError: any) {
          console.error(`❌ [Orchestrator] OpenAI failed for ${infographicId}:`, openaiError?.message || openaiError);
          progressGateway?.emitProgress(infographicId, {
            status: 'failed',
            errorMessage: `OpenAI generation failed: ${openaiError?.message || 'Unknown error'}`,
          });
          throw new Error(`OpenAI generation failed: ${openaiError?.message || 'Unknown error'}`);
        }
        
        // Emit step 2: Generating image prompt
        progressGateway?.emitProgress(infographicId, {
          status: 'processing',
          step: 2,
          stepLabel: 'Creating image prompt...',
          progress: 40,
        });
        
        try {
          console.log(`🎨 [Orchestrator] Generating image prompt for ${infographicId}...`);
          let imagePrompt = await this.openAiService.generateImagePrompt(propertyData, headline);
          
          // Apply style preset if provided
          if (style) {
            imagePrompt = this.applyStylePreset(imagePrompt, style);
          }
          
          // Emit step 3: Generating images
          progressGateway?.emitProgress(infographicId, {
            status: 'processing',
            step: 3,
            stepLabel: `Generating ${variations} image${variations > 1 ? 's' : ''}...`,
            progress: 60,
          });
          
          console.log(`🎨 [Orchestrator] Calling Ideogram for ${infographicId} (${variations} variations)...`);
          const aiModel = propertyData.aiModel || 'ideogram-turbo';
          
          // Generate multiple variations
          const generationPromises = [];
          for (let i = 0; i < variations; i++) {
            // Add variation modifier to prompt for diversity
            const variationPrompt = variations > 1 
              ? `${imagePrompt} Variation ${i + 1}: ${this.getVariationModifier(i, style)}`
              : imagePrompt;
            
            generationPromises.push(
              this.ideogramService.generateImage(variationPrompt, aiModel)
            );
          }
          
          imageUrls = await Promise.all(generationPromises);
          console.log(`🖼️ [Orchestrator] Generated ${imageUrls.length} image URLs for ${infographicId}`);
          
          // Emit step 4: Processing images
          progressGateway?.emitProgress(infographicId, {
            status: 'processing',
            step: 4,
            stepLabel: 'Processing images...',
            progress: 80,
          });
        } catch (ideogramError: any) {
          console.error(`❌ [Orchestrator] Ideogram failed for ${infographicId}:`, ideogramError?.message || ideogramError);
          progressGateway?.emitProgress(infographicId, {
            status: 'failed',
            errorMessage: `Image generation failed: ${ideogramError?.message || 'Unknown error'}`,
          });
          throw new Error(`Image generation failed: ${ideogramError?.message || 'Unknown error'}`);
        }
      }
      
      // Use first image URL as primary (for backward compatibility)
      const imageUrl = imageUrls[0] || '';

      const aiModel = propertyData.aiModel || 'ideogram-turbo';
      const costUsd = isDemoMode ? 0 : getTotalCost(aiModel);

      try {
        // Emit step 5: Finalizing
        progressGateway?.emitProgress(infographicId, {
          status: 'processing',
          step: 5,
          stepLabel: 'Finalizing...',
          progress: 90,
        });
        
        console.log(`💾 [Orchestrator] Updating infographic ${infographicId} with imageUrl and status=completed...`);
        await prisma.infographic.update({
          where: { id: infographicId },
          data: {
            imageUrl,
            status: 'completed',
          },
        });
        console.log(`✅ [Orchestrator] Infographic ${infographicId} status updated to completed`);
      } catch (updateError: any) {
        console.error(`❌ [Orchestrator] Failed to update infographic ${infographicId}:`, updateError?.message || updateError);
        // Retry once on connection error
        if (updateError?.message?.includes('connection') || updateError?.code === 'P1011') {
          console.log(`🔄 [Orchestrator] Retrying database update for ${infographicId}...`);
          try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
            await this.prisma.infographic.update({
              where: { id: infographicId },
              data: {
                imageUrl,
                status: 'completed',
              },
            });
            console.log(`✅ [Orchestrator] Retry successful for ${infographicId}`);
          } catch (retryError: any) {
            console.error(`❌ [Orchestrator] Retry failed for ${infographicId}:`, retryError?.message || retryError);
            throw new Error(`Database update failed after retry: ${retryError?.message || 'Unknown error'}`);
          }
        } else {
          throw new Error(`Database update failed: ${updateError?.message || 'Unknown error'}`);
        }
      }

      try {
        const infographic = await this.prisma.infographic.findUnique({
          where: { id: infographicId },
        });

        console.log(`📊 [Orchestrator] Creating usage record for ${infographicId}...`);
        await this.prisma.usageRecord.create({
          data: {
            userId: infographic.userId,
            organizationId: infographic.organizationId,
            infographicId,
            aiModel,
            costUsd,
            creditsUsed: 1,
          },
        });
        console.log(`✅ [Orchestrator] Usage record created for ${infographicId}`);
      } catch (usageError: any) {
        console.error(`❌ [Orchestrator] Failed to create usage record for ${infographicId}:`, usageError?.message || usageError);
        // Don't throw - usage record creation failure shouldn't fail the infographic
      }

      // Store variations in propertyData for retrieval
      const updatedPropertyData = {
        ...propertyData,
        variations: imageUrls.map((url, index) => ({
          id: `${infographicId}_var_${index + 1}`,
          imageUrl: url,
          title: `Variation ${index + 1}`,
          description: this.getVariationDescription(index, style),
        })),
      };

      // Update infographic with variations data
      await prisma.infographic.update({
        where: { id: infographicId },
        data: {
          propertyData: updatedPropertyData as any,
        },
      });

      const elapsed = Date.now() - startTime;
      console.log(`✅ [Orchestrator] Infographic ${infographicId} completed in ${elapsed}ms. Cost: $${costUsd}${isDemoMode ? ' (Demo Mode)' : ''}`);
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ [Orchestrator] Infographic ${infographicId} failed after ${elapsed}ms:`, error?.message || error);
      throw error;
    }
  }

  private applyStylePreset(prompt: string, style: string): string {
    const styleModifiers: Record<string, string> = {
      modern: 'Modern, minimalist design with clean lines and contemporary typography',
      classic: 'Classic, traditional design with elegant serif fonts and timeless aesthetics',
      luxury: 'Luxury, high-end design with premium materials and sophisticated color palette',
      minimal: 'Minimalist design with lots of white space and simple, clean elements',
      vibrant: 'Vibrant, colorful design with bold typography and energetic color scheme',
      professional: 'Professional, corporate design with formal typography and conservative colors',
    };

    const modifier = styleModifiers[style] || '';
    return modifier ? `${prompt}. Style: ${modifier}` : prompt;
  }

  private getVariationModifier(index: number, style?: string): string {
    const modifiers = [
      'slightly different color scheme',
      'alternative layout arrangement',
      'different typography emphasis',
      'varied visual hierarchy',
      'alternative composition',
    ];
    return modifiers[index % modifiers.length];
  }

  private getVariationDescription(index: number, style?: string): string {
    const descriptions = [
      'Classic layout with traditional styling',
      'Modern design with contemporary elements',
      'Bold layout with vibrant colors',
    ];
    return descriptions[index % descriptions.length];
  }

  private generateDemoHeadline(propertyData: any): string {
    const templates = [
      `Stunning ${propertyData.beds}BR Home in ${propertyData.address.split(',')[0]}`,
      `Luxury Living at ${propertyData.address.split(',')[0]}`,
      `Your Dream Home Awaits - ${propertyData.beds}BR/${propertyData.baths}BA`,
      `Modern ${propertyData.propertyType} - ${propertyData.sqft} sqft`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateDemoImageUrl(propertyData: any, variationIndex: number = 0): string {
    // Different Unsplash images for variations
    const demoImages = [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=1000&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=1000&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=1000&fit=crop&q=80',
    ];
    return demoImages[variationIndex % demoImages.length];
  }
}
