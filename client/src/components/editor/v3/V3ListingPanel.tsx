import { useEffect, useRef, useState } from "react";
import type React from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ArrowLeft, ChevronRight, ImagePlus, Pencil, Search } from "lucide-react";
import {
  createEmptyListing,
  isListingMedia,
  LISTING_COUNTRIES,
  LISTING_CURRENCIES,
  LISTING_AREA_UNITS,
  validateListingRecord,
  formatListingPrice,
  formatSpecifications,
  reviewListingText,
  applyReviewedFacts,
  pricingPatch,
  type ListingRecord,
  type ListingTextReview,
  type ReviewedFact,
} from "@shared/listingWorkflow";
import { useV3ListingWorkflow } from "../../../hooks/useV3ListingWorkflow";
import { propertiesApi, listingProfilesApi } from "../../../lib/listingApi";
import { useCanvasStore } from "../../../hooks/useCanvasStore";
import { createImageElement } from "../../../lib/canvasUtils";
import { uploadV3Image } from "../../../lib/v3MediaUpload";
import "./v3-listing-panel.css";

export interface V3ListingPanelProps {
  section?: "Listing" | "Property" | "Agent" | "Brand" | "Media";
  userId: string;
  onNavigate: (panel: "Listing" | "Details" | "Property" | "Agent" | "Brand" | "Uploads") => void;
  onClose: () => void;
  stayInDetails?: boolean;
}
const countries: Record<string, string> = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
};
const scrollPositions = new Map<string, number>();
// Recommended display lengths from the approved port-4180 Property/Contact reference. These are layout guidance only:
// the authoritative storage limits stay in shared/listingWorkflow.ts (2,000 characters; description 20,000).
const RECOMMENDED_LENGTH = {
  headline: 105,
  address: 85,
  agentName: 40,
  phone: 28,
  agency: 45,
  callToAction: 28,
  registration: 75,
} as const;
const STORED_TEXT_LIMIT = 2000;
const STORED_DESCRIPTION_LIMIT = 20000;
const LISTING_EXAMPLE_TEXT = `3 BHK, 2 bathrooms, 80 Lakh, 1500 sq ft
Address: Satellite Road, Ahmedabad
Headline: A bright place to call home
Features: Balcony, parking
Agent: Seller suggested contact, +91 90000 00000`;
/** Shows an extracted amount the way the canvas will ("₹80 Lakh"), using the currency/intent found in the same snippet. */
function formatReviewedPrice(review: ListingTextReview, fact: ReviewedFact, base: ListingRecord["property"]): string {
  const sibling = (path: string) => review.facts.find((other) => other.path === path && other.evidence === fact.evidence)?.value;
  const period = sibling("property.rentalPeriod");
  return formatListingPrice({ ...base, amount: String(fact.value), currency: String(sibling("property.currency") ?? base.currency), transaction: sibling("property.transaction") === "rent" ? "rent" : "sale", rentalPeriod: (period as ListingRecord["property"]["rentalPeriod"]) ?? base.rentalPeriod });
}
const SOURCE_TABS = [
  ["id", "Listing ID"],
  ["text", "Paste text"],
  ["saved", "Saved properties"],
] as const;
type SourceTab = (typeof SOURCE_TABS)[number][1];

function Counter({ id, value, recommended, limit }: { id: string; value: string; recommended?: number; limit?: number }) {
  const length = value.length;
  const over = recommended !== undefined && length > recommended;
  return (
    <span id={id} className={`v3-lp-count${over ? " v3-lp-count-over" : ""}`}>
      {over && <span className="v3-lp-count-note">Longer than the recommended length for this layout; it is saved in full. </span>}
      {recommended !== undefined ? `${length}/${recommended}` : limit !== undefined ? `${length}/${limit.toLocaleString()}` : length}
    </span>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  recommended,
  limit = STORED_TEXT_LIMIT,
  textarea = false,
  optional = false,
  help,
  type = "text",
  ariaLabel = label,
  placeholder,
  rows,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  recommended?: number;
  limit?: number;
  textarea?: boolean;
  optional?: boolean;
  help?: string;
  type?: string;
  ariaLabel?: string;
  placeholder?: string;
  rows?: number;
}) {
  const describedBy = [help ? `${id}-help` : "", `${id}-count`].filter(Boolean).join(" ");
  const common = {
    id,
    "aria-label": ariaLabel,
    "aria-describedby": describedBy,
    value,
    placeholder,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
  };
  return (
    <div className="v3-lp-field">
      <span className="v3-lp-label-row">
        <label htmlFor={id}>{label}</label>
        {optional && <span className="v3-lp-optional">Optional</span>}
      </span>
      {textarea ? <textarea {...common} rows={rows ?? 3} /> : <input {...common} type={type} />}
      <span className="v3-lp-field-meta">
        {help ? <span id={`${id}-help`} className="v3-lp-help">{help}</span> : <span />}
        <Counter id={`${id}-count`} value={value} recommended={recommended} limit={recommended === undefined ? limit : undefined} />
      </span>
    </div>
  );
}

const message = (error: unknown) =>
  error instanceof Error ? error.message : "The request failed. Please retry.";

