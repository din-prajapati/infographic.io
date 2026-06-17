import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { prisma } from '../../../database/prisma.client';
import { AiOrchestrator } from '../../ai-generation/services/ai-orchestrator.service';
import { TemplatesService } from '../../templates/services/templates.service';
import { GenerateInfographicDto } from '../dto/generate-infographic.dto';
import { UsageLimitService } from './usage-limit.service';

@Injectable()
export class InfographicsService {
  constructor(
    @Inject(AiOrchestrator) private aiOrchestrator: AiOrchestrator,
    @Inject(TemplatesService) private templatesService: TemplatesService,
    @Inject(UsageLimitService) private usageLimitService: UsageLimitService,
  ) {}

  async generate(dto: GenerateInfographicDto, userId: string, organizationId: string | null) {
    console.log(`🚀 [Service] Starting generate: userId=${userId}, orgId=${organizationId}`);

    let organization = organizationId
      ? await prisma.organization.findUnique({ where: { id: organizationId } })
      : null;

    // Heal users with no organization: create a default org and link it to the user
    if (!organization) {
      console.log(`📋 [Service] No valid organization for user ${userId} — creating default org`);
      organization = await prisma.organization.create({
        data: {
          name: 'My Organization',
          planTier: 'free',
          monthlyLimit: 3,
        },
      });
      // Write the new org ID back to the user record so all future requests resolve correctly
      await prisma.user.update({
        where: { id: userId },
        data: { organizationId: organization.id },
      });
      console.log(`✅ [Service] Default organization created and linked: ${organization.id}`);
    } else {
      console.log(`✅ [Service] Organization found: ${organization.id}`);
    }

    // Always derive organizationId from the resolved organization object
    organizationId = organization.id;

    await this.usageLimitService.assertCanGenerate(organizationId, 1);

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
