import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyListing } from '@shared/listingWorkflow';
import { useCanvasStore } from '../useCanvasStore';
import { activateV3ListingWorkflow, captureV3ListingWorkflow, deactivateV3ListingWorkflow, restoreV3ListingWorkflow, stageV3LinkedTextEdit, useV3ListingStore, v3ListingActions } from '../useV3ListingWorkflow';
import type { CanvasElement } from '../../lib/canvasTypes';
import { reviewV3Export } from '../../lib/v3ExportReview';

beforeEach(() => {
  deactivateV3ListingWorkflow();
  useCanvasStore.setState({ elements: [{ id: 'headline', type: 'text', slot: 'property.headline', content: 'Old' } as CanvasElement], history: { past: [], future: [] } });
  activateV3ListingWorkflow();
});
describe('V3 listing workspace', () => {
  it('keeps applied facts and intentional customizations coherent through canvas Undo and Redo while retaining current pending identity', () => {
    const record = createEmptyListing(); record.property.headline = 'First listing';
    v3ListingActions.selectListing(record, 'listing-a', 1);
    v3ListingActions.applyToDesign();
    v3ListingActions.customize('headline', 'Intentional artwork');
    record.property.headline = 'Second applied';
    v3ListingActions.setPending(record); v3ListingActions.applyToDesign();
    const pending = createEmptyListing(); pending.property.headline = 'Unapplied listing';
    v3ListingActions.selectListing(pending, 'listing-b', 4);

    useCanvasStore.getState().undo();
    expect(useV3ListingStore.getState().snapshot).toMatchObject({
      applied: { property: { headline: 'First listing' } }, appliedListingId: 'listing-a',
      pending: { property: { headline: 'Unapplied listing' } }, selectedListingId: 'listing-b', selectedListingVersion: 4,
      overrides: { headline: 'Intentional artwork' },
    });
    useCanvasStore.getState().redo();
    expect(useV3ListingStore.getState().snapshot.applied.property.headline).toBe('Second applied');
    expect(useV3ListingStore.getState().snapshot.overrides).toEqual({ headline: 'Intentional artwork' });
    useCanvasStore.getState().undo();
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'First listing' });
    expect(useV3ListingStore.getState().snapshot.overrides).toEqual({});
    useCanvasStore.getState().redo();
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Intentional artwork' });
    expect(useV3ListingStore.getState().snapshot.overrides).toEqual({ headline: 'Intentional artwork' });
  });
  it('does not convert canvas Undo of Apply to a custom value and can apply again after Redo', () => {
    const record = createEmptyListing(); record.property.headline = 'Applied';
    v3ListingActions.setPending(record); v3ListingActions.applyToDesign();
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Old' });
    expect(useV3ListingStore.getState().snapshot.applied.property.headline).toBe('');
    expect(useV3ListingStore.getState().snapshot.overrides).toEqual({});
    useCanvasStore.getState().redo();
    expect(useV3ListingStore.getState().snapshot.applied.property.headline).toBe('Applied');
    record.property.headline = 'Next'; v3ListingActions.setPending(record); v3ListingActions.applyToDesign();
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Next' });
    useCanvasStore.getState().updateElement('headline', { x: 75 });
    expect(v3ListingActions.undoLastApply().ok).toBe(false);
    useCanvasStore.getState().undo();
    expect(v3ListingActions.undoLastApply().ok).toBe(true);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Applied' });
  });
  it('clears only a resolved missing-photo finding after validated manual replacement, including Undo and Redo', () => {
    useCanvasStore.setState({ elements: ['hero', 'other'].map(id => ({ id, type: 'image', slot: 'property.heroImage', src: '', visible: true } as CanvasElement)) });
    activateV3ListingWorkflow(); v3ListingActions.applyToDesign();
    expect(useV3ListingStore.getState().snapshot.skipped).toEqual(['hero', 'other']);
    expect(v3ListingActions.customize('hero', 'javascript:bad').ok).toBe(false);
    expect(useV3ListingStore.getState().snapshot.skipped).toEqual(['hero', 'other']);
    expect(v3ListingActions.customize('hero', 'https://example.test/hero.png').ok).toBe(true);
    const findings = () => reviewV3Export({ elements: useCanvasStore.getState().elements, canvasWidth: 800, canvasHeight: 600, v3Listing: captureV3ListingWorkflow() });
    expect(useV3ListingStore.getState().snapshot.skipped).toEqual(['other']);
    expect(findings().filter(f => f.code === 'skipped').map(f => f.message)).toEqual(['other']);
    expect(findings().filter(f => f.elementId === 'hero')).toEqual([]);
    useCanvasStore.getState().undo();
    expect(useV3ListingStore.getState().snapshot.skipped).toEqual(['hero', 'other']);
    useCanvasStore.getState().redo();
    expect(useV3ListingStore.getState().snapshot.skipped).toEqual(['other']);
  });
  it('accepts a valid Uploads replacement as resolving its missing photo while protecting other missing photos', () => {
    useCanvasStore.setState({ elements: ['hero', 'other'].map(id => ({ id, type: 'image', slot: 'property.heroImage', src: '', visible: true } as CanvasElement)) });
    activateV3ListingWorkflow(); v3ListingActions.applyToDesign();
    useCanvasStore.getState().updateElement('hero', { src: 'https://example.test/upload.png' });
    expect(useV3ListingStore.getState().snapshot.skipped).toEqual(['other']);
    useCanvasStore.getState().undo();
    expect(useV3ListingStore.getState().snapshot.skipped).toEqual(['hero', 'other']);
    useCanvasStore.getState().redo();
    expect(useV3ListingStore.getState().snapshot.overrides.hero).toBe('https://example.test/upload.png');
    expect(useV3ListingStore.getState().snapshot.skipped).toEqual(['other']);
  });
  it('retains photo-source review when canvas history restores a customization from a different listing', () => {
    useCanvasStore.setState({ elements: [{ id: 'hero', type: 'image', slot: 'property.heroImage', src: '' } as CanvasElement] });
    activateV3ListingWorkflow();
    v3ListingActions.selectListing(createEmptyListing(), 'listing-a');
    v3ListingActions.customize('hero', 'https://example.test/a.png');
    v3ListingActions.applyToDesign();
    v3ListingActions.selectListing(createEmptyListing(), 'listing-b');
    useCanvasStore.getState().undo();
    expect(useV3ListingStore.getState().snapshot.selectedListingId).toBe('listing-b');
    expect(useV3ListingStore.getState().snapshot.unreviewedOverrides).toEqual(['hero']);
    useCanvasStore.getState().redo();
    expect(useV3ListingStore.getState().snapshot.unreviewedOverrides).toEqual(['hero']);
  });
  // Contract: a photo customized for Listing A must be explicitly reviewed for Listing B.
  it('marks old listing photo customizations for review and clears only on reselection', () => {
    useCanvasStore.setState({ elements: [{ id:'photo', type:'image', slot:'property.heroImage', src:'https://example.test/a.png' } as CanvasElement] });
    activateV3ListingWorkflow();
    v3ListingActions.selectListing(createEmptyListing(),'listing-a');
    v3ListingActions.customize('photo','https://example.test/a.png');
    v3ListingActions.selectListing(createEmptyListing(),'listing-b');
    expect(useV3ListingStore.getState().snapshot.unreviewedOverrides).toEqual(['photo']);
    v3ListingActions.customize('photo','https://example.test/b.png');
    expect(useV3ListingStore.getState().snapshot.unreviewedOverrides).toEqual([]);
  });
  it('stages facts and safely restores last apply without removing pending changes', () => {
    const record = createEmptyListing(); record.property.headline = 'New';
    v3ListingActions.selectListing(record, 'listing-1', 2);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Old' });
    expect(v3ListingActions.applyToDesign().ok).toBe(true);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'New' });
    expect(v3ListingActions.undoLastApply().ok).toBe(true);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Old' });
    expect(useV3ListingStore.getState().snapshot.pending.property.headline).toBe('New');
  });
  it('rejects undo after later canvas editing', () => {
    expect(v3ListingActions.applyToDesign().ok).toBe(true);
    useCanvasStore.getState().updateElement('headline', { x: 99 });
    expect(v3ListingActions.undoLastApply()).toMatchObject({ ok: false });
    expect(useCanvasStore.getState().elements[0].x).toBe(99);
  });
  it('resets between workspaces and protects manual content replacements', () => {
    useCanvasStore.getState().updateElement('headline', { content: 'Custom' });
    expect(useV3ListingStore.getState().snapshot.overrides.headline).toBe('Custom');
    deactivateV3ListingWorkflow(); activateV3ListingWorkflow();
    expect(useV3ListingStore.getState().snapshot.overrides).toEqual({});
  });
  it('stages direct linked text edits and keeps geometry independent from customization', () => {
    expect(stageV3LinkedTextEdit('headline', 'Pending text')).toEqual({ ok: true });
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Old' });
    expect(useV3ListingStore.getState().snapshot.pending.property.headline).toBe('Pending text');
    useCanvasStore.getState().updateElement('headline', { x: 100, rotation: 20 });
    expect(useV3ListingStore.getState().snapshot.overrides).toEqual({});
    expect(v3ListingActions.applyToDesign()).toEqual({ ok: true });
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Pending text', x: 100, rotation: 20 });
  });
  it('persists pending, applied and custom values independently without hydrating canonical facts', () => {
    const record = createEmptyListing(); record.property.headline = 'Pending source';
    v3ListingActions.setPending(record);
    v3ListingActions.customize('headline', 'Only artwork');
    const snapshot = captureV3ListingWorkflow()!;
    deactivateV3ListingWorkflow(); activateV3ListingWorkflow();
    expect(restoreV3ListingWorkflow(snapshot)).toBe(true);
    expect(useV3ListingStore.getState().snapshot).toMatchObject({ pending: { property: { headline: 'Pending source' } }, applied: { property: { headline: '' } }, overrides: { headline: 'Only artwork' } });
  });
  it('detaches without changing content and reconnects without importing canvas text', () => {
    v3ListingActions.detach('headline');
    expect(stageV3LinkedTextEdit('headline', 'Independent')).toBeNull();
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Old' });
    expect(v3ListingActions.reconnect('headline', 'property.headline')).toEqual({ ok: true });
    expect(useV3ListingStore.getState().snapshot.pending.property.headline).toBe('');
  });
  it('Use linked value restores applied text immediately while preserving pending facts', () => {
    const record = createEmptyListing(); record.property.headline = 'Applied';
    v3ListingActions.setPending(record); v3ListingActions.applyToDesign();
    v3ListingActions.customize('headline', 'Design-only text');
    record.property.headline = 'Future source'; v3ListingActions.setPending(record);
    v3ListingActions.useLinked('headline');
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Applied' });
    expect(useV3ListingStore.getState().snapshot.pending.property.headline).toBe('Future source');
    expect(useV3ListingStore.getState().snapshot.overrides).toEqual({});
  });
  it('round-trips through the actual canvas persistence without adopting customized text as canonical facts', async () => {
    const { captureCanvasData, restoreCanvasData } = await import('../../lib/canvasState');
    const record = createEmptyListing(); record.property.headline = 'Canonical applied';
    v3ListingActions.selectListing(record, 'property-a', 3); v3ListingActions.applyToDesign();
    v3ListingActions.customize('headline', 'Custom artwork');
    record.property.headline = 'Canonical pending'; v3ListingActions.setPending(record);
    const document = captureCanvasData();
    deactivateV3ListingWorkflow(); activateV3ListingWorkflow();
    expect(restoreCanvasData(document)).toBe(true);
    expect(useCanvasStore.getState().elements[0]).toMatchObject({ content: 'Custom artwork' });
    expect(useV3ListingStore.getState().snapshot).toMatchObject({ selectedListingId: 'property-a', selectedListingVersion: 3, pending: { property: { headline: 'Canonical pending' } }, applied: { property: { headline: 'Canonical applied' } }, overrides: { headline: 'Custom artwork' } });
  });
});
