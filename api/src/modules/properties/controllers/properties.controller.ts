import { Controller, Post, Put, Get, Param, UseGuards, Req, Inject, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PropertiesService } from '../services/properties.service';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import { ValidatedBody } from '../../../common/validated-body.decorator';

/**
 * A Property must reference a real Organization (FK). A user removed from their team keeps a valid JWT
 * but has organizationId = null (users.service removeUserFromOrganization), and org ids are generated,
 * so the usual `|| req.user.id` fallback would hit the FK and 500. Answer 403 instead (TC-PROP-001-25).
 */
export function callerOrganizationId(req: any): string {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    throw new ForbiddenException('Your account is not part of an organization');
  }
  return organizationId;
}

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(
    @Inject(PropertiesService) private readonly propertiesService: PropertiesService
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a property' })
  async create(@ValidatedBody(CreatePropertyDto) dto: CreatePropertyDto, @Req() req: any) {
    const organizationId = callerOrganizationId(req);
    return this.propertiesService.create(organizationId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: "List the caller's organization properties" })
  async findAll(@Req() req: any) {
    const organizationId = callerOrganizationId(req);
    return this.propertiesService.findAll(organizationId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a property by ID' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const organizationId = callerOrganizationId(req);
    return this.propertiesService.findOne(id, organizationId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a property' })
  async update(@Param('id') id: string, @ValidatedBody(UpdatePropertyDto) dto: UpdatePropertyDto, @Req() req: any) {
    const organizationId = callerOrganizationId(req);
    return this.propertiesService.update(id, organizationId, dto);
  }
}
