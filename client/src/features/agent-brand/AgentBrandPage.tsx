import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Link2, Palette, RotateCcw, Trash2, Upload, UserRound } from 'lucide-react';
import type { ListingProfile } from '@shared/listingWorkflow';
import { useDraftMedia } from '@/features/listings/draftMedia';
import { useUnsavedChanges } from '@/features/workspace/unsavedChanges';
import { PageHeading } from '@/features/workspace/PageHeading';
import { isConflict, useListingProfile, useSaveListingProfile } from '@/features/listings/listingsApi';
import { TextField } from '@/features/listings/FormControls';
import { RECOMMENDED_LENGTH, STORAGE_LIMIT, sameRecord } from '@/features/listings/listingFormat';
import { brandPreviewPalette, identityErrors, isHexColor, normalizeHex } from './agentBrand';
import './agent-brand.css';

type Identity = ListingProfile['record'];

/**
 * Agent & Brand (rev-2 spec §8; layout per design.md §11). One page-level draft for both sections, saved atomically
 * through PUT /listing-profiles with the expected version. Used when starting new listings; existing listings and
 * designs keep their saved content. Never touches account credentials, the account avatar or organization branding.
 */
export default function AgentBrandPage() {
  const profile = useListingProfile();
  const save = useSaveListingProfile();
  const media = useDraftMedia();
  const [draft, setDraft] = useState<Identity | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [notice, setNotice] = useState(false);

  useEffect(() => { if (profile.data && (!draft || sameRecord(draft, profile.data.record))) setDraft(structuredClone(profile.data.record)); }, [profile.data?.version]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = !!draft && !!profile.data && !sameRecord(draft, profile.data.record);
  const errors = useMemo(() => (draft ? identityErrors(draft) : {}), [draft]);
  const submit = async () => {
    if (!draft || !profile.data || media.pending) return false;
    setShowErrors(true); setConflict(false); setNotice(false);
    if (Object.keys(errors).length) return false;
    try {
      const saved = await save.mutateAsync({ record: { ...draft, brand: { ...draft.brand, accent: normalizeHex(draft.brand.accent) } }, expectedVersion: profile.data.version, files: media.files });
      setDraft(structuredClone(saved.record)); media.clear(); setShowErrors(false); setNotice(true);
      return true;
    } catch (error) { if (isConflict(error)) setConflict(true); return false; }
  };
  useUnsavedChanges(dirty || media.pending > 0, submit);

  const heading = (
    <PageHeading crumbs={[{ label: 'Agent & brand' }]} eyebrow="Configure once" title="Your agent identity, on every design."
      subtitle="Used when starting new listings. Existing listings and designs keep their saved content." />
  );
  if (profile.isPending) return <>{heading}<div aria-busy="true" aria-label="Loading Agent and Brand" className="ws-skeleton" style={{ height: 420, maxWidth: 950 }} /></>;
  if (profile.isError || !draft) return <>{heading}<div className="ws-alert ws-alert-error" role="alert"><span>Your Agent &amp; Brand could not be loaded.</span><button type="button" className="ws-btn" onClick={() => void profile.refetch()}><RotateCcw aria-hidden="true" />Retry</button></div></>;

  const shown = showErrors ? errors : {};
  const setAgent = (patch: Partial<Identity['agent']>) => setDraft(current => current && ({ ...current, agent: { ...current.agent, ...patch } }));
  const setBrand = (patch: Partial<Identity['brand']>) => setDraft(current => current && ({ ...current, brand: { ...current.brand, ...patch } }));
  const version = profile.data?.version ?? 0;

  return (
    <>
      {heading}
      {conflict && (
        <div className="ws-alert ws-alert-warn" role="alert">
          <span><strong>Your Agent &amp; Brand was saved somewhere else.</strong> Nothing was overwritten.</span>
          <span className="ab-row"><button type="button" className="ws-btn" onClick={async () => { const result = await profile.refetch(); if (result.data) { media.clear(); setDraft(structuredClone(result.data.record)); } setConflict(false); save.reset(); }}>Reload latest</button><button type="button" className="ws-btn ws-btn-subtle" onClick={() => setConflict(false)}>Keep editing</button></span>
        </div>
      )}
      {notice && !dirty && <p className="ws-alert ws-alert-ok" role="status">Agent &amp; Brand saved. New properties will start with it; existing listings and designs are unchanged.</p>}

      <div className="ab-layout">
        <div className="ws-panel">
          <div className="ws-panel-head">
            <h2>Saved real-estate agent profile</h2>
            <span className="ws-pill ws-pill-green">{version ? `Profile v${version}` : 'Not saved yet'}</span>
          </div>
          <section className="ws-panel-body" aria-labelledby="ab-agent">
            <h3 id="ab-agent" className="ab-section-title"><UserRound aria-hidden="true" />Agent</h3>
            <ImageField stage={file => media.stage(file)} disabled={save.isPending} label="Portrait" title="Agent photograph" value={draft.agent.photo} shape="round" onChange={photo => setAgent({ photo })} />
            <div className="ws-form-grid">
              <TextField label="Name" value={draft.agent.name} onChange={name => setAgent({ name })} recommended={RECOMMENDED_LENGTH.agentName} max={STORAGE_LIMIT.text} error={shown['agent.name']} />
              <TextField label="Agency" value={draft.agent.agency} onChange={agency => setAgent({ agency })} recommended={RECOMMENDED_LENGTH.agency} max={STORAGE_LIMIT.text} error={shown['agent.agency']} />
              <TextField label="Phone" type="tel" inputMode="tel" value={draft.agent.phone} onChange={phone => setAgent({ phone })} recommended={RECOMMENDED_LENGTH.phone} max={STORAGE_LIMIT.text} error={shown['agent.phone']} />
              <TextField label="Email" type="email" inputMode="email" value={draft.agent.email} onChange={email => setAgent({ email })} max={STORAGE_LIMIT.text} error={shown['agent.email']} />
              <TextField label="Licence / disclosure" value={draft.agent.license} onChange={license => setAgent({ license })} recommended={RECOMMENDED_LENGTH.license} max={STORAGE_LIMIT.text} error={shown['agent.license']} full hint="E.g. a RERA number or brokerage licence, as it should appear on artwork." />
            </div>
          </section>
          <section className="ws-panel-body ab-section" aria-labelledby="ab-brand">
            <h3 id="ab-brand" className="ab-section-title"><Palette aria-hidden="true" />Brand</h3>
            <ImageField stage={file => media.stage(file)} disabled={save.isPending} label="Logo" title="Brand logo" value={draft.brand.logo} shape="square" onChange={logo => setBrand({ logo })} />
            <div className="ws-form-grid">
              <TextField label="Brand name" value={draft.brand.name} onChange={name => setBrand({ name })} max={STORAGE_LIMIT.text} error={shown['brand.name']} />
              <TextField label="Tagline" value={draft.brand.tagline} onChange={tagline => setBrand({ tagline })} recommended={RECOMMENDED_LENGTH.tagline} max={STORAGE_LIMIT.text} error={shown['brand.tagline']} />
              <AccentField value={draft.brand.accent} onChange={accent => setBrand({ accent })} error={shown['brand.accent']} />
            </div>
          </section>
          <div className="ws-form-footer">
            {save.isError && !conflict && <p className="ws-field-error" role="alert" style={{ marginRight: 'auto' }}>Save failed. Your changes are kept — try again.</p>}
            {showErrors && Object.keys(errors).length > 0 && <p className="ws-field-error" role="alert" style={{ marginRight: 'auto' }}>Fix the highlighted fields to save.</p>}
            <button type="button" className="ws-btn ws-btn-subtle" disabled={!dirty || save.isPending || media.pending > 0} onClick={() => { media.clear(); setDraft(structuredClone(profile.data!.record)); setShowErrors(false); save.reset(); }}>Cancel</button>
            <button type="button" className="ws-btn ws-btn-primary" disabled={!dirty || save.isPending || media.pending > 0} onClick={() => void submit()}><Check aria-hidden="true" />{save.isPending ? 'Saving…' : 'Save Agent & Brand'}</button>
          </div>
        </div>
        <Preview identity={draft} />
      </div>
    </>
  );
}

function Preview({ identity }: { identity: Identity }) {
  const palette = brandPreviewPalette(identity.brand.accent);
  const accent = palette[0];
  return (
    <aside className="ab-preview" aria-label="Preview of your marketing identity">
      {identity.agent.photo ? <img src={identity.agent.photo} alt="" className="ab-preview-photo" /> : <span className="ab-preview-photo ab-placeholder" aria-hidden="true"><UserRound /></span>}
      <h2>{identity.agent.name || 'Agent name'}</h2>
      <p>{identity.agent.agency || 'Agency'}</p>
      <p>{[identity.agent.phone, identity.agent.email].filter(Boolean).join(' · ') || 'Phone · email'}</p>
      {identity.agent.license && <p className="ab-preview-license">{identity.agent.license}</p>}
      <div className="ab-preview-brand">
        {identity.brand.logo ? <img src={identity.brand.logo} alt="" className="ab-preview-logo" /> : <span className="ab-preview-logo ab-placeholder" aria-hidden="true"><Palette /></span>}
        <span><strong>{identity.brand.name || 'Your brand'}</strong>{identity.brand.tagline && <small>{identity.brand.tagline}</small>}</span>
      </div>
      <div className="ab-swatches" aria-label={accent ? `Brand accent ${accent} and derived preview shades` : 'No accent colour yet'}>
        {palette.length ? palette.map((colour, index) => <span key={index} className="ab-swatch" style={{ background: colour }} title={`${index === 0 ? 'Brand accent' : 'Derived preview shade'} ${colour}`} />)
          : <span className="ab-swatch" data-empty="true" />}
      </div>
      {accent && <small className="ab-preview-note">Supporting shades are derived from your accent for this preview.</small>}
      <small className="ab-preview-note">Draft preview — saved only when you press Save Agent &amp; Brand.<br />Existing listings keep their saved identity until you choose to update them.</small>
      <span className="ws-pill ws-pill-green"><Link2 aria-hidden="true" />Reusable identity</span>
    </aside>
  );
}

function ImageField({ label, title, value, shape, onChange, stage, disabled }: { stage: (file: File) => Promise<{ src: string; name: string } | null>; disabled: boolean; label: string; title: string; value: string; shape: 'round' | 'square'; onChange: (src: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ busy: boolean; error: string | null; file?: File }>({ busy: false, error: null });
  const upload = async (file: File) => {
    setStatus({ busy: true, error: null, file });
    try { const image = await stage(file); if (image) onChange(image.src); setStatus({ busy: false, error: null }); }
    catch (error) { setStatus({ busy: false, error: error instanceof Error ? error.message : 'Upload failed. Retry the upload.', file }); }
  };
  return (
    <div className="ab-image-field">
      {value ? <img src={value} alt={`${label} preview`} className={`ab-image ab-image-${shape}`} /> : <span className={`ab-image ab-image-${shape} ab-placeholder`} aria-hidden="true">{shape === 'round' ? <UserRound /> : <Palette />}</span>}
      <div>
        <p className="ab-image-label">{title}</p><p className="ws-hint">New images upload when you save Agent &amp; Brand.</p>
        <div className="ab-row">
          <button type="button" className="ws-btn ws-btn-small" disabled={disabled || status.busy} onClick={() => input.current?.click()}><Upload aria-hidden="true" />{status.busy ? 'Uploading…' : value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}</button>
          {value && <button type="button" className="ws-btn ws-btn-small ws-btn-subtle ws-btn-danger" disabled={disabled} onClick={() => onChange('')}><Trash2 aria-hidden="true" />Remove</button>}
        </div>
        {status.error && <p className="ws-field-error" role="alert">{status.error} {status.file && <button type="button" className="ws-btn ws-btn-small ws-btn-subtle" onClick={() => void upload(status.file!)}>Retry</button>}</p>}
        <input ref={input} type="file" disabled={disabled} hidden accept="image/jpeg,image/png,image/webp,image/gif,image/avif" aria-label={`Upload ${label.toLowerCase()}`} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} />
      </div>
    </div>
  );
}

function AccentField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const id = useId();
  return (
    <div className="ws-field">
      <label htmlFor={id}>Accent colour</label>
      <div className="ab-row ab-accent">
        <input type="color" aria-label="Pick accent colour" className="ab-color" value={isHexColor(value) ? normalizeHex(value) : '#087e78'} onChange={event => onChange(event.target.value.toUpperCase())} />
        <input id={id} value={value} maxLength={7} placeholder="#087E78" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} onChange={event => onChange(event.target.value.trim())} />
      </div>
      {error && <span id={`${id}-error`} className="ws-field-error" role="alert">{error}</span>}
    </div>
  );
}
