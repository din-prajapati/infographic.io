import { Controller, Post, Put, Get, Delete, Body, Param, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DesignsService } from '../services/designs.service';
import { CreateDesignDto } from '../dto/create-design.dto';

@ApiTags('designs')
@Controller('designs')
export class DesignsController {
  constructor(
    @Inject(DesignsService) private readonly designsService: DesignsService
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new design' })
  async create(@Body() dto: CreateDesignDto, @Req() req: any) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id;
    return this.designsService.save(userId, organizationId, dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing design' })
  async update(@Param('id') id: string, @Body() dto: CreateDesignDto, @Req() req: any) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId || req.user.id;
    return this.designsService.save(userId, organizationId, dto, id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all designs for current user' })
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    return this.designsService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a design by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.designsService.findOne(id, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a design' })
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    return this.designsService.delete(id, userId);
  }
}

