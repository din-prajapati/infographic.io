import { Controller, Get, Param, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TemplatesService } from '../services/templates.service';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(
    @Inject(TemplatesService) private readonly templatesService: TemplatesService
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all templates' })
  async findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get template by ID' })
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }
}
