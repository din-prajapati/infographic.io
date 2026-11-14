import { useEffect, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import {
  isListingMedia,
  LISTING_AREA_UNITS,
  LISTING_CURRENCIES,
  pricingPatch,
  type ListingRecord,
} from "@shared/listingWorkflow";
import { useCanvasStore } from "../../../hooks/useCanvasStore";
import { useV3ListingWorkflow } from "../../../hooks/useV3ListingWorkflow";
import { V3_SLOT_CATALOG, resolveSlot } from "../../../lib/v3ListingWorkflow";
import { uploadV3Image } from "../../../lib/v3MediaUpload";
import "./v3-template-fields.css";
export function V3TemplateFields({ onClose }: { onClose: () => void }) {
  const state = useCanvasStore();
  const workflow = useV3ListingWorkflow();
  const selected =
    state.selectedElementIds.length === 1
      ? state.elements.find((e) => e.id === state.selectedElementIds[0])
      : undefined;
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const selection = useRef(selected?.id);
  selection.current = selected?.id;
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const binding = selected ? workflow.bindings[selected.id]?.slot : undefined;
  const customized =
    selected &&
    Object.prototype.hasOwnProperty.call(workflow.overrides, selected.id);
  const compatible =
    selected &&
    (selected.type === "text" || selected.type === "image") &&
    !selected.frameOf &&
    !selected.locked;
  const result = (action: { ok: boolean; error?: string }) =>
    setError(
      action.ok ? null : (action.error ?? "Unable to change this element."),
    );
  const updateProperty = (
    key: keyof ListingRecord["property"],
    value: string,
  ) => {
    try {
      workflow.setPending({
        ...workflow.pending,
        property: {
          ...workflow.pending.property,
          ...(["amount", "currency", "transaction", "rentalPeriod"].includes(
            key,
          )
            ? pricingPatch(workflow.pending.property, key as "amount", value)
            : {
                [key]:
                  key === "features"
                    ? value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean)
                    : value,
              }),
        },
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid field value.");
    }
  };
  const canonicalKey: Record<string, string> = {
    "property.location": "address",
    "property.intent": "transaction",
    "agent.rera": "license",
    "agent.cta": "tagline",
  };
  const updateCanonical = (value: string) => {
    if (!binding) return;
    const [group, field] = binding.split(".");
    const key = canonicalKey[binding] ?? field;
    if (group === "property")
      updateProperty(key as keyof ListingRecord["property"], value);
    else {
      const section =
        binding === "agent.cta" ? "brand" : (group as "agent" | "brand");
      workflow.setPending({
        ...workflow.pending,
        [section]: { ...workflow.pending[section], [key]: value },
      });
    }
  };
  const propertyField = (
    label: string,
    key: keyof ListingRecord["property"],
  ) => (
    <label key={key}>
      {label}
      <input
        aria-label={label}
        type="number"
        min="0"
        step="any"
        value={String(workflow.pending.property[key] ?? "")}
        onChange={(e) => updateProperty(key, e.target.value)}
      />
    </label>
  );
  return (
    <div className="v3-template-fields">
      <header>
        <h2>Template Fields</h2>
        <button
          type="button"
          aria-label="Close Template Fields"
          onClick={onClose}
        >
          <X />
        </button>
      </header>
      {!selected ? (
        <p>Select one text or image element to link a field.</p>
      ) : (
        <>
          <section>
            <div className="v3-tf-selection">
              <h3>{(binding && V3_SLOT_CATALOG.find((item) => item.slot === binding)?.label) || selected.name || "Selected element"}</h3>
              <p className="v3-field-state" role="status">
                <span>{selected.type === "image" ? "Image" : selected.type === "text" ? "Text" : "Element"} · </span>
                {customized
                  ? "Customized for this design"
                  : binding
                    ? "Linked field"
                    : "Independent element"}
              </p>
            </div>
            {!compatible && (
              <p>
                This element cannot accept a field. Select an unlocked text or
                image element.
              </p>
            )}
            <label>
              <span>Get content from</span>
              <select
                aria-label="Linked field"
                disabled={!compatible}
                value={binding === "property.facts" ? "property.specs" : binding ?? ""}
                onChange={(e) => {
                  if (!e.target.value) {
                    workflow.detach(selected.id);
                    setError(null);
                    return;
                  }
                  result(workflow.setBinding(selected.id, e.target.value));
                }}
              >
                <option value="">Independent element</option>
                {(["property", "agent", "brand"] as const).map((group) => (
                  <optgroup
                    key={group}
                    label={
                      group === "property"
                        ? "Property"
                        : group === "agent"
                          ? "Agent"
                          : "Brand"
                    }
                  >
                    {V3_SLOT_CATALOG.filter((item) =>
                      item.slot.startsWith(group + "."),
                    ).map((item) => (
                      <option
                        key={item.slot}
                        value={item.slot}
                        disabled={item.type !== selected.type}
                      >
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            {binding && (
              <>
                <p>
                  Source:{" "}
                  {binding.startsWith("property.")
                    ? "Property"
                    : binding.startsWith("agent.")
                      ? "Agent"
                      : "Brand"}
                  . Changes stay pending until Apply to design.
                </p>
                {binding === "property.specs" ||
                binding === "property.facts" ||
                binding === "property.area" ? (
                  <div className="v3-template-field-grid">
                    {propertyField("Beds", "beds")}
                    {propertyField("Baths", "baths")}
                    {propertyField("Area", "area")}
                    <label>
                      Area unit
                      <select
                        aria-label="Area unit"
                        value={workflow.pending.property.areaUnit}
                        onChange={(e) =>
                          updateProperty("areaUnit", e.target.value)
                        }
                      >
                        {LISTING_AREA_UNITS.map((unit) => (
                          <option key={unit}>{unit}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : binding === "property.price" ? (
                  <div className="v3-template-field-grid">
                    <label>
                      Transaction
                      <select
                        aria-label="Transaction"
                        value={workflow.pending.property.transaction}
                        onChange={(e) =>
                          updateProperty("transaction", e.target.value)
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
                        value={workflow.pending.property.currency}
                        onChange={(e) =>
                          updateProperty("currency", e.target.value)
                        }
                      >
                        {LISTING_CURRENCIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    {propertyField("Amount", "amount")}
                    {workflow.pending.property.transaction === "rent" && (
                      <label>
                        Rental period
                        <select
                          aria-label="Rental period"
                          value={workflow.pending.property.rentalPeriod}
                          onChange={(e) =>
                            updateProperty("rentalPeriod", e.target.value)
                          }
                        >
                          {["month", "week", "year", "day"].map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                ) : selected.type === "text" ? (
                  binding === "property.intent" ? (
                    <label>
                      Sale / rent
                      <select
                        aria-label="Sale / rent"
                        value={workflow.pending.property.transaction}
                        onChange={(e) => updateCanonical(e.target.value)}
                      >
                        <option value="sale">For sale</option>
                        <option value="rent">For rent</option>
                      </select>
                    </label>
                  ) : (
                    <label>
                      Linked value
                      <textarea
                        aria-label="Linked value"
                        value={
                          binding === "property.features"
                            ? workflow.pending.property.features.join(", ")
                            : resolveSlot(workflow.pending, binding)
                        }
                        onChange={(e) => updateCanonical(e.target.value)}
                      />
                    </label>
                  )
                ) : (
                  <p>
                    Choose a photo manually below. Property photos have no
                    automatic assignment.
                  </p>
                )}
                <button
                  type="button"
                  disabled={!compatible}
                  onClick={() => {
                    workflow.detach(selected.id);
                    setError(null);
                  }}
                >
                  Detach field
                </button>
                <button
                  type="button"
                  disabled={!compatible}
                  onClick={() => {
                    workflow.useLinked(selected.id);
                    setError(null);
                  }}
                >
                  Use linked value
                </button>
              </>
            )}
          </section>
          <section>
            <button
              type="button"
              className="v3-customize-toggle"
              aria-expanded={expanded}
              aria-controls="v3-element-customization"
              onClick={() => setExpanded((value) => !value)}
            >
              <ChevronRight aria-hidden="true" />
              Customize this design
            </button>
            {expanded && (
              <div id="v3-element-customization">
                <p>
                  These changes affect only this artwork element. Apply
                  preserves them.
                </p>
                {selected.type === "text" ? (
                  <label>
                    Design text
                    <textarea
                      aria-label="Design text"
                      disabled={!compatible}
                      value={selected.content}
                      onChange={(e) =>
                        result(workflow.customize(selected.id, e.target.value))
                      }
                    />
                  </label>
                ) : selected.type === "image" ? (
                  <>
                    <label>
                      Design photo
                      <input
                        aria-label="Design photo"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                        disabled={!compatible || loading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          const id = selected.id;
                          setLoading(true);
                          setError(null);
                          try {
                            const photo = await uploadV3Image(file);
                            if (!isListingMedia(photo.src))
                              throw Error("Choose a smaller image.");
                            if (alive.current && selection.current === id && useCanvasStore.getState().elements.find(element => element.id === id) === selected)
                              result(workflow.customize(id, photo.src));
                          } catch (e) {
                            if (alive.current) setError(
                              e instanceof Error
                                ? e.message
                                : "Image could not be loaded.",
                            );
                          } finally {
                            if (alive.current) setLoading(false);
                          }
                        }}
                      />
                    </label>
                    {workflow.pending.photos.length > 0 && (
                      <div className="v3-field-photos">
                        {workflow.pending.photos.map((photo) => (
                          <button
                            type="button"
                            key={photo.id}
                            disabled={!compatible}
                            aria-label={`Use ${photo.name} for this frame`}
                            onClick={() =>
                              result(workflow.customize(selected.id, photo.src))
                            }
                          >
                            <img
                              src={photo.src}
                              alt={photo.name}
                              width="90"
                              height="65"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
                {!binding && (
                  <p>Choose a linked field above to reconnect this element.</p>
                )}
              </div>
            )}
          </section>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
