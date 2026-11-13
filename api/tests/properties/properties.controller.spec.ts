import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PropertiesController } from '../../src/modules/properties/properties.controller';
import { ListingProfilesController } from '../../src/modules/properties/listing-profiles.controller';
import { CreatePropertyDto, UpdatePropertyDto, SaveListingProfileDto } from '../../src/modules/properties/dto/property.dto';
describe('listing HTTP trust boundaries', () => {
  // Contract: both route families always install the JWT guard at controller scope.
  it.each([PropertiesController, ListingProfilesController])('guards %s', controller => {
    expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toHaveLength(1);
  });
  // Contract: caller-supplied ownership is rejected by strict DTO whitelist.
  it('rejects supplied organization or user ids', () => {
    const dto = plainToInstance(CreatePropertyDto, { record: {}, organizationId: 'other', userId: 'other' });
    const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.map(error => error.property).sort()).toEqual(['organizationId', 'userId']);
  });
  // Contract: update requires an integer positive version, profile permits initial zero.
  it('validates optimistic concurrency versions', () => {
    expect(validateSync(plainToInstance(UpdatePropertyDto, { record: {}, expectedVersion: 0 })).map(error => error.property)).toEqual(['expectedVersion']);
    expect(validateSync(plainToInstance(SaveListingProfileDto, { record: {}, expectedVersion: 0 }))).toEqual([]);
  });
});
