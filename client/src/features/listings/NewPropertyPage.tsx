import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Home } from 'lucide-react';
import { PageHeading } from '@/features/workspace/PageHeading';
import type { ListingRecord } from '@shared/listingWorkflow';
import { useUnsavedChanges } from '@/features/workspace/unsavedChanges';
import { initializeV3NavigationGuard } from '@/lib/v3NavigationGuard';
import { useListingProfile, useSaveProperty } from './listingsApi';
import { fieldErrors, newListingFromProfile, normalizeForSave, sameRecord } from './listingFormat';
import { PropertyForm } from './PropertyForm';
import { TextReview } from './TextReview';
import './listings.css';

/** New property (rev-2 spec §5): Paste text or Enter manually, then an explicit Create. */
export default function NewPropertyPage() {
  const [, navigate] = useLocation();
  const profile = useListingProfile();
  const [mode, setMode] = useState<'paste' | 'manual'>('paste');
  const [initial, setInitial] = useState<ListingRecord | null>(null);
  const [draft, setDraft] = useState<ListingRecord | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const save = useSaveProperty();

  // Starts from the saved Agent & Brand (a snapshot). A profile that fails to load still allows a blank start.
  useEffect(() => {
    if (draft || profile.isPending) return;
    const start = newListingFromProfile(profile.data);
    setInitial(start); setDraft(start);
  }, [profile.isPending, profile.data, draft]);

  const errors = useMemo(() => (draft ? fieldErrors(normalizeForSave(draft)) : {}), [draft]);
  const dirty = !!draft && !!initial && !sameRecord(draft, initial);
  const create = async () => {
    if (!draft) return false;
    setShowErrors(true);
    if (Object.keys(errors).length) return false;
    try {
      const saved = await save.mutateAsync({ record: normalizeForSave(draft) });
      setInitial(draft);
      initializeV3NavigationGuard().allowInternal(() => navigate(`/listings/${encodeURIComponent(saved.id)}`, { replace: true }));
      return true;
    } catch { return false; }
  };
  useUnsavedChanges(dirty, create);

  if (!draft) return <div className="ws-skeleton" style={{ height: 320 }} aria-label="Loading" />;
  return (
    <>
      <PageHeading crumbs={[{ label: 'Listings', href: '/listings' }, { label: 'New property' }]} eyebrow="New property" title="One listing. Every design."
        subtitle="Paste the seller’s message to fill the form, or type the details yourself. Nothing is saved until you press Create property."
        actions={<Link href="/listings" className="ws-btn"><Home aria-hidden="true" />All listings</Link>} />
      {profile.isError && <p className="ws-alert ws-alert-warn" role="status">Your saved Agent &amp; Brand could not be loaded, so agent details start empty.</p>}

      <div className="lst-mode" role="group" aria-label="How do you want to add this property?">
        <button type="button" aria-pressed={mode === 'paste'} onClick={() => setMode('paste')}>Paste text</button>
        <button type="button" aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>Enter manually</button>
      </div>

      {mode === 'paste' && <TextReview draft={draft} onApply={(record, count) => { setDraft(record); setMode('manual'); setNotice(`${count} ${count === 1 ? 'fact' : 'facts'} copied. Review the form, then create the property.`); }} />}

      {mode === 'manual' && (
        <div className="ws-panel">
          <div className="ws-panel-head"><div><h2>Listing details</h2><p>Reviewed facts become the source for every linked template.</p></div></div>
          <div className="ws-panel-body">
            {notice && <p className="ws-alert ws-alert-ok" role="status">{notice}</p>}
            <PropertyForm value={draft.property} onChange={property => setDraft({ ...draft, property })} errors={showErrors ? errors : {}} />
          </div>
          <div className="ws-form-footer">
            {save.isError && <p className="ws-field-error" role="alert" style={{ marginRight: 'auto' }}>The property could not be created. Your details are kept — try again.</p>}
            {showErrors && Object.keys(errors).length > 0 && <p className="ws-field-error" role="alert" style={{ marginRight: 'auto' }}>Fix the highlighted fields to continue.</p>}
            <Link href="/listings" className="ws-btn ws-btn-subtle">Cancel</Link>
            <button type="button" className="ws-btn ws-btn-primary" disabled={save.isPending} onClick={() => void create()}>{save.isPending ? 'Creating…' : 'Create property'}</button>
          </div>
        </div>
      )}
    </>
  );
}
