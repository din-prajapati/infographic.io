import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ArrowLeft, ChevronRight, ImagePlus } from "lucide-react";
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
} from "@shared/listingWorkflow";
import { useV3ListingWorkflow } from "../../../hooks/useV3ListingWorkflow";
import { propertiesApi, listingProfilesApi } from "../../../lib/listingApi";
import { useCanvasStore } from "../../../hooks/useCanvasStore";
import { createImageElement } from "../../../lib/canvasUtils";
import { readReplacementImage } from "../../../lib/v3ElementEditing";
import "./v3-listing-panel.css";

export interface V3ListingPanelProps {
  section?: "Listing" | "Agent" | "Brand" | "Media";
  userId: string;
  onNavigate: (panel: "Listing" | "Agent" | "Brand" | "Uploads") => void;
  onClose: () => void;
}
const countries: Record<string, string> = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
};
const scrollPositions = new Map<string, number>();
const message = (error: unknown) =>
  error instanceof Error ? error.message : "The request failed. Please retry.";

export function V3ListingPanel({
  section = "Listing",
  userId,
  onNavigate,
  onClose,
}: V3ListingPanelProps) {
  const workflow = useV3ListingWorkflow();
  const { pending } = workflow;
  const [screen, setScreen] = useState<"welcome" | "overview" | "property">(
    () =>
      pending.property.address || pending.property.name
        ? "overview"
        : "welcome",
  );
  const [source, setSource] = useState<
    "Paste text" | "Saved properties" | "Listing ID"
  >("Paste text");
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
    enabled: section === "Listing" && source === "Saved properties",
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
  const navigate = (target: "Listing" | "Agent" | "Brand" | "Uploads") => {
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
    setError(null);
    setScreen("property");
  };
  const saveProperty = async (record: ListingRecord = draft) => {
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
      workflow.setPending(result.record);
      workflow.setSelectedListingIdentity(result.id, result.version);
      setScreen("overview");
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
        ...pending,
        ...(section === "Agent"
          ? { agent: result.record.agent }
          : { brand: result.record.brand }),
      });
      await profile.refetch();
      if (alive.current && identity.current === requestUser) navigate("Listing");
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
      if (file.size > 10 * 1024 * 1024)
        throw Error("Choose an image smaller than 10 MB.");
      const image = await readReplacementImage(file);
      let src = image.src;
      if (src.length > 2 * 1024 * 1024) {
        const decoded = await new Promise<HTMLImageElement>(
          (resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(Error("Unable to resize image."));
            img.src = src;
          },
        );
        const scale = Math.min(
          1,
          1600 / Math.max(decoded.naturalWidth, decoded.naturalHeight),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(decoded.naturalWidth * scale);
        canvas.height = Math.round(decoded.naturalHeight * scale);
        const context = canvas.getContext("2d");
        if (!context) throw Error("Image processing unavailable.");
        context.drawImage(decoded, 0, 0, canvas.width, canvas.height);
        src = canvas.toDataURL("image/jpeg", 0.8);
      }
      if (!isListingMedia(src))
        throw Error("Choose a raster image smaller than 2 MB after resizing.");
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
    <label key={key}>
      {label}
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
  return (
    <div className="v3-listing-panel" data-testid="v3-listing-panel">
      <header className="v3-listing-header">
        {(section !== "Listing" || screen !== "welcome") && (
          <button
            type="button"
            aria-label="Back to Listing"
            onClick={() =>
              section !== "Listing" ? navigate("Listing") : setScreen("welcome")
            }
          >
            <ArrowLeft />
          </button>
        )}
        <h2>{section === "Listing" ? "Listing" : section}</h2>
        <button type="button" aria-label={`Close ${section}`} onClick={onClose}>
          <X />
        </button>
      </header>
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
            <div role="alert" className="v3-listing-error">
              {error}
            </div>
          )}
          {section === "Agent" || section === "Brand" ? (
            <section>
              <p>
                Save identity to your profile, then apply it to this design when
                ready.
              </p>
              {profile.isPending || profile.isFetching ? (
                <p role="status">Loading profile…</p>
              ) : profile.isError ? (
                <>
                  <p role="alert">{message(profile.error)}</p>
                  <button onClick={() => profile.refetch()}>
                    Retry profile
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (profile.data)
                        setDraft({ ...pending, ...profile.data.record });
                      setError(null);
                    }}
                  >
                    Use saved profile
                  </button>
                  {Object.entries(
                    draft[section === "Agent" ? "agent" : "brand"],
                  ).map(([key, value]) => (
                    <label key={key}>
                      {section} {key}
                      <input
                        aria-label={`${section} ${key}`}
                        value={value}
                        onChange={(e) =>
                          setDraft((current) => ({
                            ...current,
                            [section === "Agent" ? "agent" : "brand"]: {
                              ...current[
                                section === "Agent" ? "agent" : "brand"
                              ],
                              [key]: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                  <label>
                    {section === "Agent"
                      ? "Upload agent photo"
                      : "Upload brand logo"}
                    <input
                      type="file"
                      aria-label={
                        section === "Agent"
                          ? "Upload agent photo"
                          : "Upload brand logo"
                      }
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      disabled={saving}
                      onChange={(event) => {
                        void upload(
                          event.target.files?.[0],
                          section === "Agent" ? "agent" : "brand",
                        );
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <div className="v3-listing-actions">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={saveProfile}
                    >
                      {saving ? "Saving…" : `Save ${section}`}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => navigate("Listing")}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </section>
          ) : section === "Media" ? (
            <section>
              <h3>Listing photos</h3>
              <p>
                Select photos manually for each frame using Replace image in the
                artwork. Uploads stay pending until you save the Property.
              </p>
              <label className="v3-listing-upload">
                <ImagePlus />
                Upload photo
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
              <div className="v3-listing-gallery">
                {pending.photos.map((photo) => (
                  <figure key={photo.id}>
                    <img
                      src={photo.src}
                      alt={photo.name}
                      width="128"
                      height="96"
                    />
                    <figcaption>{photo.name}</figcaption>
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
                          photos: pending.photos.filter(
                            (p) => p.id !== photo.id,
                          ),
                        })
                      }
                    >
                      Remove
                    </button>
                  </figure>
                ))}
              </div>
              <button type="button" onClick={() => navigate("Uploads")}>
                Open Uploads
              </button>
            </section>
          ) : screen === "property" ? (
            <section>
              <h3>Property information</h3>
              <p>
                Saving updates the property record. Artwork changes only when
                you Apply.
              </p>
              {field("Property name", "name")}
              {field("Address", "address")}
              {field("Headline", "headline")}
              <label>
                Description
                <textarea
                  aria-label="Description"
                  value={draft.property.description}
                  onChange={(e) =>
                    changeProperty("description", e.target.value)
                  }
                />
              </label>
              <div className="v3-listing-grid">
                <label>
                  Country
                  <select
                    aria-label="Country"
                    value={draft.property.country}
                    onChange={(e) => changeProperty("country", e.target.value)}
                  >
                    {LISTING_COUNTRIES.map((code) => (
                      <option key={code} value={code}>
                        {countries[code]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Transaction
                  <select
                    aria-label="Transaction"
                    value={draft.property.transaction}
                    onChange={(e) =>
                      changeProperty("transaction", e.target.value)
                    }
                  >
                    <option value="sale">For sale</option>
                    <option value="rent">For rent</option>
                  </select>
                </label>
                <label>
                  Currency
                  <select
                    aria-label="Currency"
                    value={draft.property.currency}
                    onChange={(e) => changeProperty("currency", e.target.value)}
                  >
                    {LISTING_CURRENCIES.map((code) => (
                      <option key={code}>{code}</option>
                    ))}
                  </select>
                </label>
                {field(
                  draft.property.transaction === "rent"
                    ? "Rent amount"
                    : "Asking price",
                  "amount",
                  "number",
                )}
                {draft.property.transaction === "rent" && (
                  <label>
                    Rental period
                    <select
                      aria-label="Rental period"
                      value={draft.property.rentalPeriod}
                      onChange={(e) =>
                        changeProperty("rentalPeriod", e.target.value)
                      }
                    >
                      {["month", "week", "year", "day"].map((period) => (
                        <option key={period}>{period}</option>
                      ))}
                    </select>
                  </label>
                )}
                {field("Beds", "beds", "number")}
                {field("Baths", "baths", "number")}
                {field("Area", "area", "number")}
                <label>
                  Area unit
                  <select
                    aria-label="Area unit"
                    value={draft.property.areaUnit}
                    onChange={(e) => changeProperty("areaUnit", e.target.value)}
                  >
                    {LISTING_AREA_UNITS.map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </select>
                </label>
              </div>
              {field("Property type", "type")}
              {field("Status", "status")}
              <label>
                Features, separated by commas
                <input
                  aria-label="Features"
                  value={draft.property.features.join(", ")}
                  onChange={(e) => changeProperty("features", e.target.value)}
                />
              </label>
              <div className="v3-listing-actions">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveProperty()}
                >
                  {saving ? "Saving…" : "Save property"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setDraft(structuredClone(pending));
                    setScreen(
                      pending.property.address ? "overview" : "welcome",
                    );
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : screen === "overview" ? (
            <section>
              <div className="v3-listing-address">
                <strong>
                  {pending.property.address ||
                    pending.property.name ||
                    "Untitled property"}
                </strong>
                <small>
                  Pending listing · {countries[pending.property.country]}
                </small>
              </div>
              <button
                type="button"
                className="v3-listing-card v3-property-card"
                onClick={openProperty}
              >
                <span>
                  <strong>Property information</strong>
                  <span>{pending.property.address || "Add address"}</span>
                  <span>
                    {pending.property.description || "Add a description"}
                  </span>
                  <b>{formatListingPrice(pending.property) || "Add price"}</b>
                  <span>
                    {formatSpecifications(pending.property) ||
                      "Add specifications"}
                  </span>
                  <small>
                    {[
                      pending.property.type,
                      pending.property.status,
                      ...pending.property.features,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </span>
                <ChevronRight />
              </button>
              <div className="v3-listing-card">
                <div className="v3-listing-card-title">
                  <h3>Media</h3>
                  <button type="button" onClick={() => navigate("Uploads")}>
                    See all
                  </button>
                </div>
                <div className="v3-listing-thumbs">
                  {pending.photos.slice(0, 2).map((p) => (
                    <img
                      key={p.id}
                      src={p.src}
                      alt={p.name}
                      width="110"
                      height="80"
                    />
                  ))}
                  {pending.photos.length === 0 && (
                    <p>No property photos. Add images in Uploads.</p>
                  )}
                </div>
              </div>
              {(["Agent", "Brand"] as const).map((target) => (
                <button
                  key={target}
                  type="button"
                  className="v3-listing-card"
                  onClick={() => navigate(target)}
                >
                  <span>
                    <strong>{target}</strong>
                    <span>
                      {(target === "Agent" ? pending.agent : pending.brand)
                        .name || `Add ${target.toLowerCase()}`}
                    </span>
                  </span>
                  <ChevronRight />
                </button>
              ))}
            </section>
          ) : (
            <section>
              <h3>Find your next listing</h3>
              <p>Bring your property details into a design.</p>
              <label>
                Country
                <select
                  aria-label="Listing country"
                  value={pending.property.country}
                  onChange={(e) => { setReview(null); setChosen([]); setError(null);
                    workflow.setPending({
                      ...pending,
                      property: {
                        ...pending.property,
                        country: e.target.value,
                        amount: null,
                        currency: (
                          {
                            IN: "INR",
                            US: "USD",
                            GB: "GBP",
                            CA: "CAD",
                          } as Record<string, string>
                        )[e.target.value],
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
              <div
                className="v3-listing-sources"
                role="tablist"
                aria-label="Listing source"
              >
                {(
                  ["Listing ID", "Paste text", "Saved properties"] as const
                ).map((tab) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={source === tab}
                    key={tab}
                    onClick={() => setSource(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {source === "Listing ID" ? (
                <div>
                  <p>
                    Country providers are not connected. Search Saved properties
                    by listing ID, address or name.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSource("Saved properties")}
                  >
                    Search saved catalogue
                  </button>
                </div>
              ) : source === "Saved properties" ? (
                <div>
                  <label>
                    Search saved properties
                    <input
                      type="search"
                      aria-label="Search saved properties"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  {query && (
                    <button type="button" onClick={() => setQuery("")}>
                      Clear search
                    </button>
                  )}
                  {saved.isPending || saved.isFetching ? (
                    <p role="status">Loading saved properties…</p>
                  ) : saved.isError ? (
                    <>
                      <p role="alert">{message(saved.error)}</p>
                      <button type="button" onClick={() => saved.refetch()}>
                        Retry saved properties
                      </button>
                    </>
                  ) : (
                    <>
                      <p role="status">
                        {filtered.length}{" "}
                        {filtered.length === 1 ? "property" : "properties"}
                      </p>
                      {filtered.length === 0 && (
                        <p>
                          No saved properties match. Clear search or enter a
                          property manually.
                        </p>
                      )}
                      {filtered.map((item) => (
                        <button
                          type="button"
                          className="v3-listing-card"
                          key={item.id}
                          onClick={() => {
                            workflow.selectListing(
                              item.record,
                              item.id,
                              item.version,
                            );
                            setScreen("overview");
                            setReview(null);
                            setError(null);
                          }}
                        >
                          {item.record.property.address ||
                            item.record.property.name ||
                            item.id}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <label>
                    Property text
                    <textarea
                      aria-label="Property text"
                      placeholder="Address: …&#10;Price: …&#10;Beds: …"
                      value={paste}
                      maxLength={50000}
                      onChange={(e) => { setPaste(e.target.value); setReview(null); setChosen([]); setError(null); }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const result = reviewListingText(paste, pending);
                      setReview(result);
                      setChosen(
                        result.facts
                          .filter(
                            (f) => f.selected && !f.path.startsWith("agent."),
                          )
                          .map((f) => f.id),
                      );
                      setError(null);
                    }}
                  >
                    Extract &amp; review
                  </button>
                  {review && (
                    <div className="v3-listing-review">
                      <h3>Review extracted facts</h3>
                      {review.error && <p role="alert">{review.error}</p>}
                      <p>
                        Contact details are suggestions. Select them explicitly
                        only after checking the source.
                      </p>
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
                                    ? [
                                        ...ids.filter(
                                          (id) =>
                                            !review.facts.some(
                                              (other) =>
                                                other.id === id &&
                                                other.path === fact.path,
                                            ),
                                        ),
                                        fact.id,
                                      ]
                                    : ids.filter((id) => id !== fact.id),
                                )
                              }
                            />
                            {fact.path.startsWith("agent.")
                              ? "Contact suggestion · "
                              : ""}
                            {fact.label}:{" "}
                            {Array.isArray(fact.value)
                              ? fact.value.join(", ")
                              : fact.value}
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
                        disabled={review.rejected || chosen.length === 0}
                        onClick={() => {
                          const result = applyReviewedFacts(
                            pending,
                            review,
                            chosen,
                          );
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
              <button
                type="button"
                className="v3-listing-manual"
                onClick={openProperty}
              >
                Enter manually
              </button>
            </section>
          )}
        </fieldset>
      </div>
    </div>
  );
}
