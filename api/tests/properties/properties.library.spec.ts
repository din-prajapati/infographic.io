import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyListing } from '@shared/listingWorkflow';
const { db } = vi.hoisted(() => ({ db: {
  property: { findFirst: vi.fn(), findMany: vi.fn() },
  infographic: { findMany: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
} }));
vi.mock('../../src/database/prisma.client', () => ({ prisma: db }));
import { PropertiesService, decodeCursor, encodeCursor } from '../../src/modules/properties/properties.service';

const at = (iso: string) => new Date(iso);
function row(id: string, updated: string, patch: (r: ReturnType<typeof createEmptyListing>) => void = () => {}) {
  const record = createEmptyListing();
  record.property.name = `Home ${id}`; record.property.address = `${id} Oak Road`; record.property.amount = '8000000';
  patch(record);
  return { id, record, version: 3, createdAt: at('2026-11-01T00:00:00Z'), updatedAt: at(updated) };
}

describe('GET /properties/library — paginated summaries', () => {
  const service = new PropertiesService();
  beforeEach(() => { vi.resetAllMocks(); db.infographic.groupBy.mockResolvedValue([]); });

  // Contract: default page is 24, ordered by (updatedAt desc, id desc), fetching one extra row to detect the next page.
  it('requests 25 rows in a stable order and returns a cursor only when more rows exist', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => row(`p${String(i).padStart(2, '0')}`, `2026-11-${String(28 - i).padStart(2, '0')}T00:00:00Z`));
    db.property.findMany.mockResolvedValue(rows);
    const page = await service.library('org-a', 'user-a', {});
    const call = db.property.findMany.mock.calls[0][0];
    expect(call.take).toBe(25);
    expect(call.orderBy).toEqual([{ updatedAt: 'desc' }, { id: 'desc' }]);
    expect(call.where.organizationId).toBe('org-a');
    expect(page.items).toHaveLength(24);
    expect(decodeCursor(page.nextCursor)).toEqual({ updatedAt: rows[23].updatedAt, id: 'p23' });
  });

  // Contract: a cursor continues strictly after the last row, so pages never repeat or skip a record.
  it('continues after the cursor row and ends with a null cursor', async () => {
    db.property.findMany.mockResolvedValue([row('p01', '2026-11-02T00:00:00Z')]);
    const cursor = encodeCursor(at('2026-11-05T00:00:00Z'), 'p09');
    const page = await service.library('org-a', 'user-a', { cursor, limit: '10' });
    expect(db.property.findMany.mock.calls[0][0].where.AND[0].OR).toEqual([
      { updatedAt: { lt: at('2026-11-05T00:00:00Z') } },
      { updatedAt: at('2026-11-05T00:00:00Z'), id: { lt: 'p09' } },
    ]);
    expect(db.property.findMany.mock.calls[0][0].take).toBe(11);
    expect(page.nextCursor).toBeNull();
  });

  // Contract: search matches id, name and address (case-insensitive) within the caller's organization.
  it('searches id, name and address', async () => {
    db.property.findMany.mockResolvedValue([]);
    await service.library('org-a', 'user-a', { search: '  oak  ' });
    expect(db.property.findMany.mock.calls[0][0].where.OR).toEqual([
      { id: { contains: 'oak', mode: 'insensitive' } }, { name: { contains: 'oak', mode: 'insensitive' } }, { address: { contains: 'oak', mode: 'insensitive' } },
    ]);
  });

  it('keeps search AND cursor together on subsequent filtered pages', async () => {
    db.property.findMany.mockResolvedValue([]);
    const cursor = encodeCursor(at('2026-11-05T00:00:00Z'), 'p09');
    await service.library('org-a', 'user-a', { search: 'oak', cursor });
    const where = db.property.findMany.mock.calls[0][0].where;
    expect(where.organizationId).toBe('org-a');
    expect(where.OR).toEqual(['id', 'name', 'address'].map(key => ({ [key]: { contains: 'oak', mode: 'insensitive' } })));
    expect(where.AND[0].OR).toEqual([{ updatedAt: { lt: at('2026-11-05T00:00:00Z') } }, { updatedAt: at('2026-11-05T00:00:00Z'), id: { lt: 'p09' } }]);
  });

  // Contract: bounds are enforced before any query.
  it.each([[{ limit: '51' }], [{ limit: '0' }], [{ limit: 'ten' }], [{ search: 'x'.repeat(201) }], [{ cursor: 'not-a-cursor' }]])('rejects %j with 400', async query => {
    await expect(service.library('org-a', 'user-a', query)).rejects.toMatchObject({ status: 400 });
    expect(db.property.findMany).not.toHaveBeenCalled();
  });

  // Contract: summary = card fields only; cover is the first https photo; design count is the caller's own designs.
  it('builds a card summary without the gallery and counts only the caller’s designs', async () => {
    db.property.findMany.mockResolvedValue([row('p1', '2026-11-10T00:00:00Z', r => {
      r.property.status = 'For sale'; r.property.beds = '3';
      r.photos = [{ id: 'a', name: 'inline', src: 'data:image/png;base64,AAAA' }, { id: 'b', name: 'front', src: 'https://cdn.example.test/front.jpg' }];
    })]);
    db.infographic.groupBy.mockResolvedValue([{ propertyId: 'p1', _count: { _all: 2 } }]);
    const [card] = (await service.library('org-a', 'user-a', {})).items;
    expect(card).toEqual({ id: 'p1', version: 3, name: 'Home p1', address: 'p1 Oak Road', status: 'For sale', transaction: 'sale', currency: 'INR', amount: '8000000',
      rentalPeriod: 'month', country: 'IN', beds: '3', baths: '', area: '', areaUnit: 'sq ft', coverUrl: 'https://cdn.example.test/front.jpg', photoCount: 2, designCount: 2,
      updatedAt: '2026-11-10T00:00:00.000Z' });
    expect(db.infographic.groupBy.mock.calls[0][0].where).toEqual({ userId: 'user-a', aiModel: 'canvas-editor', propertyId: { in: ['p1'] } });
  });
});

