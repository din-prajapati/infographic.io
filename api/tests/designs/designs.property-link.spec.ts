import { beforeEach, describe, expect, it, vi } from 'vitest';
const { db } = vi.hoisted(() => ({ db: {
  template: { findFirst: vi.fn() },
  property: { findFirst: vi.fn() },
  infographic: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
} }));
vi.mock('../../src/database/prisma.client', () => ({ prisma: db }));
import { DesignsService } from '../../src/modules/designs/services/designs.service';

const now = new Date('2026-11-17T00:00:00Z');
const design = (v3Listing?: Record<string, unknown>) => ({ name: 'Story', type: 'design', thumbnail: '', tags: [], canvasData: { elements: [], ...(v3Listing ? { v3Listing } : {}) } }) as any;
const stored = (data: any) => ({ id: 'd1', createdAt: now, updatedAt: now, ...data });

describe('design save → Infographic.propertyId (applied listing link)', () => {
  const service = new DesignsService();
  beforeEach(() => {
    vi.resetAllMocks();
    db.template.findFirst.mockResolvedValue({ id: 't1' });
    db.infographic.create.mockImplementation(({ data }) => Promise.resolve(stored(data)));
    db.infographic.update.mockImplementation(({ data }) => Promise.resolve(stored(data)));
    db.infographic.findFirst.mockResolvedValue(stored({ propertyData: { canvasDesign: {} } }));
  });

  // Contract: the applied listing (not the pending selection) links the design, after an organization check.
  it('links a new design to its applied property in the same organization', async () => {
    db.property.findFirst.mockResolvedValue({ id: 'p-applied' });
    await service.save('user-a', 'org-a', design({ selectedListingId: 'p-pending', appliedListingId: 'p-applied' }));
    expect(db.property.findFirst.mock.calls[0][0].where).toEqual({ id: 'p-applied', organizationId: 'org-a' });
    expect(db.infographic.create.mock.calls[0][0].data.propertyId).toBe('p-applied');
  });

  // Contract: a pending-only selection never links; no property lookup runs.
  it('does not link a design whose listing is selected but not applied', async () => {
    await service.save('user-a', 'org-a', design({ selectedListingId: 'p-pending' }));
    expect(db.property.findFirst).not.toHaveBeenCalled();
    expect(db.infographic.create.mock.calls[0][0].data.propertyId).toBeNull();
  });

  // Contract: an applied id from another organization is stored as null, never as a cross-tenant link.
  it('stores null when the applied property is not in the caller’s organization', async () => {
    db.property.findFirst.mockResolvedValue(null);
    await service.save('user-a', 'org-a', design({ appliedListingId: 'p-foreign' }));
    expect(db.infographic.create.mock.calls[0][0].data.propertyId).toBeNull();
  });

  // Contract: updating a design re-derives the link, clearing it when the applied listing is removed.
  it('re-derives the link on update', async () => {
    await service.save('user-a', 'org-a', design(), 'd1');
    expect(db.infographic.update.mock.calls[0][0].data.propertyId).toBeNull();
    db.property.findFirst.mockResolvedValue({ id: 'p2' });
    await service.save('user-a', 'org-a', design({ appliedListingId: 'p2' }), 'd1');
    expect(db.infographic.update.mock.calls[1][0].data.propertyId).toBe('p2');
  });
});
