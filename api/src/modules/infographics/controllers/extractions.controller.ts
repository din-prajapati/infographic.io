import { Controller, Post, Get, Body, Param, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PromptExtractorService } from '../services/prompt-extractor.service';
import { ExtractPropertyDataDto } from '../dto/extract-property-data.dto';

@ApiTags('infographics-extractions')
@Controller('infographics/generations/extractions')
export class ExtractionsController {
  constructor(
    @Inject(PromptExtractorService) private readonly extractorService: PromptExtractorService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extract property data from natural language prompt' })
  async extract(@Body() dto: ExtractPropertyDataDto, @Req() req: any) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id; // Match pattern from GenerationsController
    const conversationId = dto.conversationId; // Already in DTO
    
    console.log(`🔍 [ExtractionsController] Received extraction request from user ${userId}`);
    
    try {
      if (!dto.prompt || dto.prompt.trim().length === 0) {
        throw new Error('Prompt is required and cannot be empty');
      }

      const result = await this.extractorService.extractPropertyData(
        dto.prompt,
        dto.context,
        userId,
        organizationId,
        conversationId,
      );
      
      console.log(`✅ [ExtractionsController] Extraction completed: ${result.id}`);
      return result;
    } catch (error: any) {
      console.error(`❌ [ExtractionsController] Extraction failed:`, error?.message || error);
      
      // Handle specific error types
      if (error?.message?.includes('OpenAI') || error?.message?.includes('API')) {
        throw new Error(`AI service error: ${error.message}. Please try again later.`);
      }
      
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get extraction result by ID' })
  async getExtraction(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.extractorService.getExtraction(id, userId);
  }
}

