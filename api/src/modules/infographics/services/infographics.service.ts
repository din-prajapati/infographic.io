import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '../../../database/prisma.client';
import { AiOrchestrator } from '../../ai-generation/services/ai-orchestrator.service';
import { TemplatesService } from '../../templates/services/templates.service';
import { GenerateInfographicDto } from '../dto/generate-infographic.dto';

@Injectable()
export class InfographicsService {
  constructor(
    @Inject(AiOrchestrator) private aiOrchestrator: AiOrchestrator,
    @Inject(TemplatesService) private templatesService: TemplatesService,
  ) {}

  async generate(dto: GenerateInfographicDto, userId: string, organizationId: string) {
    console.log(`🚀 [Service] Starting generate: userId=${userId}, orgId=${organizationId}`);
    
    let organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    // If organization doesn't exist, create a default one for the user
    if (!organization) {
      console.log(`📋 [Service] Organization not found, creating default organization for user ${userId}`);
      organization = await prisma.organization.create({
        data: {
          id: organizationId,
          name: 'My Organization',
          planTier: 'free',
        },
      });
      console.log(`✅ [Service] Default organization created: ${organization.id}`);
    } else {
      console.log(`✅ [Service] Organization found: ${organization.id}`);
    }

    const tierLimits = {
      free: 3,
      solo: 50,
      team: 200,
      brokerage: 1000,
      api_starter: 5000,
      api_growth: 20000,
      api_enterprise: Infinity,
    };

    const monthlyLimit = tierLimits[organization.planTier] || 3;

    if (monthlyLimit !== Infinity) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const usageCount = await prisma.usageRecord.count({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(currentYear, currentMonth, 1),
            lt: new Date(currentYear, currentMonth + 1, 1),
          },
        },
      });

      // Usage alerts are handled by UsageAlertService (called after generation completes)

      if (usageCount >= monthlyLimit) {
        throw new BadRequestException(
          `Monthly limit of ${monthlyLimit} infographics reached for ${organization.planTier} tier. Please upgrade your plan or wait until next month.`
        );
      }
    }

    console.log(`📋 [Service] Selecting template...`);
    const templateId = await this.templatesService.selectBestTemplate(dto);
    console.log(`✅ [Service] Template selected: ${templateId}`);

    console.log(`💾 [Service] Creating infographic record in database...`);
    const infographic = await prisma.infographic.create({
      data: {
        userId,
        organizationId,
        templateId,
        propertyData: dto as any,
        imageUrl: '',
        aiModel: dto.aiModel || 'ideogram-turbo',
        status: 'processing',
      },
    });
    console.log(`✅ [Service] Infographic record created: ${infographic.id}`);

    // Fire and forget using Promise.resolve().then() for reliable async execution
    console.log(`🔥 [Service] Triggering async generation for ${infographic.id}...`);
    
    Promise.resolve().then(async () => {
      try {
        console.log(`⏳ [BG] Starting background generation for ${infographic.id}`);
        await this.aiOrchestrator.generateInfographic(infographic.id, dto);
        console.log(`✅ [BG] Background generation completed for ${infographic.id}`);
      } catch (error: any) {
        console.error(`❌ [BG] Background generation failed for ${infographic.id}:`, error);
        let errorMessage = error?.message || 'Unknown error during generation';
        
        if (error?.status === 429 || error?.code === 'insufficient_quota') {
          errorMessage = 'OpenAI API quota exceeded. Please add credits to your OpenAI account.';
        } else if (error?.code === 'invalid_api_key') {
          errorMessage = 'Invalid API key. Please check your API key configuration.';
        }
        
        console.error(`❌ [BG] Error: ${errorMessage}`);
        
        // Retry database update with exponential backoff
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            await prisma.infographic.update({
              where: { id: infographic.id },
              data: { status: 'failed', errorMessage },
            });
            console.log(`✅ [BG] Updated ${infographic.id} to failed status (attempt ${attempt})`);
            break;
          } catch (dbError: any) {
            console.error(`❌ [BG] DB update attempt ${attempt} failed:`, dbError?.message);
            if (attempt < 3) {
              await new Promise(r => setTimeout(r, 1000 * attempt));
            }
          }
        }
      }
    });
    
    console.log(`✅ [Service] Background job triggered for ${infographic.id}`);

    return {
      id: infographic.id,
      status: 'processing',
      message: 'Infographic generation started. Check status with GET /infographics/:id',
    };
  }

  async findOne(id: string) {
    const infographic = await prisma.infographic.findUnique({
      where: { id },
      include: {
        template: true,
        usageRecord: true,
      },
    });

    if (!infographic) {
      throw new NotFoundException(`Infographic ${id} not found`);
    }

    // Ensure createdAt is properly serialized for frontend
    return {
      ...infographic,
      createdAt: infographic.createdAt instanceof Date ? infographic.createdAt.toISOString() : infographic.createdAt,
    };
  }

  async findByUser(userId: string) {
    const infographics = await prisma.infographic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        template: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    // Ensure createdAt is properly serialized for frontend
    return infographics.map(inf => ({
      ...inf,
      createdAt: inf.createdAt instanceof Date ? inf.createdAt.toISOString() : inf.createdAt,
    }));
  }
}
