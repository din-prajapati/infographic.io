import { Controller, Post, Get, Body, Param, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GenerationsService } from '../services/generations.service';
import { GenerateFromChatDto, RegenerateDto } from '../dto/generate-from-chat.dto';

@ApiTags('infographics-generations')
@Controller('infographics/generations')
export class GenerationsController {
  constructor(
    @Inject(GenerationsService) private readonly generationsService: GenerationsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate infographic from AI chat prompt' })
  async generateFromChat(@Body() dto: GenerateFromChatDto, @Req() req: any) {
    console.log(`📝 [GenerationsController] Received generation request from user ${req.user.id}`);
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id;
    
    try {
      // Validate input
      if (!dto.prompt || dto.prompt.trim().length === 0) {
        throw new Error('Prompt is required and cannot be empty');
      }

      const result = await this.generationsService.generateFromChat(dto, userId, organizationId);
      console.log(`✅ [GenerationsController] Generation started: ${result.id}`);
      return result;
    } catch (error: any) {
      console.error(`❌ [GenerationsController] Generation failed:`, error?.message || error);
      throw error; // Let NestJS handle the error response
    }
  }

  @Get(':id/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get generation status' })
  async getStatus(@Param('id') id: string) {
    try {
      return await this.generationsService.getStatus(id);
    } catch (error: any) {
      console.error(`❌ [GenerationsController] Status check failed:`, error?.message || error);
      throw error;
    }
  }

  @Get(':id/variations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get generated variations' })
  async getVariations(@Param('id') id: string) {
    try {
      return await this.generationsService.getVariations(id);
    } catch (error: any) {
      console.error(`❌ [GenerationsController] Get variations failed:`, error?.message || error);
      throw error;
    }
  }

  @Post(':id/regenerate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate infographic with modifications' })
  async regenerate(@Param('id') id: string, @Body() dto: RegenerateDto) {
    try {
      return await this.generationsService.regenerate(id, dto.modifications || [], dto.style);
    } catch (error: any) {
      console.error(`❌ [GenerationsController] Regenerate failed:`, error?.message || error);
      throw error;
    }
  }
}

