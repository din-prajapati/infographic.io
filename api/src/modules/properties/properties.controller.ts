import { Controller, ForbiddenException, Get, Inject, Param, Post, Put, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ValidatedBody } from '../../common/validated-body.decorator';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';

import { ListingFilesInterceptor, ListingMediaInterceptor } from './listing-media.interceptor';

interface ListingRequest { user: { id: string; organizationId?: string | null } }
@Controller('properties')
@UseGuards(AuthGuard('jwt'))
export class PropertiesController {
  constructor(@Inject(PropertiesService) private readonly service: PropertiesService) {}
  private organization(req: ListingRequest) {
    if (!req.user.organizationId) throw new ForbiddenException('An organization is required to save properties');
    return req.user.organizationId;
  }
  // Registered before ':id' so "library" is never read as a property id.
  @Get('library')
  library(@Req() req: ListingRequest, @Query('search') search?: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.service.library(this.organization(req), req.user.id, { search, cursor, limit });
  }
  @Get(':id/designs')
  designs(@Req() req: ListingRequest, @Param('id') id: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.service.designs(this.organization(req), req.user.id, id, { cursor, limit });
  }
  @Get()
  list(@Req() req: ListingRequest, @Query('search') search?: string) { return this.service.list(this.organization(req), search); }
  @Get(':id')
  get(@Req() req: ListingRequest, @Param('id') id: string) { return this.service.get(this.organization(req), id); }
  @Post()
  @UseInterceptors(ListingFilesInterceptor, ListingMediaInterceptor)
  create(@Req() req: ListingRequest, @ValidatedBody(CreatePropertyDto) dto: CreatePropertyDto) { return this.service.create(this.organization(req), dto.record); }
  @Put(':id')
  @UseInterceptors(ListingFilesInterceptor, ListingMediaInterceptor)
  update(@Req() req: ListingRequest, @Param('id') id: string, @ValidatedBody(UpdatePropertyDto) dto: UpdatePropertyDto) {
    return this.service.update(this.organization(req), id, dto.record, dto.expectedVersion);
  }
}
