import { Controller, Post, Put, Get, Delete, Body, Param, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DesignsService } from '../services/designs.service';
import { CreateDesignDto } from '../dto/create-design.dto';

@ApiTags('canvas-templates')
@Controller('canvas-templates')
export class CanvasTemplatesController {
  constructor(
    @Inject(DesignsService) private readonly designsService: DesignsService
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new canvas template' })
  async create(@Body() dto: CreateDesignDto, @Req() req: any) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id;
    // Force type to template
    const templateDto = { ...dto, type: 'template' as const };
    return this.designsService.save(userId, organizationId, templateDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing canvas template' })
  async update(@Param('id') id: string, @Body() dto: CreateDesignDto, @Req() req: any) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id;
    // Force type to template
    const templateDto = { ...dto, type: 'template' as const };
    return this.designsService.save(userId, organizationId, templateDto, id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all canvas templates for current user' })
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    const allDesigns = await this.designsService.findAll(userId);
    // Filter to only templates
    return allDesigns.filter(d => d.type === 'template');
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a canvas template by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.designsService.findOne(id, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a canvas template' })
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.designsService.delete(id, userId);
  }
}

