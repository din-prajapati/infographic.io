import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { ListingProfilesController } from './listing-profiles.controller';
import { PropertiesService } from './properties.service';
import { json, type Request, type Response, type NextFunction } from 'express';

export function configureListingBodyParser(app: { use: (...args: unknown[]) => unknown }): void {
  const parse = json({ limit: '12mb' });
  // Nest detects global parsers by function name. Keep this route parser distinct
  // so installing it does not suppress Nest's default JSON parser for auth/webhooks.
  // Designs and canvas templates carry canvas JSON plus a PNG thumbnail (and, for legacy records, inline images),
  // which routinely exceeds Nest's default 100 kB JSON limit and failed as 500 "request entity too large".
  // New V3 image uploads go to R2 via POST /api/v1/media, so these bodies stay well below 12 MB.
  app.use(['/api/v1/properties', '/api/v1/listing-profiles', '/api/v1/designs', '/api/v1/canvas-templates'], function listingBodyParser(req: Request, res: Response, next: NextFunction) { parse(req, res, next); });
}

@Module({ controllers: [PropertiesController, ListingProfilesController], providers: [PropertiesService] })
export class PropertiesModule {}