describe('GET /properties/:id/designs — designs linked by applied listing', () => {
  const service = new PropertiesService();
  beforeEach(() => { vi.resetAllMocks(); db.infographic.count.mockResolvedValue(1); });

  // Contract: another organization's property is a 404 and no design query runs.
  it('checks property access first', async () => {
    db.property.findFirst.mockResolvedValue(null);
    await expect(service.designs('org-b', 'user-b', 'p1', {})).rejects.toMatchObject({ status: 404 });
    expect(db.infographic.findMany).not.toHaveBeenCalled();
  });

  // Contract: only the caller's canvas designs with Infographic.propertyId = this property; summaries carry no canvas data.
  it('returns the caller’s linked designs as summaries', async () => {
    db.property.findFirst.mockResolvedValue(row('p1', '2026-11-10T00:00:00Z'));
    db.infographic.findMany.mockResolvedValue([{ id: 'd1', propertyData: { canvasDesign: { name: 'Story', thumbnail: 'https://cdn.example.test/t.png', canvasData: { elements: [1, 2, 3] } } }, createdAt: at('2026-11-11T00:00:00Z'), updatedAt: at('2026-11-12T00:00:00Z') }]);
    const page = await service.designs('org-a', 'user-a', 'p1', {});
    expect(db.infographic.findMany.mock.calls[0][0].where).toEqual({ userId: 'user-a', aiModel: 'canvas-editor', propertyId: 'p1' });
    expect(page).toEqual({ items: [{ id: 'd1', name: 'Story', thumbnail: 'https://cdn.example.test/t.png', createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-12T00:00:00.000Z' }], nextCursor: null, total: 1 });
  });
});

it('reports the total across all pages with the same user/property scope', async () => {
  db.property.findFirst.mockResolvedValue(row('p1', '2026-11-10T00:00:00Z'));
  db.infographic.findMany.mockResolvedValue([]);
  db.infographic.count.mockResolvedValue(53);
  const page = await new PropertiesService().designs('org-a', 'user-a', 'p1', { limit: '24' });
  expect(page.total).toBe(53);
  expect(db.infographic.count).toHaveBeenCalledWith({ where: { userId: 'user-a', aiModel: 'canvas-editor', propertyId: 'p1' } });
});
