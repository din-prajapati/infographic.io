import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Building2, ChevronRight, Home, ImageOff, Images, LayoutTemplate, Link2, Palette, PenSquare, Plus, RotateCcw, ShieldCheck, UserRound } from 'lucide-react';
import { formatListingPrice, formatSpecifications, type ListingRecord } from '@shared/listingWorkflow';
import { FormatPickerDialog } from '@/components/pages/FormatPickerDialog';
import { buildV3EditorUrl } from '@/lib/v3EditorUrl';
import { useCanvasStore } from '@/hooks/useCanvasStore';
import { useUnsavedChanges } from '@/features/workspace/unsavedChanges';
import { PageHeading } from '@/features/workspace/PageHeading';
import { isConflict, isNotFound, useListingProfile, useProperty, usePropertyDesigns, useSaveProperty } from './listingsApi';
import { fieldErrors, listingTitle, normalizeForSave, sameRecord, withSavedAgent, withSavedBrand } from './listingFormat';
import { PropertyForm } from './PropertyForm';
import { PhotoManager } from './PhotoManager';
import { useDraftMedia } from './draftMedia';
import './listings.css';

type Tab = 'assets' | 'details' | 'photos';
const TABS: { id: Tab; label: string }[] = [{ id: 'assets', label: 'Marketing assets' }, { id: 'details', label: 'Property details' }, { id: 'photos', label: 'Photos' }];
/** design.md §8 pipeline strip, adapted to what this release does (no simulated campaign agents). */
const PIPELINE = [
  { icon: Home, title: 'Property & photos', note: 'Your source of truth' },
  { icon: UserRound, title: 'Agent & brand', note: 'Saved with this listing' },
  { icon: LayoutTemplate, title: 'Template', note: 'Pick a layout in the editor' },
  { icon: ShieldCheck, title: 'You review', note: 'Apply changes when ready', current: true },
];

/**
 * Listing workspace (rev-2 spec §5; layout per Mockups/listing-workflow-v1/design.md §8): heading, summary cards,
 * pipeline, tabs for marketing assets, editable details and photos. One draft, one Save / Cancel.
 */
