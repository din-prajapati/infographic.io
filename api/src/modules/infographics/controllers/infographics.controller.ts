import { Controller, Post, Get, Body, Param, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { InfographicsService } from '../services/infographics.service';
import { GenerateInfographicDto } from '../dto/generate-infographic.dto';

@ApiTags('infographics')
@Controller('infographics')
export class InfographicsController {
  constructor(
    @Inject(InfographicsService) private readonly infographicsService: InfographicsService
  ) {}

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate infographic from property data' })
  async generate(@Body() dto: GenerateInfographicDto, @Req() req: any) {
    console.log('📝 [Controller] Received generate request');
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id;
    console.log(`👤 User: ${userId}, Organization: ${organizationId}`);
    const result = await this.infographicsService.generate(dto, userId, organizationId);
    console.log(`✅ [Controller] Generate endpoint returning: ${JSON.stringify(result)}`);
    return result;
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get infographic by ID' })
  async findOne(@Param('id') id: string) {
    return this.infographicsService.findOne(id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user infographics' })
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    return this.infographicsService.findByUser(userId);
  }
}
