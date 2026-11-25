import { Controller, Get, Inject, Put, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ValidatedBody } from '../../common/validated-body.decorator';
import { PropertiesService } from './properties.service';
import { SaveListingProfileDto } from './dto/property.dto';

import { ListingFilesInterceptor, ListingMediaInterceptor } from './listing-media.interceptor';

@Controller('listing-profiles')
@UseGuards(AuthGuard('jwt'))
export class ListingProfilesController {
  constructor(@Inject(PropertiesService) private readonly service: PropertiesService) {}
  @Get()
  get(@Req() req: { user: { id: string } }) { return this.service.getProfile(req.user.id); }
  @Put()
  @UseInterceptors(ListingFilesInterceptor, ListingMediaInterceptor)
  save(@Req() req: { user: { id: string } }, @ValidatedBody(SaveListingProfileDto) dto: SaveListingProfileDto) {
    return this.service.saveProfile(req.user.id, dto.record, dto.expectedVersion);
  }
}
