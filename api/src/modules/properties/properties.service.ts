import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { createEmptyListing, isListingMedia, parseListingPrice, validateListingRecord, type ListingProfile, type ListingRecord, type SavedProperty } from '@shared/listingWorkflow';
import { prisma } from '../../database/prisma.client';

const propertySelect = { id: true, record: true, version: true, createdAt: true, updatedAt: true,
  name: true, address: true, type: true, headline: true, price: true, amount: true, currency: true,
  transaction: true, rentalPeriod: true, beds: true, baths: true, sqft: true, description: true,
  features: true, locale: true, photoRefs: true, status: true } as const;
const profileSelect = { record: true, version: true, updatedAt: true } as const;
function listing(value: unknown): ListingRecord {
  const errors = validateListingRecord(value);
  if (errors.length) throw new BadRequestException(errors);
  return value as ListingRecord;
}
const json = (value: object): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
type LegacyProperty = { id: string; record: unknown; version: number; createdAt: Date; updatedAt: Date;
  name?: string; address?: string; type?: string; headline?: string; price?: string; amount?: number | null;
  currency?: string | null; transaction?: string | null; rentalPeriod?: string | null; beds?: number;
  baths?: number; sqft?: string; description?: string; features?: string[]; locale?: string; photoRefs?: string[]; status?: string };
function legacyListing(row: LegacyProperty): ListingRecord {
  const record = createEmptyListing();
  const country = row.locale === 'en-US' ? 'US' : row.locale === 'en-GB' ? 'GB' : row.locale === 'en-CA' ? 'CA' : ({ USD: 'US', GBP: 'GB', CAD: 'CA' }[row.currency ?? ''] ?? 'IN');
  const parsed = parseListingPrice(row.price ?? '', country);
  const scalarAmount = row.amount === null || row.amount === undefined ? '' : String(row.amount);
  record.property = { ...record.property, name: row.name || row.headline || row.address || '', address: row.address ?? '', type: row.type ?? '', headline: row.headline ?? '',
    description: row.description ?? '', country, currency: ['INR', 'USD', 'GBP', 'CAD'].includes(row.currency ?? '') ? row.currency! : parsed?.currency ?? record.property.currency,
    amount: /^(?:0|[1-9]\d{0,14})(?:\.\d{1,2})?$/.test(scalarAmount) ? scalarAmount : parsed?.amount ?? null,
    transaction: row.transaction === 'rent' ? 'rent' : 'sale', rentalPeriod: ['month', 'week', 'year', 'day'].includes(row.rentalPeriod ?? '') ? row.rentalPeriod as ListingRecord['property']['rentalPeriod'] : 'month',
    beds: row.beds === undefined ? '' : String(row.beds), baths: row.baths === undefined ? '' : String(row.baths), area: row.sqft ?? '', features: row.features ?? [], status: row.status ?? '' };
  // Legacy photoRefs can also contain generation IDs, which are not durable image sources.
  record.photos = (row.photoRefs ?? []).filter(src => !!src && isListingMedia(src)).slice(0, 8).map((src, index) => ({ id: `legacy-${index}`, name: `Photo ${index + 1}`, src }));
  return record;
}
const saved = (row: LegacyProperty): SavedProperty => ({
  id: row.id, record: row.record ? row.record as ListingRecord : legacyListing(row), version: row.version, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
});
const profile = (row: { record: unknown; version: number; updatedAt: Date }): ListingProfile => ({
  record: row.record as ListingProfile['record'], version: row.version, updatedAt: row.updatedAt.toISOString(),
});
@Injectable()
export class PropertiesService {
  async create(organizationId: string, value: unknown): Promise<SavedProperty> {
    const record = listing(value);
    return saved(await prisma.property.create({ data: { organizationId, name: record.property.name, address: record.property.address, record: json(record) }, select: propertySelect }));
  }
  async list(organizationId: string, search = ''): Promise<SavedProperty[]> {
    if (typeof search !== 'string' || search.length > 200) throw new BadRequestException('Search must be at most 200 characters');
    const term = search.trim();
    const rows = await prisma.property.findMany({ where: { organizationId, ...(term ? { OR: ['id', 'name', 'address'].map(key => ({ [key]: { contains: term, mode: 'insensitive' } })) } : {}) }, select: propertySelect, orderBy: { updatedAt: 'desc' }, take: 50 });
    return rows.map(saved);
  }
  async get(organizationId: string, id: string): Promise<SavedProperty> {
    const row = await prisma.property.findFirst({ where: { id, organizationId }, select: propertySelect });
    if (!row) throw new NotFoundException('Property not found');
    return saved(row);
  }
  async update(organizationId: string, id: string, value: unknown, expectedVersion: number): Promise<SavedProperty> {
    const record = listing(value);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new BadRequestException('A positive expectedVersion is required');
    return prisma.$transaction(async tx => {
      const result = await tx.property.updateMany({ where: { id, organizationId, version: expectedVersion }, data: { name: record.property.name, address: record.property.address, record: json(record), version: { increment: 1 } } });
      const row = await tx.property.findFirst({ where: { id, organizationId }, select: propertySelect });
      if (!row) throw new NotFoundException('Property not found');
      if (!result.count) throw new ConflictException('Property changed. Reload the saved property before saving again.');
      return saved(row);
    });
  }
  async getProfile(userId: string): Promise<ListingProfile> {
    const row = await prisma.listingProfile.findUnique({ where: { userId }, select: profileSelect });
    if (row) return profile(row);
    const { agent, brand } = createEmptyListing();
    return { record: { agent, brand }, version: 0 };
  }
  async saveProfile(userId: string, value: unknown, expectedVersion: number): Promise<ListingProfile> {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => key !== 'agent' && key !== 'brand')) throw new BadRequestException('Expected agent and brand profile');
    const validated = listing({ ...createEmptyListing(), agent: undefined, brand: undefined, ...value });
    const record = { agent: validated.agent, brand: validated.brand };
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0) throw new BadRequestException('A nonnegative expectedVersion is required');
    if (expectedVersion === 0) {
      try { return profile(await prisma.listingProfile.create({ data: { userId, record: json(record) }, select: profileSelect })); }
      catch (error) {
        if ((error as { code?: string }).code === 'P2002') throw new ConflictException('Profile changed. Reload before saving again.');
        throw error;
      }
    }
    return prisma.$transaction(async tx => {
      const result = await tx.listingProfile.updateMany({ where: { userId, version: expectedVersion }, data: { record: json(record), version: { increment: 1 } } });
      if (!result.count) throw new ConflictException('Profile changed. Reload before saving again.');
      const row = await tx.listingProfile.findUnique({ where: { userId }, select: profileSelect });
      return profile(row!);
    });
  }
}
