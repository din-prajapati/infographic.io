import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyListing } from '@shared/listingWorkflow';
const { db } = vi.hoisted(() => ({ db: {
  property: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
  listingProfile: { create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
} }));
vi.mock('../../src/database/prisma.client', () => ({ prisma: db }));
import { PropertiesService } from '../../src/modules/properties/properties.service';
describe('saved listing ownership and versions', () => {
  const service = new PropertiesService();
  beforeEach(() => { vi.resetAllMocks(); db.$transaction.mockImplementation(fn => fn(db)); });
  // Contract: a valid create derives its organization from the caller and returns version 1.
  it('creates an organization-scoped record and returns the acknowledged record', async () => {
    const record = createEmptyListing();
    const now = new Date('2026-11-13T00:00:00Z');
    db.property.create.mockResolvedValue({ id: 'p1', record, version: 1, createdAt: now, updatedAt: now });
    expect(await service.create('org-a', record)).toEqual({ id: 'p1', record, version: 1, createdAt: now.toISOString(), updatedAt: now.toISOString() });
    expect(db.property.create.mock.calls[0][0].data.organizationId).toBe('org-a');
  });
  // Contract: invalid canonical record yields 400 and zero writes.
  it('rejects invalid records before persistence', async () => {
    await expect(service.create('org-a', {})).rejects.toMatchObject({ status: 400 });
    expect(db.property.create).toHaveBeenCalledTimes(0);
  });
  // Contract: another organization gets 404 at get, never the other listing.
  it('uses organization scope on reads', async () => {
    db.property.findFirst.mockResolvedValue(null);
    await expect(service.get('org-b', 'p1')).rejects.toMatchObject({ status: 404 });
    expect(db.property.findFirst.mock.calls[0][0].where).toEqual({ id: 'p1', organizationId: 'org-b' });
  });
  // Contract: old scalar Property data remains readable with no migration writeback.
  it('serializes a historical property without modifying its legacy data', async () => {
    const row = { id: 'legacy', record: null, version: 1, createdAt: new Date(), updatedAt: new Date(),
      address: '20 Oak Road', headline: 'Old listing', amount: 1250000, currency: 'INR', beds: 3,
      baths: 2, sqft: '1200', transaction: 'sale', photoRefs: ['https://example.com/house.jpg', 'generation-id'] };
    db.property.findFirst.mockResolvedValue(row);
    const result = await service.get('org-a', 'legacy');
    expect(result.record.property).toMatchObject({ address: '20 Oak Road', amount: '1250000', currency: 'INR', beds: '3', area: '1200' });
    expect(result.record.photos).toEqual([{ id: 'legacy-0', name: 'Photo 1', src: 'https://example.com/house.jpg' }]);
    expect(row.record).toBe(null);
    expect(db.property.updateMany).toHaveBeenCalledTimes(0);
  });
  // Contract: stale expectedVersion yields 409 and an atomic compare-and-increment query.
  it('rejects stale writes without overwriting accepted data', async () => {
    const record = createEmptyListing();
    db.property.updateMany.mockResolvedValue({ count: 0 });
    db.property.findFirst.mockResolvedValue({ id: 'p1' });
    await expect(service.update('org-a', 'p1', record, 1)).rejects.toMatchObject({ status: 409 });
    expect(db.property.updateMany.mock.calls[0][0].where).toEqual({ id: 'p1', organizationId: 'org-a', version: 1 });
    expect(db.property.updateMany.mock.calls[0][0].data.version).toEqual({ increment: 1 });
  });
  // Contract: two updates at version1 produce one version2 result and one409.
  it('admits exactly one update with a shared expected version', async () => {
    const record = createEmptyListing();
    const row = { id: 'p1', record, version: 1, createdAt: new Date(), updatedAt: new Date() };
    db.property.updateMany.mockImplementation(({ where, data }) => {
      if (where.version !== row.version) return Promise.resolve({ count: 0 });
      row.version += 1;
      row.record = data.record;
      return Promise.resolve({ count: 1 });
    });
    db.property.findFirst.mockImplementation(() => Promise.resolve({ ...row }));
    const results = await Promise.allSettled([service.update('org-a', 'p1', record, 1), service.update('org-a', 'p1', record, 1)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { status: 409 } });
    expect(row.version).toBe(2);
  });
  // Contract: cross-org PUT cannot update and yields404 rather than a version hint.
  it('returns 404 for an inaccessible update target', async () => {
    db.property.updateMany.mockResolvedValue({ count: 0 });
    db.property.findFirst.mockResolvedValue(null);
    await expect(service.update('org-b', 'p1', createEmptyListing(), 1)).rejects.toMatchObject({ status: 404 });
  });
  // Contract: query is bounded and listing retrieval is always organization scoped.
  it('searches saved name, address and id within the caller organization', async () => {
    db.property.findMany.mockResolvedValue([]);
    expect(await service.list('org-a', 'Oak')).toEqual([]);
    expect(db.property.findMany.mock.calls[0][0].where).toEqual({ organizationId: 'org-a', OR: [
      { id: { contains: 'Oak', mode: 'insensitive' } }, { name: { contains: 'Oak', mode: 'insensitive' } }, { address: { contains: 'Oak', mode: 'insensitive' } },
    ] });
    await expect(service.list('org-a', 'A'.repeat(201))).rejects.toMatchObject({ status: 400 });
  });
  // Contract: absent profile returns version zero for the authenticated user only.
  it('returns personal empty defaults scoped to the caller', async () => {
    db.listingProfile.findUnique.mockResolvedValue(null);
    expect((await service.getProfile('user-a')).version).toBe(0);
    expect(db.listingProfile.findUnique.mock.calls[0][0].where).toEqual({ userId: 'user-a' });
  });
  // Contract: a uniqueness race creating the first profile yields recoverable 409.
  it('reports a concurrent initial profile save', async () => {
    db.listingProfile.create.mockRejectedValue({ code: 'P2002' });
    const { agent, brand } = createEmptyListing();
    await expect(service.saveProfile('user-a', { agent, brand }, 0)).rejects.toMatchObject({ status: 409 });
  });
  // Contract: incomplete/foreign profile sections yield400 before writes.
  it('rejects malformed profile and ownership fields', async () => {
    await expect(service.saveProfile('user-a', { agent: {} }, 0)).rejects.toMatchObject({ status: 400 });
    const { agent, brand } = createEmptyListing();
    await expect(service.saveProfile('user-a', { agent, brand, userId: 'other' }, 0)).rejects.toMatchObject({ status: 400 });
    expect(db.listingProfile.create).toHaveBeenCalledTimes(0);
  });
  // Contract: profile writes increment own version and return exact persisted defaults.
  it('updates only the caller personal profile at the expected version', async () => {
    const { agent, brand } = createEmptyListing();
    const record = { agent: { ...agent, name: 'Agent A' }, brand };
    db.listingProfile.updateMany.mockResolvedValue({ count: 1 });
    db.listingProfile.findUnique.mockResolvedValue({ record, version: 2, updatedAt: new Date('2026-11-13T00:00:00Z') });
    expect(await service.saveProfile('user-a', record, 1)).toEqual({ record, version: 2, updatedAt: '2026-11-13T00:00:00.000Z' });
    expect(db.listingProfile.updateMany.mock.calls[0][0].where).toEqual({ userId: 'user-a', version: 1 });
  });
});

describe('identity validation at the API business boundary', () => {
  it.each([['email', 'invalid@'], ['accent', 'not-a-colour']])('rejects invalid %s in a profile and listing', async (field, value) => {
    const record = createEmptyListing();
    if (field === 'email') record.agent.email = value; else record.brand.accent = value;
    const service = new PropertiesService();
    await expect(service.saveProfile('user-a', { agent: record.agent, brand: record.brand }, 0)).rejects.toMatchObject({ status: 400 });
    await expect(service.create('org-a', record)).rejects.toMatchObject({ status: 400 });
    await expect(service.update('org-a', 'p1', record, 1)).rejects.toMatchObject({ status: 400 });
  });
});