export function V3ListingPanel({
  section = "Listing",
  userId,
  onNavigate,
  onClose,
  stayInDetails = false,
}: V3ListingPanelProps) {
  const workflow = useV3ListingWorkflow();
  const { pending } = workflow;
  const latestPending = useRef(pending); latestPending.current = pending;
  const [screen, setScreen] = useState<"welcome" | "overview" | "property">(
    () =>
      section === 'Property' ? 'property' : pending.property.address || pending.property.name
        ? "overview"
        : "welcome",
  );
  const [source, setSource] = useState<SourceTab>("Listing ID");
  const [lookup, setLookup] = useState("");
  const [lookupSubmitted, setLookupSubmitted] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [featuresText, setFeaturesText] = useState(() => pending.property.features.join(", "));
  const [confirmExample, setConfirmExample] = useState(false);
  const composer = useRef<HTMLTextAreaElement | null>(null);
  const [query, setQuery] = useState("");
  const [paste, setPaste] = useState("");
  const [review, setReview] = useState<ListingTextReview | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [draft, setDraft] = useState<ListingRecord>(() =>
    structuredClone(pending),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const viewport = useRef<HTMLDivElement | null>(null);
  const identity = useRef(userId);
  identity.current = userId;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const saved = useQuery({
    queryKey: ["saved-listings", userId, query.trim()],
    queryFn: () => propertiesApi.list(query.trim()),
    enabled:
      section === "Listing" &&
      (source === "Saved properties" || (source === "Listing ID" && lookupSubmitted)),
    retry: false,
  });
  const profile = useQuery({
    queryKey: ["listing-profile", userId],
    queryFn: () => listingProfilesApi.get(),
    enabled: section === "Agent" || section === "Brand",
    retry: false,
  });
  const filtered = (saved.data ?? []).filter((item) =>
    [item.record.property.address, item.record.property.name, item.id].some(
      (value) => value.toLowerCase().includes(query.trim().toLowerCase()),
    ),
  );
  const navigate = (target: "Listing" | "Details" | "Property" | "Agent" | "Brand" | "Uploads") => {
    if (section === "Listing")
      scrollPositions.set(userId, viewport.current?.scrollTop ?? 0);
    onNavigate(target);
  };
  const changeProperty = (
    key: keyof ListingRecord["property"],
    value: string,
  ) => {
    const patch = [
      "amount",
      "currency",
      "transaction",
      "rentalPeriod",
    ].includes(key)
      ? pricingPatch(draft.property, key as "amount", value)
      : {
          [key]:
            key === "features"
              ? value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean)
              : value,
        };
    setDraft((current) => ({
      ...current,
      property: { ...current.property, ...patch },
    }));
  };
  const openProperty = () => {
    setDraft(structuredClone(pending));
    setFeaturesText(pending.property.features.join(", "));
    setError(null);
    setScreen("property");
  };
  const setPropertyText = (key: "name" | "type" | "headline" | "address" | "description" | "status", value: string) => {
    changeProperty(key, value);
    setError(null);
  };
  const setAgent = (key: keyof ListingRecord["agent"], value: string) =>
    setDraft((current) => ({ ...current, agent: { ...current.agent, [key]: value } }));
  const setBrand = (key: keyof ListingRecord["brand"], value: string) =>
    setDraft((current) => ({ ...current, brand: { ...current.brand, [key]: value } }));
  // Inserts fictional sample text into the composer only: no extraction, save, agent selection or artwork change.
  const insertExample = () => {
    setPaste(LISTING_EXAMPLE_TEXT);
    setReview(null);
    setChosen([]);
    setError(null);
    setConfirmExample(false);
    requestAnimationFrame(() => composer.current?.focus());
  };
  const saveProperty = async (record: ListingRecord = draft) => {
    if (section === 'Property') record = { ...latestPending.current, property: record.property };
    const errors = validateListingRecord(record);
    if (errors.length) {
      setError(errors.join("; "));
      return;
    }
    setSaving(true);
    setError(null);
    const requestUser = userId;
    try {
      const result = workflow.selectedListingId
        ? await propertiesApi.save(record, {
            id: workflow.selectedListingId,
            expectedVersion: workflow.selectedListingVersion!,
          })
        : await propertiesApi.save(record);
      if (!alive.current || identity.current !== requestUser) return;
      workflow.setPending(section === 'Property' ? { ...latestPending.current, property: result.record.property } : result.record);
      workflow.setSelectedListingIdentity(result.id, result.version);
      setScreen("overview");
      if (section === 'Property' && !stayInDetails) navigate('Listing');
      await saved.refetch();
    } catch (e) {
      if (alive.current && identity.current === requestUser)
        setError(message(e));
    } finally {
      if (alive.current && identity.current === requestUser) setSaving(false);
    }
  };
  const saveProfile = async () => {
    if (!profile.data) return;
    const profileRecord = {
      agent: section === "Agent" ? draft.agent : profile.data.record.agent,
      brand: section === "Brand" ? draft.brand : profile.data.record.brand,
    };
    const errors = validateListingRecord({
      ...createEmptyListing(),
      ...profileRecord,
    });
    if (errors.length) {
      setError(errors.join("; "));
      return;
    }
    setSaving(true);
    setError(null);
    const requestUser = userId;
    try {
      const result = await listingProfilesApi.save(
        profileRecord,
        profile.data.version,
      );
      if (!alive.current || identity.current !== requestUser) return;
      workflow.setPending({
        ...latestPending.current,
        ...(section === "Agent"
          ? { agent: result.record.agent }
          : { brand: result.record.brand }),
      });
      await profile.refetch();
      if (alive.current && identity.current === requestUser && !stayInDetails) navigate("Listing");
    } catch (e) {
      if (alive.current && identity.current === requestUser)
        setError(message(e));
    } finally {
      if (alive.current && identity.current === requestUser) setSaving(false);
    }
  };
  const upload = async (file?: File, target?: "agent" | "brand") => {
    if (!file) return;
    setSaving(true);
    setError(null);
    const requestUser = userId;
    try {
      if (!target && pending.photos.length >= 8)
        throw Error(
          "Keep up to 8 listing photos. Remove one before uploading.",
        );
      // Listing photos, agent portraits and brand logos are stored in the R2 bucket; records keep the https URL only.
      const image = await uploadV3Image(file);
      const src = image.src;
      if (!isListingMedia(src)) throw Error("Image storage returned an unsupported address. Retry the upload.");
      if (target) {
        if (alive.current && identity.current === requestUser)
          setDraft((current) => ({
            ...current,
            [target]: {
              ...current[target],
              [target === "agent" ? "photo" : "logo"]: src,
            },
          }));
        return;
      }
      const next = {
        ...pending,
        photos: [
          ...pending.photos,
          { id: crypto.randomUUID(), name: image.name, src },
        ],
      };
      const errors = validateListingRecord(next);
      if (errors.length) throw Error(errors.join("; "));
      if (alive.current && identity.current === requestUser)
        workflow.setPending(next);
    } catch (e) {
      if (alive.current && identity.current === requestUser)
        setError(message(e));
    } finally {
      if (alive.current && identity.current === requestUser) setSaving(false);
    }
  };
  const field = (
    label: string,
    key: keyof ListingRecord["property"],
    type = "text",
  ) => (
    <label key={key} className="v3-lp-field">
      <span>{label}</span>
      <input
        aria-label={label}
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        value={String(draft.property[key] ?? "")}
        onChange={(e) => {
          try {
            changeProperty(key, e.target.value);
            setError(null);
          } catch (e) {
            setError(message(e));
          }
        }}
      />
    </label>
  );
  const select = (
    label: string,
    value: string,
    options: readonly (string | [string, string])[],
    onChange: (value: string) => void,
    ariaLabel = label,
  ) => (
    <label className="v3-lp-field">
      <span>{label}</span>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => {
          const [code, text] =
            typeof option === "string" ? [option, option] : option;
          return (
            <option key={code} value={code}>
              {text}
            </option>
          );
        })}
      </select>
    </label>
  );
  const p = pending.property;
  const specs: [string, string][] = [
    ["Bedrooms", p.beds],
    ["Bathrooms", p.baths],
    ["Floor area", p.area ? `${Number(p.area).toLocaleString()} ${p.areaUnit}` : ""],
  ];
  const overrides = workflow.overrides ?? {};
  const customCount = Object.keys(overrides).length;
  const skippedCount = workflow.skipped?.length ?? 0;
  const pendingCount = Number(workflow.pendingChanges || 0);
  const amount = Number(draft.property.amount);
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";
  const back = (label: string, onClick: () => void) => (
    <button type="button" className="v3-lp-back" onClick={onClick}>
      <ArrowLeft aria-hidden="true" />
      {label}
    </button>
  );
  const closeButton = (
    <button
      type="button"
      className="v3-lp-close"
      aria-label={`Close ${section}`}
      onClick={onClose}
    >
      <X />
    </button>
  );
  const resultCard = (
    item: { id: string; version: number; record: ListingRecord },
  ) => (
    <button
      type="button"
      className="v3-lp-result"
      key={item.id}
      onClick={() => {
        workflow.selectListing(item.record, item.id, item.version);
        setScreen("overview");
        setReview(null);
        setError(null);
      }}
    >
      {item.record.photos[0] ? (
        <span className="v3-lp-result-cover">
          <img src={item.record.photos[0].src} alt="" />
          {item.record.property.status && (
            <span>{item.record.property.status}</span>
          )}
        </span>
      ) : (
        <span className="v3-lp-result-empty">No listing photos</span>
      )}
      <strong>
        {item.record.property.address || item.record.property.name || item.id}
      </strong>
      <small>
        {[item.record.property.name, formatListingPrice(item.record.property) || "Price not provided"]
          .filter(Boolean)
          .join(" · ")}
      </small>
    </button>
  );
  const results = saved.isPending || saved.isFetching ? (
    <p role="status" className="v3-lp-note">Loading saved properties…</p>
  ) : saved.isError ? (
    <div className="v3-lp-warning">
      <p role="alert">{message(saved.error)}</p>
      <button type="button" onClick={() => saved.refetch()}>
        Retry saved properties
      </button>
    </div>
  ) : (
    <>
      <div className="v3-lp-search-summary">
        <small role="status">
          {filtered.length} {filtered.length === 1 ? "property" : "properties"}
        </small>
        {query && (
          <button type="button" className="v3-lp-link" onClick={() => setQuery("")}>
            Clear search
          </button>
        )}
      </div>
      {filtered.length === 0 && (
        <div className="v3-lp-empty">
          <strong>{query ? "No matching properties" : "No saved properties yet"}</strong>
          <p>
            {query
              ? "No saved properties match. Try another address, property name or listing ID."
              : "Save a property from pasted text or manual entry to find it here."}
          </p>
        </div>
      )}
      {filtered.map(resultCard)}
    </>
  );
  const countrySelect = (
    <label className="v3-lp-field">
      <span>Country</span>
      <select
        aria-label="Listing country"
        value={pending.property.country}
        onChange={(e) => {
          setReview(null);
          setChosen([]);
          setError(null);
          workflow.setPending({
            ...pending,
            property: {
              ...pending.property,
              country: e.target.value,
              amount: null,
              currency: ({ IN: "INR", US: "USD", GB: "GBP", CA: "CAD" } as Record<string, string>)[e.target.value],
            },
          });
        }}
      >
        {LISTING_COUNTRIES.map((code) => (
          <option key={code} value={code}>
            {countries[code]}
          </option>
        ))}
      </select>
    </label>
  );
  const heading =
    section === "Agent" ? (
      <header className="v3-lp-head">
        <h2>Edit agent</h2>
        <span className="v3-lp-head-actions">
          {back("Back", () => navigate("Listing"))}
          {closeButton}
        </span>
      </header>
    ) : section === "Brand" ? (
      <header className="v3-lp-head">
        <h2>Edit brand assets</h2>
        <span className="v3-lp-head-actions">
          {back("Back", () => navigate("Listing"))}
          {closeButton}
        </span>
      </header>
    ) : section === "Media" ? (
      <header className="v3-lp-head">
        <h2>Uploads</h2>
        {closeButton}
      </header>
    ) : section === 'Property' || screen === "property" ? (
      <header className="v3-lp-head">
        <h2>Edit property</h2>
        {back("Back", () => {
          setDraft(structuredClone(pending));
          setScreen(pending.property.address || pending.property.name ? "overview" : "welcome");
          setError(null);
          if (section === 'Property') navigate('Listing');
        })}
      </header>
    ) : screen === "overview" ? (
      <header className="v3-lp-head v3-lp-listing-head">
        <button
          type="button"
          className="v3-lp-link"
          aria-label="Back to Listing search"
          onClick={() => setScreen("welcome")}
        >
          ← Search
        </button>
        <h2>{p.address || p.name || "Untitled property"}</h2>
        <small>
          {[p.status || "Saved property", countries[p.country]].filter(Boolean).join(" · ")}
        </small>
      </header>
    ) : (
      <header className="v3-lp-head">
        <h2>Load a listing</h2>
        {closeButton}
      </header>
    );
  return (
    <div
      className="v3-listing-panel"
      data-testid="v3-listing-panel"
      data-screen={section === "Listing" ? screen : section.toLowerCase()}
    >
      {heading}
      <div
        className="v3-listing-scroll"
        ref={(node) => {
          viewport.current = node;
          if (node && section === "Listing" && screen === "overview")
            node.scrollTop = scrollPositions.get(userId) ?? 0;
        }}
        onScroll={(e) => {
          if (section === "Listing" && screen === "overview")
            scrollPositions.set(userId, e.currentTarget.scrollTop);
        }}
      >
        <fieldset disabled={saving} aria-busy={saving}>
          {error && (
            <div role="alert" className="v3-lp-warning">
              {error}
            </div>
          )}
          {section === "Agent" || section === "Brand" ? (
            <section>
              {profile.isPending || profile.isFetching ? (
                <p role="status" className="v3-lp-note">Loading profile…</p>
              ) : profile.isError ? (
                <div className="v3-lp-warning">
                  <p role="alert">{message(profile.error)}</p>
                  <button type="button" onClick={() => profile.refetch()}>
                    Retry profile
                  </button>
                </div>
              ) : section === "Agent" ? (
                <>
                  {/* Layout follows the approved mockup (listing-workflow-v1/editor.js, "Edit agent"): portrait row, one column
                      of fields, then a stacked Save changes / Cancel pair. The saved-agent dropdown is omitted on purpose: the
                      backend keeps one agent profile per user (ListingProfile.userId is unique), so it would only ever list one. */}
                  <div className="v3-lp-identity v3-lp-agent-profile">
                    {draft.agent.photo ? (
                      <img className="v3-lp-portrait v3-lp-portrait-lg" src={draft.agent.photo} alt="Agent portrait" />
                    ) : (
                      <span className="v3-lp-portrait v3-lp-portrait-lg" aria-hidden="true">{initials(draft.agent.name)}</span>
                    )}
                    <span className="v3-lp-identity-text">
                      <small>{draft.agent.photo ? "Agent portrait" : "No portrait yet"}</small>
                      <label className="v3-lp-upload-link">
                        {draft.agent.photo ? "Change photo" : "Upload photo"}
                        <input
                          type="file"
                          aria-label="Upload agent photo"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                          disabled={saving}
                          onChange={(event) => {
                            void upload(event.target.files?.[0], "agent");
                            event.target.value = "";
                          }}
                        />
                      </label>
                    </span>
                  </div>
                  {profile.data && JSON.stringify(profile.data.record.agent) !== JSON.stringify(draft.agent) && (
                    <p className="v3-lp-hint v3-lp-agent-restore">
                      This listing uses different details from your saved profile.{" "}
                      <button
                        type="button"
                        className="v3-lp-link v3-lp-inline"
                        onClick={() => {
                          if (profile.data) setDraft({ ...pending, ...profile.data.record });
                          setError(null);
                        }}
                      >
                        Use saved profile
                      </button>
                    </p>
                  )}
                  <TextField id="agent-name" label="Full name" value={draft.agent.name} recommended={RECOMMENDED_LENGTH.agentName} onChange={(value) => setAgent("name", value)} />
                  <TextField id="agent-agency" label="Agency" value={draft.agent.agency} recommended={RECOMMENDED_LENGTH.agency} onChange={(value) => setAgent("agency", value)} />
                  <TextField id="agent-phone" label="Phone" type="tel" value={draft.agent.phone} recommended={RECOMMENDED_LENGTH.phone} onChange={(value) => setAgent("phone", value)} />
                  <TextField id="agent-email" label="Email" type="email" value={draft.agent.email} onChange={(value) => setAgent("email", value)} />
                  <TextField id="agent-license" label="Registration / licence" optional value={draft.agent.license} recommended={RECOMMENDED_LENGTH.registration} help="Adding a number does not verify it." onChange={(value) => setAgent("license", value)} />
                  <p className="v3-lp-hint">Saves your agent profile and assigns it to the pending listing. It does not update the canvas yet.</p>
                  <div className="v3-lp-actions">
                    <button type="button" className="v3-lp-primary" disabled={saving} onClick={saveProfile}>
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button type="button" className="v3-lp-secondary" disabled={saving} onClick={() => navigate("Listing")}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="v3-lp-identity">
                    {draft.brand.logo ? (
                      <img className="v3-lp-logo" src={draft.brand.logo} alt="Brand logo" />
                    ) : (
                      <span className="v3-lp-wordmark" style={{ "--v3-brand": draft.brand.accent || undefined } as React.CSSProperties}>{draft.brand.name || "Brand"}</span>
                    )}
                    <label className="v3-lp-upload-link">
                      Upload brand logo
                      <input
                        type="file"
                        aria-label="Upload brand logo"
                        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                        disabled={saving}
                        onChange={(event) => {
                          void upload(event.target.files?.[0], "brand");
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <TextField id="brand-name" label="Brand name" value={draft.brand.name} onChange={(value) => setBrand("name", value)} />
                  <TextField id="brand-tagline" label="Call to action / brand signature" ariaLabel="Brand signature" value={draft.brand.tagline} recommended={RECOMMENDED_LENGTH.callToAction} onChange={(value) => setBrand("tagline", value)} />
                  <label className="v3-lp-field">
                    <span>Accent colour</span>
                    <input
                      type="color"
                      aria-label="Accent colour"
                      value={/^#[0-9a-f]{6}$/i.test(draft.brand.accent) ? draft.brand.accent : "#146b64"}
                      onChange={(e) => setBrand("accent", e.target.value)}
                    />
                  </label>
                  <p className="v3-lp-hint">Saves your brand profile and assigns it to the pending listing. The canvas changes only when you apply.</p>
                  <button
                    type="button"
                    className="v3-lp-secondary"
                    onClick={() => {
                      if (profile.data) setDraft({ ...pending, ...profile.data.record });
                      setError(null);
                    }}
                  >
                    Use saved profile
                  </button>
                  <div className="v3-lp-actions">
                    <button type="button" className="v3-lp-primary" disabled={saving} onClick={saveProfile}>
                      {saving ? "Saving…" : "Save Brand"}
                    </button>
                    <button type="button" className="v3-lp-secondary" disabled={saving} onClick={() => navigate("Listing")}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </section>
          ) : section === "Media" ? (
            <section>
              <div className="v3-lp-upload-target">
                <small>Add media to</small>
                <strong>{p.address || p.name || "the pending listing"}</strong>
              </div>
              <label className="v3-listing-upload">
                <ImagePlus aria-hidden="true" />
                <span>Upload photo</span>
                <input
                  aria-label="Upload listing photo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  disabled={saving}
                  onChange={(e) => {
                    void upload(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              <p className="v3-lp-hint">
                Choose photos manually for each frame with Replace image. Uploads stay pending until you save the Property.
              </p>
              <div className="v3-listing-gallery">
                {pending.photos.map((photo) => (
                  <figure key={photo.id}>
                    <img src={photo.src} alt={photo.name} width="128" height="96" />
                    <figcaption>{photo.name}</figcaption>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          const store = useCanvasStore.getState();
                          const element = createImageElement(photo.src);
                          store.addElement(element);
                          store.selectElement(element.id);
                        }}
                      >
                        Add to canvas
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${photo.name}`}
                        onClick={() =>
                          workflow.setPending({
                            ...pending,
                            photos: pending.photos.filter((item) => item.id !== photo.id),
                          })
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </figure>
                ))}
              </div>
              {(p.address || p.name) && (
                <button type="button" className="v3-lp-link" onClick={() => navigate("Listing")}>
                  ← Back to listing overview
                </button>
              )}
            </section>
          ) : section === 'Property' || screen === "property" ? (
            <section>
              <p className="v3-lp-intro">Add the essentials. The canvas changes only when you apply the saved listing.</p>
              <h3 className="v3-lp-form-section">Listing identity</h3>
              <TextField id="property-name" label="Listing name" value={draft.property.name} onChange={(value) => setPropertyText("name", value)} />
              <TextField id="property-type" label="Property type" optional placeholder="Apartment, villa, commercial…" value={draft.property.type} onChange={(value) => setPropertyText("type", value)} />
              <TextField id="property-headline" label="Marketing headline" textarea rows={2} value={draft.property.headline} recommended={RECOMMENDED_LENGTH.headline} onChange={(value) => setPropertyText("headline", value)} />
              <h3 className="v3-lp-form-section">Pricing</h3>
              <div className="v3-listing-grid">
                {select("Listing intent", draft.property.transaction, [["sale", "For sale"], ["rent", "For rent"]], (value) => changeProperty("transaction", value), "Transaction")}
                {select("Currency", draft.property.currency, LISTING_CURRENCIES, (value) => changeProperty("currency", value))}
              </div>
              <div className={draft.property.transaction === "rent" ? "v3-listing-grid" : undefined}>
                {field(draft.property.transaction === "rent" ? "Rent amount" : "Asking price", "amount", "number")}
                {draft.property.transaction === "rent" &&
                  select("Rental period", draft.property.rentalPeriod, [["month", "Per month"], ["week", "Per week"], ["year", "Per year"], ["day", "Per day"]], (value) => changeProperty("rentalPeriod", value))}
              </div>
              <p className="v3-lp-numeric">
                {Number.isFinite(amount) && amount > 0
                  ? `Shown as ${formatListingPrice(draft.property)} · numeric amount ${amount.toLocaleString(draft.property.country === "IN" ? "en-IN" : "en-US")} ${draft.property.currency}`
                  : "Enter a numeric amount. Changing sale/rent clears it."}
              </p>
              <h3 className="v3-lp-form-section">Location</h3>
              <TextField id="property-address" label="Address" value={draft.property.address} recommended={RECOMMENDED_LENGTH.address} onChange={(value) => setPropertyText("address", value)} />
              {select("Country", draft.property.country, LISTING_COUNTRIES.map((code) => [code, countries[code]] as [string, string]), (value) => changeProperty("country", value))}
              <h3 className="v3-lp-form-section">Specifications</h3>
              <div className="v3-lp-grid-3">
                {field("Beds", "beds", "number")}
                {field("Baths", "baths", "number")}
                {field(`Area · ${draft.property.areaUnit}`, "area", "number")}
              </div>
              <p className="v3-lp-help">Whole numbers for rooms; area in {draft.property.areaUnit}. Change the unit in Additional details.</p>
              <h3 className="v3-lp-form-section">Description and highlights</h3>
              <TextField id="property-description" label="Description" textarea rows={4} value={draft.property.description} limit={STORED_DESCRIPTION_LIMIT} onChange={(value) => setPropertyText("description", value)} />
              <div className="v3-lp-field">
                <span className="v3-lp-label-row">
                  <label htmlFor="property-features">Highlights</label>
                  <span className="v3-lp-optional">Optional</span>
                </span>
                <textarea
                  id="property-features"
                  aria-label="Features"
                  aria-describedby="property-features-help"
                  rows={2}
                  placeholder="Garden, covered parking"
                  value={featuresText}
                  onChange={(e) => {
                    setFeaturesText(e.target.value);
                    changeProperty("features", e.target.value);
                  }}
                />
                <span className="v3-lp-field-meta">
                  <span id="property-features-help" className="v3-lp-help">Separate with commas. Up to 3 appear on the overview card.</span>
                  <span className="v3-lp-count">{draft.property.features.length} {draft.property.features.length === 1 ? "highlight" : "highlights"}</span>
                </span>
              </div>
              <details className="v3-lp-details">
                <summary>Additional details</summary>
                {select("Area unit", draft.property.areaUnit, LISTING_AREA_UNITS, (value) => changeProperty("areaUnit", value))}
                <TextField id="property-status" label="Listing status" optional placeholder="Active, sold, rented…" value={draft.property.status} onChange={(value) => setPropertyText("status", value)} />
              </details>
              <div className="v3-lp-actions">
                <button type="button" className="v3-lp-primary" disabled={saving} onClick={() => void saveProperty()}>
                  {saving ? "Saving…" : "Save property"}
                </button>
                <button
                  type="button"
                  className="v3-lp-secondary"
                  disabled={saving}
                  onClick={() => {
                    setDraft(structuredClone(pending));
                    setScreen(pending.property.address ? "overview" : "welcome");
                    setError(null);
                    if (section === 'Property' && !stayInDetails) navigate('Listing');
                  }}
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : screen === "overview" ? (
            <section className="v3-lp-overview">
              <div className="v3-lp-section-row">
                <h3>
                  Media <small>({pending.photos.length})</small>
                </h3>
                <button type="button" className="v3-lp-link" onClick={() => navigate("Uploads")}>
                  See all
                </button>
              </div>
              {pending.photos.length ? (
                <button type="button" className="v3-lp-photos" aria-label="See all listing media" onClick={() => navigate("Uploads")}>
                  {pending.photos.slice(0, 2).map((photo) => (
                    <img key={photo.id} src={photo.src} alt={photo.name} />
                  ))}
                </button>
              ) : (
                <div className="v3-lp-empty-media">
                  <span>No listing photos</span>
                  <button type="button" onClick={() => navigate("Uploads")}>
                    Open Uploads
                  </button>
                </div>
              )}
              <button type="button" className="v3-lp-card v3-property-card" onClick={() => navigate('Property')}>
                <span className="v3-lp-card-label">
                  Property information
                  <Pencil aria-hidden="true" />
                </span>
                <strong className="v3-lp-address">{p.address || "Add address"}</strong>
                <span className="v3-lp-description">{p.description || "Description not provided"}</span>
                <span className="v3-lp-price">
                  <small>{p.transaction === "rent" ? "Rent" : "Listing price"}</small>
                  <strong>{formatListingPrice(p) || "Add price"}</strong>
                </span>
                <span className="v3-lp-specs">
                  {specs.map(([label, value]) => (
                    <span key={label}>
                      <small>{label}</small>
                      <strong>{value || "—"}</strong>
                    </span>
                  ))}
                </span>
                {p.type && <span className="v3-lp-extras">{p.type}</span>}
                <span className="v3-lp-chips">
                  {p.status && <span className="v3-lp-status">{p.status}</span>}
                  {p.features.slice(0, 3).map((feature) => (
                    <span key={feature} className="v3-lp-chip">{feature}</span>
                  ))}
                  {p.features.length > 3 && <span className="v3-lp-chip">+{p.features.length - 3} more</span>}
                </span>
              </button>
              <h3 className="v3-lp-section-label">Agent</h3>
              <button type="button" className="v3-lp-card v3-lp-profile" aria-label={`Agent ${pending.agent.name || "not set"}`} onClick={() => navigate("Agent")}>
                {pending.agent.photo ? (
                  <img className="v3-lp-portrait" src={pending.agent.photo} alt="" />
                ) : (
                  <span className="v3-lp-portrait" aria-hidden="true">{initials(pending.agent.name)}</span>
                )}
                <span>
                  <strong>{pending.agent.name || "Add agent"}</strong>
                  {[pending.agent.agency, pending.agent.phone, pending.agent.email].filter(Boolean).map((line) => (
                    <small key={line}>{line}</small>
                  ))}
                </span>
                <ChevronRight aria-hidden="true" />
              </button>
              <h3 className="v3-lp-section-label">Brand assets</h3>
              <button type="button" className="v3-lp-card v3-lp-brand" aria-label={`Brand ${pending.brand.name || "not set"}`} onClick={() => navigate("Brand")}>
                {pending.brand.logo ? (
                  <img className="v3-lp-logo" src={pending.brand.logo} alt="" />
                ) : (
                  <span className="v3-lp-wordmark" style={{ "--v3-brand": pending.brand.accent || undefined } as React.CSSProperties}>{pending.brand.name || "Add brand"}</span>
                )}
                <small>
                  {pending.brand.accent && <span className="v3-lp-swatch" style={{ background: pending.brand.accent }} />}
                  {pending.brand.tagline || "No brand signature"}
                  <ChevronRight aria-hidden="true" />
                </small>
              </button>
            </section>
          ) : (
            <section>
              <div className="v3-lp-welcome">
                <span className="v3-lp-eyebrow">Start with the facts</span>
                <h3>Your listing, ready to design.</h3>
                <p>Find a saved record or paste a seller’s message. Review the details before updating the canvas.</p>
              </div>
              <div className="v3-listing-sources" role="tablist" aria-label="Listing source">
                {SOURCE_TABS.map(([key, tab], index) => (
                  <button
                    type="button"
                    role="tab"
                    id={`v3-lp-tab-${key}`}
                    aria-controls="v3-lp-source-panel"
                    aria-selected={source === tab}
                    tabIndex={source === tab ? 0 : -1}
                    key={tab}
                    onClick={() => setSource(tab)}
                    onKeyDown={(event) => {
                      const next =
                        event.key === "ArrowRight" ? (index + 1) % SOURCE_TABS.length
                        : event.key === "ArrowLeft" ? (index + SOURCE_TABS.length - 1) % SOURCE_TABS.length
                        : event.key === "Home" ? 0
                        : event.key === "End" ? SOURCE_TABS.length - 1
                        : -1;
                      if (next < 0) return;
                      event.preventDefault();
                      setSource(SOURCE_TABS[next][1]);
                      document.getElementById(`v3-lp-tab-${SOURCE_TABS[next][0]}`)?.focus();
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div
                id="v3-lp-source-panel"
                role="tabpanel"
                aria-labelledby={`v3-lp-tab-${SOURCE_TABS.find(([, tab]) => tab === source)?.[0]}`}
                className="v3-lp-source-panel"
              >
              {source === "Listing ID" ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setQuery(lookup.trim());
                    setLookupSubmitted(true);
                  }}
                >
                  {countrySelect}
                  {select("Listing source", "saved", [["saved", "Your saved properties"], ["live", `${pending.property.country === "IN" ? "State RERA" : "MLS"} · not connected`]], () => {}, "Listing source")}
                  <label className="v3-lp-field">
                    <span>Search by address or listing ID</span>
                    <span className="v3-lp-search">
                      <Search aria-hidden="true" />
                      <input aria-label="Search by address or listing ID" value={lookup} placeholder="Address, property name or listing ID" onChange={(e) => setLookup(e.target.value)} />
                    </span>
                  </label>
                  <button type="submit" className="v3-lp-primary v3-lp-full">
                    Find listing
                  </button>
                  {lookupSubmitted ? (
                    results
                  ) : (
                    <div className="v3-lp-info">
                      <strong>Live listing sources</strong>
                      <p>Country providers are not connected. Find listing searches your saved properties by listing ID, address or name.</p>
                    </div>
                  )}
                </form>
              ) : source === "Saved properties" ? (
                <div>
                  <label className="v3-lp-field">
                    <span>Search saved properties</span>
                    <span className="v3-lp-search">
                      <Search aria-hidden="true" />
                      <input type="search" aria-label="Search saved properties" placeholder="Address, property name or listing ID" value={query} onChange={(e) => setQuery(e.target.value)} />
                    </span>
                  </label>
                  {results}
                </div>
              ) : (
                <div>
                  {countrySelect}
                  <div className="v3-lp-field">
                    <span className="v3-lp-label-row">
                      <label htmlFor="v3-lp-composer">Listing or WhatsApp message</label>
                      {paste === LISTING_EXAMPLE_TEXT && <span className="v3-lp-optional">Sample text</span>}
                    </span>
                    <textarea
                      id="v3-lp-composer"
                      ref={composer}
                      aria-label="Property text"
                      aria-describedby="v3-lp-composer-help"
                      rows={6}
                      placeholder="3 BHK, 80 Lakh, Address: Satellite Road, Ahmedabad"
                      value={paste}
                      maxLength={50000}
                      onChange={(e) => { setPaste(e.target.value); setReview(null); setChosen([]); setError(null); setConfirmExample(false); }}
                    />
                    <span id="v3-lp-composer-help" className="v3-lp-help">
                      {paste === LISTING_EXAMPLE_TEXT ? "Fictional sample text for trying the review — not a verified listing." : "Paste one property. Nothing changes until you review and confirm facts."}
                    </span>
                  </div>
                  {confirmExample ? (
                    <div className="v3-lp-confirm" role="group" aria-label="Replace message with sample text">
                      <p>Replace your message with the sample text? Your current text will be removed.</p>
                      <div className="v3-lp-button-pair">
                        <button type="button" className="v3-lp-secondary" onClick={() => setConfirmExample(false)}>
                          Keep my text
                        </button>
                        <button type="button" className="v3-lp-primary" onClick={insertExample}>
                          Replace with sample
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="v3-lp-button-pair">
                      <button
                        type="button"
                        className="v3-lp-secondary"
                        onClick={() => (paste.trim() && paste !== LISTING_EXAMPLE_TEXT ? setConfirmExample(true) : insertExample())}
                      >
                        Use example
                      </button>
                      <button
                        type="button"
                        className="v3-lp-primary"
                        onClick={() => {
                          const result = reviewListingText(paste, pending);
                          setReview(result);
                          setChosen(result.facts.filter((f) => f.selected && !f.path.startsWith("agent.")).map((f) => f.id));
                          setError(null);
                        }}
                      >
                        Extract &amp; review
                      </button>
                    </div>
                  )}
                  {review && (
                    <div className="v3-listing-review">
                      <h3>Review extracted facts</h3>
                      {review.error && <p role="alert" className="v3-lp-warning">{review.error}</p>}
                      <p className="v3-lp-hint">Contact details are suggestions. Select them explicitly only after checking the source.</p>
                      {review.facts.map((fact) => (
                        <label key={fact.id} className="v3-listing-fact">
                          <span>
                            <input
                              type="checkbox"
                              checked={chosen.includes(fact.id)}
                              disabled={review.rejected}
                              onChange={(e) =>
                                setChosen((ids) =>
                                  e.target.checked
                                    ? [...ids.filter((id) => !review.facts.some((other) => other.id === id && other.path === fact.path)), fact.id]
                                    : ids.filter((id) => id !== fact.id),
                                )
                              }
                            />
                            {fact.path.startsWith("agent.") ? "Contact suggestion · " : ""}
                            {fact.label}: {fact.path === "property.amount" && typeof fact.value === "string" ? formatReviewedPrice(review, fact, pending.property) || fact.value : Array.isArray(fact.value) ? fact.value.join(", ") : fact.value}
                            {fact.ambiguous && " — choose one candidate"}
                          </span>
                          <details>
                            <summary>Source snippet</summary>
                            <blockquote>{fact.evidence}</blockquote>
                          </details>
                        </label>
                      ))}
                      <button
                        type="button"
                        className="v3-lp-primary v3-lp-full"
                        disabled={review.rejected || chosen.length === 0}
                        onClick={() => {
                          const result = applyReviewedFacts(pending, review, chosen);
                          if (!result.ok) {
                            setError(result.error);
                            return;
                          }
                          workflow.setPending(result.record);
                          setReview(null);
                          setScreen("overview");
                        }}
                      >
                        Confirm selected facts
                      </button>
                    </div>
                  )}
                </div>
              )}
              </div>
              <button type="button" className="v3-lp-link v3-listing-manual" onClick={openProperty}>
                Enter manually
              </button>
            </section>
          )}
        </fieldset>
      </div>
      {section === "Listing" && screen === "overview" && (
        <footer className="v3-lp-apply" aria-label="Apply listing">
          <div>
            <small>{pendingCount} pending {pendingCount === 1 ? "change" : "changes"}</small>
            {customCount > 0 && <small>{customCount} custom {customCount === 1 ? "value" : "values"}</small>}
          </div>
          {skippedCount > 0 && (
            <p className="v3-lp-note">{skippedCount} {skippedCount === 1 ? "update needs" : "updates need"} attention. Existing artwork is kept for these elements.</p>
          )}
          {applyError && <p role="alert" className="v3-lp-warning">{applyError}</p>}
          <button
            type="button"
            className="v3-lp-primary v3-lp-full"
            disabled={!pendingCount}
            onClick={() => {
              const result = workflow.applyToDesign();
              setApplyError(result.ok ? null : result.error);
            }}
          >
            Apply to design
          </button>
          <button type="button" className="v3-lp-secondary v3-lp-full" disabled={!workflow.lastApplyAvailable} onClick={() => {
            const result = workflow.undoLastApply();
            setApplyError(result.ok ? null : result.error);
          }}>Undo last apply</button>
        </footer>
      )}
    </div>
  );
}