export default function ListingDetailPage({ propertyId }: { propertyId: string }) {
  const [, navigate] = useLocation();
  const property = useProperty(propertyId);
  const profile = useListingProfile();
  const save = useSaveProperty();
  const media = useDraftMedia();
  const designCount = usePropertyDesigns(propertyId).data?.pages[0]?.total;
  const [tab, setTab] = useState<Tab>('assets');
  const [draft, setDraft] = useState<ListingRecord | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  const saved = property.data;
  // Adopt the server record when nothing is being edited (first load, after save, after Reload latest).
  useEffect(() => { if (saved && (!draft || sameRecord(draft, saved.record))) setDraft(structuredClone(saved.record)); }, [saved?.version, saved?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = !!draft && !!saved && !sameRecord(draft, saved.record);
  const errors = useMemo(() => (draft ? fieldErrors(normalizeForSave(draft)) : {}), [draft]);
  const submit = async () => {
    if (!draft || !saved || media.pending) return false;
    setShowErrors(true); setConflict(false); setSavedNotice(false);
    if (Object.keys(errors).length) { setTab(Object.keys(errors).some(key => key.startsWith('photos')) ? 'photos' : 'details'); return false; }
    try {
      const next = await save.mutateAsync({ record: normalizeForSave(draft), id: saved.id, expectedVersion: saved.version, files: media.files });
      setDraft(structuredClone(next.record)); media.clear(); setShowErrors(false); setSavedNotice(true);
      return true;
    } catch (error) {
      if (isConflict(error)) setConflict(true);
      return false;
    }
  };
  useUnsavedChanges(dirty || media.pending > 0, submit);
  const cancel = () => { media.clear(); if (saved) setDraft(structuredClone(saved.record)); setShowErrors(false); setConflict(false); save.reset(); };
  const reloadLatest = async () => { const result = await property.refetch(); if (result.data) { media.clear(); setDraft(structuredClone(result.data.record)); } setConflict(false); save.reset(); };

  const openEditor = (width: number, height: number, templateId?: string) => {
    setPickerOpen(false);
    if (!templateId) useCanvasStore.getState().loadCanvas({ elements: [], canvasWidth: width, canvasHeight: height, backgroundColor: '#FFFFFF', zoom: 1 });
    navigate(buildV3EditorUrl(templateId ? { templateId, propertyId } : { canvasSize: { width, height }, propertyId }));
  };

  if (property.isPending) return <div aria-busy="true" aria-label="Loading property"><div className="ws-skeleton" style={{ height: 36, width: 320, marginBottom: 20 }} /><div className="ws-skeleton" style={{ height: 160 }} /></div>;
  if (property.isError || !saved || !draft) {
    return (
      <>
        <PageHeading crumbs={[{ label: 'Listings', href: '/listings' }, { label: 'Property' }]} eyebrow="Listing" title={isNotFound(property.error) ? 'Property not found' : 'Property unavailable'} />
        {isNotFound(property.error) ? (
          <div className="ws-empty"><Building2 aria-hidden="true" /><h2>This property isn’t available</h2><p>It may have been removed, or it is not shared with your organization.</p><Link href="/listings" className="ws-btn">All listings</Link></div>
        ) : (
          <div className="ws-alert ws-alert-error" role="alert"><span>This property could not be loaded.</span><button type="button" className="ws-btn" onClick={() => void property.refetch()}><RotateCcw aria-hidden="true" />Retry</button></div>
        )}
      </>
    );
  }

  const record = saved.record, p = record.property;
  const cover = record.photos[0]?.src;
  const price = formatListingPrice(p), specs = formatSpecifications(p);
  const savedAgent = profile.data?.record.agent;
  const savedBrand = profile.data?.record.brand;
  const agentDiffers = savedAgent && Object.values(savedAgent).some(value => value.trim()) && !sameRecord(draft.agent, savedAgent);
  const brandDiffers = savedBrand && Object.values(savedBrand).some(value => value.trim()) && !sameRecord(draft.brand, savedBrand);
  const title = listingTitle(p);
  const editDetails = () => { setTab('details'); requestAnimationFrame(() => detailsRef.current?.querySelector<HTMLElement>('input,textarea,select')?.focus()); };
  const saveFeedback = save.isError && !conflict ? <span className="ws-field-error" role="alert">Save failed. Your changes are kept — try again.</span>
    : showErrors && Object.keys(errors).length ? <span className="ws-field-error" role="alert">Fix the highlighted fields to save.</span> : null;

  return (
    <>
      <PageHeading crumbs={[{ label: 'Listings', href: '/listings' }, { label: title }]} eyebrow="Less designing. More listing." title={title}
        subtitle={p.address || 'Your property, your brand, and every design made from them.'}
        actions={<>
          <Link href="/listings" className="ws-btn"><Home aria-hidden="true" />All listings</Link>
          <button type="button" className="ws-btn ws-btn-primary" onClick={() => setPickerOpen(true)}><Plus aria-hidden="true" />Create design</button>
        </>} />

      <div className="lst-summary">
        <section className="ws-panel lst-summary-property" aria-label="Property summary">
          {cover ? <img className="lst-summary-cover" src={cover} alt="" /> : <div className="lst-placeholder lst-summary-cover" role="img" aria-label="No property photos"><ImageOff aria-hidden="true" /><span>No property photos</span></div>}
          <div className="lst-summary-body">
            <span className="ws-pill ws-pill-green">{p.status || (p.transaction === 'rent' ? 'For rent' : 'For sale')}</span>
            <h2>{p.headline || title}</h2>
            {p.address && <p className="lst-small">{p.address}</p>}
            {price ? <strong className="lst-summary-price">{price}</strong> : <span className="lst-small">Price not set</span>}
            {specs && <p className="lst-facts">{specs.toLowerCase()}</p>}
            <button type="button" className="ws-text-button lst-summary-edit" onClick={editDetails}>Edit property<ChevronRight aria-hidden="true" /></button>
          </div>
        </section>
        <section className="ws-panel lst-summary-card" aria-label="Agent on this listing">
          <p className="lst-summary-label"><UserRound aria-hidden="true" />Listing agent profile</p>
          <div className="lst-identity">
            {draft.agent.photo ? <img className="lst-portrait" src={draft.agent.photo} alt="" /> : <span className="lst-portrait" aria-hidden="true">{(draft.agent.name || '?').slice(0, 1).toUpperCase()}</span>}
            <div><strong>{draft.agent.name || 'No agent yet'}</strong>{draft.agent.agency && <span>{draft.agent.agency}</span>}{(draft.agent.phone || draft.agent.email) && <span>{[draft.agent.phone, draft.agent.email].filter(Boolean).join(' · ')}</span>}</div>
          </div>
          <p className="lst-tiny"><Link2 aria-hidden="true" />{sameRecord(draft.agent, record.agent) ? "Saved with this listing’s designs" : "Unsaved profile · Save changes to keep"}</p>
          {agentDiffers && <div className="lst-summary-actions"><button type="button" className="ws-text-button" onClick={() => setDraft(withSavedAgent(draft, profile.data!))}>Use saved profile<ChevronRight aria-hidden="true" /></button></div>}
        </section>
        <section className="ws-panel lst-summary-card" aria-label="Brand on this listing">
          <p className="lst-summary-label"><Palette aria-hidden="true" />Brand on this listing</p>
          <div className="lst-identity">
            {draft.brand.logo ? <img className="lst-logo" src={draft.brand.logo} alt="" /> : <span className="lst-logo" aria-hidden="true"><Palette /></span>}
            <div><strong>{draft.brand.name || 'No brand yet'}</strong>{draft.brand.tagline && <span>{draft.brand.tagline}</span>}</div>
          </div>
          <div className="lst-brand-foot">
            {draft.brand.accent ? <span className="ws-pill"><i className="lst-swatch" style={{ background: draft.brand.accent }} aria-hidden="true" />{draft.brand.accent}</span> : <span className="lst-tiny">No accent colour</span>}
          </div>
          {!sameRecord(draft.brand, record.brand) && <p className="lst-small" role="status">Unsaved brand · Save changes to keep</p>}
          {brandDiffers && <div className="lst-summary-actions"><button type="button" className="ws-text-button" onClick={() => setDraft(withSavedBrand(draft, profile.data!))}>Use saved brand<ChevronRight aria-hidden="true" /></button></div>}
        </section>
      </div>

      <ol className="lst-pipeline" aria-label="How designs are made from this listing">
        {PIPELINE.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="lst-pipe-step" data-current={step.current || undefined}>
              <span className="lst-step-icon" aria-hidden="true"><Icon /></span>
              <span><strong>{step.title}</strong><small>{step.note}</small></span>
              {index < PIPELINE.length - 1 && <ChevronRight className="lst-pipe-arrow" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      {conflict && (
        <div className="ws-alert ws-alert-warn" role="alert">
          <span><strong>Someone saved this property after you opened it.</strong> Your changes were not saved and nothing was overwritten.</span>
          <span className="lst-row"><button type="button" className="ws-btn" onClick={() => void reloadLatest()}>Reload latest</button><button type="button" className="ws-btn ws-btn-subtle" onClick={() => setConflict(false)}>Keep editing</button></span>
        </div>
      )}
      {savedNotice && !dirty && <p className="ws-alert ws-alert-ok" role="status">Property saved. Existing designs keep their content until you apply the update in the editor.</p>}

      <div className="ws-tabs" role="tablist" aria-label="Property sections">
        {TABS.map(item => {
          const count = item.id === 'assets' ? designCount : item.id === 'photos' ? draft.photos.length : undefined;
          return (
            <button key={item.id} type="button" role="tab" id={`lst-tab-${item.id}`} aria-controls={`lst-panel-${item.id}`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} className="ws-tab"
              onClick={() => setTab(item.id)}
              onKeyDown={event => { if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return; const index = TABS.findIndex(other => other.id === tab); const next = TABS[(index + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]; setTab(next.id); document.getElementById(`lst-tab-${next.id}`)?.focus(); }}>
              {item.label}{typeof count === 'number' && <span className="ws-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`lst-panel-${tab}`} aria-labelledby={`lst-tab-${tab}`}>
        {tab === 'assets' && <MarketingAssets propertyId={propertyId} onCreate={() => setPickerOpen(true)} />}
        {tab === 'details' && (
          <div ref={detailsRef} className="ws-panel">
            <div className="ws-panel-head">
              <div><h2>One record. Every design stays connected.</h2><p>Reviewed facts are the source for your linked templates. Designs update only when you apply.</p></div>
              <span className="ws-pill ws-pill-green"><Link2 aria-hidden="true" />Property v{saved.version}</span>
            </div>
            <div className="ws-panel-body"><PropertyForm value={draft.property} onChange={next => setDraft({ ...draft, property: next })} errors={showErrors ? errors : {}} /></div>
            <div className="ws-form-footer">
              {saveFeedback && <span style={{ marginRight: 'auto' }}>{saveFeedback}</span>}
              <button type="button" className="ws-btn ws-btn-subtle" onClick={cancel} disabled={!dirty || save.isPending || media.pending > 0}>Cancel</button>
              <button type="button" className="ws-btn ws-btn-primary" onClick={() => void submit()} disabled={!dirty || save.isPending || media.pending > 0}>{save.isPending ? 'Saving…' : 'Save changes'}</button>
            </div>
          </div>
        )}
        {tab === 'photos' && <PhotoManager stage={file => media.stage(file)} disabled={save.isPending} photos={draft.photos} onChange={update => setDraft(current => current && { ...current, photos: update(current.photos) })} />}
      </div>

      {dirty && tab !== 'details' && (
        <div className="lst-savebar" role="region" aria-label="Unsaved changes">
          <span>{saveFeedback ?? 'You have unsaved changes to this listing.'}</span>
          <span className="lst-row">
            <button type="button" className="ws-btn ws-btn-subtle" onClick={cancel} disabled={save.isPending || media.pending > 0}>Cancel</button>
            <button type="button" className="ws-btn ws-btn-primary" onClick={() => void submit()} disabled={save.isPending || media.pending > 0}>{save.isPending ? 'Saving…' : 'Save changes'}</button>
          </span>
        </div>
      )}

      <FormatPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={openEditor} />
    </>
  );
}

function MarketingAssets({ propertyId, onCreate }: { propertyId: string; onCreate: () => void }) {
  const designs = usePropertyDesigns(propertyId);
  const items = designs.data?.pages.flatMap(page => page.items) ?? [];
  const heading = (
    <div className="ws-section-heading">
      <div><h2>Designs for this listing</h2><p className="ws-subtitle">{items.length ? `${designs.data?.pages[0]?.total ?? items.length} ${(designs.data?.pages[0]?.total ?? items.length) === 1 ? 'design uses' : 'designs use'} this property. Open one to review and apply updates.` : 'Pick a template and this property fills its linked fields.'}</p></div>
      {items.length > 0 && <button type="button" className="ws-btn ws-btn-primary" onClick={onCreate}><Plus aria-hidden="true" />Create design</button>}
    </div>
  );
  if (designs.isPending) return <>{heading}<div className="lst-asset-grid" aria-busy="true">{Array.from({ length: 4 }, (_, index) => <div key={index} className="ws-skeleton" style={{ height: 320 }} />)}</div></>;
  if (designs.isError) return <>{heading}<div className="ws-alert ws-alert-error" role="alert"><span>Designs for this property could not be loaded.</span><button type="button" className="ws-btn" onClick={() => void designs.refetch()}><RotateCcw aria-hidden="true" />Retry</button></div></>;
  if (!items.length) return <>{heading}<div className="ws-empty"><PenSquare aria-hidden="true" /><h2>No designs yet</h2><p>Designs appear here once this property has been applied to them and saved.</p><button type="button" className="ws-btn ws-btn-primary" onClick={onCreate}><Plus aria-hidden="true" />Create design</button></div></>;
  return (
    <>
      {heading}
      <ul className="lst-asset-grid">
        {items.map(design => (
          <li key={design.id} className="ws-panel lst-asset" data-testid="property-design">
            <div className="lst-asset-stage">{design.thumbnail ? <img src={design.thumbnail} alt="" loading="lazy" /> : <span className="lst-placeholder" style={{ width: '100%', height: '100%' }}><ImageOff aria-hidden="true" />No preview</span>}</div>
            <div className="lst-asset-info">
              <h3>{design.name}</h3>
              <span className="lst-small">Updated {new Date(design.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <Link href={buildV3EditorUrl({ designId: design.id })} className="ws-btn ws-btn-block"><PenSquare aria-hidden="true" />Open in V3</Link>
              <span className="lst-asset-foot"><Link2 aria-hidden="true" />Property linked</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="ws-review-tip"><Images aria-hidden="true" />Saving this property never changes these designs. Open a design to review and apply the update.</p>
      {designs.hasNextPage && <div className="lst-more"><button type="button" className="ws-btn" disabled={designs.isFetchingNextPage} onClick={() => void designs.fetchNextPage()}>Load more designs</button></div>}
    </>
  );
}
