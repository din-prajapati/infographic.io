import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
  notifyManager,
} from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyListing } from "@shared/listingWorkflow";
import { V3ListingPanel } from "../V3ListingPanel";
const fixtures = vi.hoisted(() => ({
  pending: null as unknown,
  setPending: vi.fn(),
  selectListing: vi.fn(),
  list: vi.fn(),
  getProfile: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  saveProfile: vi.fn(),
  pendingChanges: 0,
  applyToDesign: vi.fn(() => ({ ok: true })),
  undoLastApply: vi.fn(() => ({ ok: true })),
  lastApplyAvailable: false,
}));
vi.mock("../../../../hooks/useV3ListingWorkflow", () => ({
  useV3ListingWorkflow: () => ({
    pending: fixtures.pending,
    selectedListingId: null,
    selectedListingVersion: null,
    setPending: fixtures.setPending,
    selectListing: fixtures.selectListing,
    setSelectedListingIdentity: vi.fn(),
    pendingChanges: fixtures.pendingChanges,
    overrides: {},
    skipped: [],
    applyToDesign: fixtures.applyToDesign,
    undoLastApply: fixtures.undoLastApply,
    lastApplyAvailable: fixtures.lastApplyAvailable,
  }),
}));
vi.mock("../../../../lib/listingApi", () => ({
  propertiesApi: { list: fixtures.list, save: fixtures.create },
  listingProfilesApi: { get: fixtures.getProfile, save: fixtures.saveProfile },
}));
let host: HTMLDivElement, root: Root, query: QueryClient;
const nav = vi.fn();
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  notifyManager.setNotifyFunction((callback) => act(callback));
  fixtures.pending = createEmptyListing();
  fixtures.pendingChanges = 0;
  fixtures.lastApplyAvailable = false;
  fixtures.list.mockResolvedValue([]);
  fixtures.getProfile.mockResolvedValue({
    version: 0,
    record: {
      agent: createEmptyListing().agent,
      brand: createEmptyListing().brand,
    },
  });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  act(() => root.unmount());
  query.clear();
  host.remove();
  notifyManager.setNotifyFunction((callback) => callback());
  vi.unstubAllGlobals();
});
async function render(
  section: "Listing" | "Property" | "Agent" | "Brand" | "Media" = "Listing",
) {
  await act(async () =>
    root.render(
      <QueryClientProvider client={query}>
        <V3ListingPanel
          section={section}
          userId="user-a"
          onNavigate={nav}
          onClose={() => {}}
        />
      </QueryClientProvider>,
    ),
  );
}
async function click(text: string) {
  const b = [...host.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!b) throw Error(`Missing ${text}`);
  await act(async () => {
    b.click();
    await new Promise((resolve) => setTimeout(resolve, 15));
  });
}
async function clickResult(address: string) {
  const b = [...host.querySelectorAll("button.v3-lp-result")].find(
    (b) => b.querySelector("strong")?.textContent?.trim() === address,
  ) as HTMLButtonElement | undefined;
  if (!b) throw Error(`Missing result ${address}`);
  await act(async () => {
    b.click();
    await new Promise((resolve) => setTimeout(resolve, 15));
  });
}
async function change(label: string, value: string) {
  const input = host.querySelector(`[aria-label="${label}"]`) as
    HTMLInputElement | HTMLTextAreaElement;
  if (!input) throw Error(`Missing field ${label}`);
  const prototype =
    input.tagName === "TEXTAREA"
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(
      input,
      value,
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
describe("Listing panel contracts", () => {
  // Contract: the initial Listing source screen presents all three real intake choices and explicitly unavailable provider lookup.
  it("offers reviewed paste, saved catalogue and manual entry", async () => {
    await render();
    expect(host.textContent).toContain("Paste text");
    expect(host.textContent).toContain("Saved properties");
    expect(host.textContent).toContain("Enter manually");
    await click("Listing ID");
    expect(host.textContent).toContain("Country providers are not connected");
  });
  // Contract: the approved welcome (editor.html) opens on Listing ID with the restored copy hierarchy, and Find listing searches only the real saved catalogue.
  it("opens the approved welcome on Listing ID and searches the saved catalogue", async () => {
    const record = createEmptyListing();
    record.property.address = "9 Harbour Street";
    fixtures.list.mockResolvedValue([{ id: "cuid-9", version: 1, record }]);
    await render();
    expect(host.querySelector(".v3-lp-head h2")?.textContent).toBe("Load a listing");
    expect(host.querySelector(".v3-lp-eyebrow")?.textContent).toBe("Start with the facts");
    expect(host.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("Listing ID");
    expect(fixtures.list).not.toHaveBeenCalled();
    await change("Search by address or listing ID", "harbour");
    await act(async () => {
      host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await vi.waitFor(() => expect(fixtures.list).toHaveBeenLastCalledWith("harbour"));
    await vi.waitFor(() => expect(host.textContent).toContain("1 property"));
    await clickResult("9 Harbour Street");
    expect(fixtures.selectListing).toHaveBeenCalledWith(record, "cuid-9", 1);
  });
  // Contract: the overview restores Media first, the unified Property card, Agent/Brand sections and a pinned Apply footer wired to the real Apply.
  it("renders the approved overview with a pinned Apply footer", async () => {
    const record = createEmptyListing();
    Object.assign(record.property, { address: "4 Lake Road", beds: "3", baths: "2", area: "1850", amount: "12500000", features: ["Garden", "Pool", "Gym", "Lift"] });
    record.agent.name = "Arjun Shah";
    record.brand.name = "Aster Realty";
    fixtures.pending = record;
    fixtures.pendingChanges = 2;
    await render();
    const children = [...host.querySelectorAll(".v3-lp-overview > *")];
    const mediaIndex = children.findIndex((node) => node.classList.contains("v3-lp-section-row"));
    const propertyIndex = children.findIndex((node) => node.classList.contains("v3-property-card"));
    expect(mediaIndex).toBe(0);
    expect(propertyIndex).toBeGreaterThan(mediaIndex);
    const card = children[propertyIndex];
    expect(card.querySelector(".v3-lp-card-label")?.textContent).toBe("Property information");
    expect([...card.querySelectorAll(".v3-lp-specs small")].map((n) => n.textContent)).toEqual(["Bedrooms", "Bathrooms", "Floor area"]);
    expect([...card.querySelectorAll(".v3-lp-chip")].map((n) => n.textContent)).toEqual(["Garden", "Pool", "Gym", "+1 more"]);
    expect([...host.querySelectorAll(".v3-lp-section-label")].map((n) => n.textContent)).toEqual(["Agent", "Brand assets"]);
    const footer = host.querySelector(".v3-lp-apply")!;
    expect(footer.parentElement?.classList.contains("v3-listing-panel")).toBe(true);
    expect(footer.textContent).toContain("2 pending changes");
    await click("Apply to design");
    expect(fixtures.applyToDesign).toHaveBeenCalledTimes(1);
  });
  it('places guarded Undo last apply below Apply and reports its failures', async () => {
    const record = createEmptyListing(); record.property.address = '4 Lake Road'; fixtures.pending = record;
    await render();
    const buttons = [...host.querySelectorAll<HTMLButtonElement>('.v3-lp-apply button')];
    expect(buttons.map(button => button.textContent?.trim())).toEqual(['Apply to design', 'Undo last apply']);
    expect(buttons[1].disabled).toBe(true);
    fixtures.lastApplyAvailable = true;
    fixtures.undoLastApply.mockReturnValueOnce({ ok: false, error: 'Artwork changed; Undo is unavailable.' } as { ok: boolean });
    await render(); await click('Undo last apply');
    expect(fixtures.undoLastApply).toHaveBeenCalledTimes(1);
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('Artwork changed; Undo is unavailable.');
  });
  it('opens Property directly and routes the overview Property card to Details', async () => {
    await render('Property');
    expect(host.querySelector('[aria-label="Address"]')).toBeTruthy();
    const record = createEmptyListing(); record.property.address = '4 Lake Road'; fixtures.pending = record;
    await act(async () => root.unmount()); root = createRoot(host);
    await render();
    await act(async () => host.querySelector<HTMLButtonElement>('.v3-property-card')!.click());
    expect(nav).toHaveBeenCalledWith('Property');
  });
  it('saves only the Property draft while retaining newer pending Agent information', async () => {
    const record = createEmptyListing(); record.property.address = 'Original address'; fixtures.pending = record;
    await render('Property'); await change('Address', 'Draft address');
    const latest = structuredClone(record); latest.agent.name = 'Newer Agent'; fixtures.pending = latest;
    await render('Property');
    const savedRecord = structuredClone(record); savedRecord.property.address = 'Draft address';
    fixtures.create.mockResolvedValueOnce({ id: 'saved-property', version: 1, record: savedRecord });
    await click('Save property');
    expect(fixtures.create.mock.calls[0][0]).toMatchObject({ property: { address: 'Draft address' }, agent: { name: 'Newer Agent' } });
    expect(fixtures.setPending).toHaveBeenCalledWith(expect.objectContaining({ property: savedRecord.property, agent: latest.agent }));
  });
  // Contract: Use example fills only the composer with fictional sample text, focuses it, and never extracts, saves or changes pending state.
  it("inserts sample text into the composer only", async () => {
    await render();
    await click("Paste text");
    await click("Use example");
    await new Promise((resolve) => setTimeout(resolve, 30));
    const composer = host.querySelector('[aria-label="Property text"]') as HTMLTextAreaElement;
    expect(composer.value.startsWith("3 BHK, 2 bathrooms, 80 Lakh, 1500 sq ft")).toBe(true);
    expect(document.activeElement).toBe(composer);
    expect(host.textContent).toContain("Sample text");
    expect(host.querySelectorAll("blockquote")).toHaveLength(0);
    expect(fixtures.setPending).toHaveBeenCalledTimes(0);
    expect(fixtures.create).toHaveBeenCalledTimes(0);
  });
  // Contract: different composer text is only replaced after an explicit choice, and replacing invalidates the old review.
  it("protects existing composer text before inserting the example", async () => {
    await render();
    await click("Paste text");
    await change("Property text", "Address: Mine Street");
    await click("Extract & review");
    expect(host.querySelector("blockquote")?.textContent).toBe("Address: Mine Street");
    await click("Back");
    await click("Use example");
    expect((host.querySelector('[aria-label="Property text"]') as HTMLTextAreaElement).value).toBe("Address: Mine Street");
    await click("Keep my text");
    expect((host.querySelector('[aria-label="Property text"]') as HTMLTextAreaElement).value).toBe("Address: Mine Street");
    await click("Use example");
    await click("Replace with sample");
    expect((host.querySelector('[aria-label="Property text"]') as HTMLTextAreaElement).value).toContain("Satellite Road, Ahmedabad");
    expect(host.querySelectorAll("blockquote")).toHaveLength(0);
    expect(fixtures.setPending).toHaveBeenCalledTimes(0);
  });
  // Contract: the three source tabs expose complete tab semantics with roving focus and arrow/Home/End navigation.
  it("supports keyboard tab navigation with associated panel", async () => {
    await render();
    const tabs = () => [...host.querySelectorAll('[role="tab"]')] as HTMLButtonElement[];
    expect(tabs().map((tab) => tab.textContent)).toEqual(["Listing ID", "Paste text", "Saved properties"]);
    const panel = host.querySelector('[role="tabpanel"]')!;
    expect(tabs().every((tab) => tab.getAttribute("aria-controls") === panel.id)).toBe(true);
    expect(panel.getAttribute("aria-labelledby")).toBe(tabs()[0].id);
    expect(tabs().map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
    const key = async (target: HTMLElement, value: string) =>
      act(async () => { target.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true })); });
    tabs()[0].focus();
    await key(tabs()[0], "ArrowRight");
    expect(tabs()[1].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs()[1]);
    expect(host.querySelector('[role="tabpanel"]')!.getAttribute("aria-labelledby")).toBe(tabs()[1].id);
    await key(tabs()[1], "End");
    expect(tabs()[2].getAttribute("aria-selected")).toBe("true");
    await key(tabs()[2], "ArrowRight");
    expect(tabs()[0].getAttribute("aria-selected")).toBe("true");
    await key(tabs()[0], "ArrowLeft");
    expect(tabs()[2].getAttribute("aria-selected")).toBe("true");
  });
  // Contract: bounded fields show live recommended-length counters; longer existing values stay complete and are saved untruncated.
  it("shows counters and preserves longer existing values", async () => {
    const long = "A".repeat(130);
    const record = createEmptyListing();
    Object.assign(record.property, { address: "1 Long Road", headline: long });
    fixtures.pending = record;
    fixtures.create.mockResolvedValue({ id: "saved1", version: 1, record });
    await render();
    await act(async () => (host.querySelector(".v3-property-card") as HTMLButtonElement).click());
    expect(nav).toHaveBeenCalledWith("Property"); await render("Property");
    const headline = host.querySelector('[aria-label="Marketing headline"]') as HTMLTextAreaElement;
    expect(headline.tagName).toBe("TEXTAREA");
    expect(headline.value).toBe(long);
    expect(headline.maxLength).toBe(-1);
    const counter = host.querySelector("#property-headline-count")!;
    expect(counter.textContent).toContain("130/105");
    expect(counter.textContent).toContain("saved in full");
    expect(headline.getAttribute("aria-describedby")).toContain("property-headline-count");
    expect(host.querySelector("#property-address-count")?.textContent).toBe("11/85");
    await change("Address", "1 Long Road, Ahmedabad");
    expect(host.querySelector("#property-address-count")?.textContent).toBe("22/85");
    expect([...host.querySelectorAll(".v3-lp-form-section")].map((n) => n.textContent)).toEqual([
      "Listing identity", "Pricing", "Location", "Specifications", "Description and highlights",
    ]);
    await click("Save property");
    expect(fixtures.create.mock.calls[0][0].property.headline).toBe(long);
  });
  // Contract: highlights accept natural comma typing without the separator being stripped mid-entry.
  it("keeps comma-separated highlights while typing", async () => {
    const record = createEmptyListing();
    record.property.address = "2 Comma Lane";
    fixtures.pending = record;
    await render();
    await act(async () => (host.querySelector(".v3-property-card") as HTMLButtonElement).click());
    expect(nav).toHaveBeenCalledWith("Property"); await render("Property");
    await change("Features", "Garden, ");
    expect((host.querySelector('[aria-label="Features"]') as HTMLTextAreaElement).value).toBe("Garden, ");
    await change("Features", "Garden, Pool");
    expect(host.textContent).toContain("2 highlights");
  });
  // Contract: Agent fields keep their counters (empty values read 0/limit); registration is a visible field (mockup, 2026-11-14).
  it("renders agent contact counters and a visible registration field", async () => {
    await render("Agent");
    await vi.waitFor(() => expect(host.querySelector('[aria-label="Full name"]')).toBeTruthy());
    expect(host.querySelector("#agent-name-count")?.textContent).toBe("0/40");
    expect(host.querySelector("#agent-phone-count")?.textContent).toBe("0/28");
    expect(host.querySelector("#agent-agency-count")?.textContent).toBe("0/45");
    expect(host.querySelector("#agent-license-count")?.textContent).toBe("0/75");
    await change("Full name", "Morgan");
    expect(host.querySelector("#agent-name-count")?.textContent).toBe("6/40");
  });
  // Contract: successful catalogue loading exposes the exact result count and preserves the authoritative selected record.
  it("selects a saved property into pending state", async () => {
    const record = createEmptyListing();
    record.property.address = "123 River Road";
    fixtures.list.mockResolvedValue([{ id: "listing-1", version: 2, record }]);
    await render();
    await click("Saved properties");
    await vi.waitFor(() => expect(host.textContent).toContain("1 property"));
    await clickResult("123 River Road");
    expect(fixtures.selectListing).toHaveBeenCalledWith(record, "listing-1", 2);
  });
  // Contract: a catalogue rejection leaves a visible retry action rather than successful empty data.
  it("shows a retry on failed saved property loading", async () => {
    fixtures.list.mockRejectedValue(Error("Network unavailable"));
    await render();
    await click("Saved properties");
    await vi.waitFor(() =>
      expect(host.textContent).toContain("Network unavailable"),
    );
    expect(
      [...host.querySelectorAll("button")].map((b) => b.textContent),
    ).toContain("Retry saved properties");
  });
  // Contract: opening Agent uses standalone editable labeled profile fields and explicit save/cancel.
  it("provides editable identity fields with explicit actions", async () => {
    await render("Agent");
    await vi.waitFor(() =>
      expect(host.querySelector('input[aria-label="Full name"]')).toBeTruthy(),
    );
    expect(host.textContent).toContain("Save changes");
    expect(host.textContent).toContain("Cancel");
  });
  // Contract (approved mockup "Edit agent"): one column in the order Full name, Agency, Phone, Email, Registration / licence;
  // licence visible (not collapsed); no saved-agent dropdown (one profile per user); Save changes above Cancel.
  it("lays out the agent form like the approved mockup", async () => {
    await render("Agent");
    await vi.waitFor(() => expect(host.querySelector('input[aria-label="Full name"]')).toBeTruthy());
    const order = [...host.querySelectorAll<HTMLInputElement>("input[id^=agent-]")].map((input) => input.getAttribute("aria-label"));
    expect(order).toEqual(["Full name", "Agency", "Phone", "Email", "Registration / licence"]);
    expect(host.querySelector("#agent-license")?.closest("details")).toBeNull();
    expect(host.querySelector("select")).toBeNull();
    const actions = [...host.querySelectorAll(".v3-lp-actions button")].map((button) => button.textContent);
    expect(actions).toEqual(["Save changes", "Cancel"]);
    expect(host.querySelector('input[aria-label="Upload agent photo"]')).toBeTruthy();
  });
  // Contract: case-insensitive catalogue search matches property name and ID; clear restores the exact full result count.
  it("filters saved properties and clears no-results search", async () => {
    const first = createEmptyListing();
    first.property.address = "River Road";
    first.property.name = "Cedar House";
    const second = createEmptyListing();
    second.property.address = "Lake Lane";
    fixtures.list.mockResolvedValue([
      { id: "MLS-123", version: 1, record: first },
      { id: "MLS-456", version: 1, record: second },
    ]);
    await render();
    await click("Saved properties");
    await vi.waitFor(() => expect(host.textContent).toContain("2 properties"));
    await change("Search saved properties", "cedar");
    await vi.waitFor(() => expect(host.textContent).toContain("1 property"));
    expect(fixtures.list).toHaveBeenLastCalledWith("cedar");
    expect(host.textContent).toContain("River Road");
    await change("Search saved properties", "mls-456");
    await vi.waitFor(() => expect(host.textContent).toContain("Lake Lane"));
    await change("Search saved properties", "unmatched");
    await vi.waitFor(() => expect(host.textContent).toContain("0 properties"));
    expect(host.textContent).toContain("No saved properties match.");
    await click("Clear search");
    await vi.waitFor(() => expect(host.textContent).toContain("2 properties"));
  });
  // Contract: contact suggestions start unselected; confirmed property facts retain inspectable source evidence.
  it("imports only explicitly selected reviewed facts", async () => {
    await render();
    await click("Paste text");
    await change(
      "Property text",
      "Address: 55 Garden Avenue\nBeds: 3\nAgent: Someone Else",
    );
    await click("Extract & review");
    expect(host.querySelector("blockquote")?.textContent).toBe(
      "Address: 55 Garden Avenue",
    );
    const contact = [...host.querySelectorAll("label")].find((label) =>
      label.textContent?.includes("Contact suggestion"),
    )!;
    expect(contact.querySelector("input")?.checked).toBe(false);
    await click("Confirm selected facts");
    expect(fixtures.setPending.mock.calls.at(-1)?.[0]).toMatchObject({
      property: { address: "55 Garden Avenue", beds: "3" },
      agent: { name: "" },
    });
  });
  it('opens a separate focused review screen and Back preserves the focused composer source', async () => {
    await render(); await click('Paste text'); await change('Property text', 'Address: River Road\nPrice: INR 8000000');
    const scroll = host.querySelector<HTMLElement>('.v3-listing-scroll')!; scroll.scrollTop = 200;
    await click('Extract & review');
    const heading = host.querySelector('h2')!;
    expect(heading.textContent).toBe('Review detected facts'); expect(document.activeElement).toBe(heading);
    expect(host.querySelector('[data-screen="review"]')).not.toBeNull(); expect(scroll.scrollTop).toBe(0);
    expect(host.querySelector('[aria-label="Property text"]')).toBeNull(); expect(host.querySelector('[role="tablist"]')).toBeNull();
    expect([...host.querySelectorAll('button')].some(button => button.textContent === 'Enter manually')).toBe(false);
    const original = [...host.querySelectorAll('details')].find(details => details.querySelector('summary')?.textContent === 'Original source text')!;
    expect(original.open).toBe(false); expect(original.querySelector('pre')?.textContent).toBe('Address: River Road\nPrice: INR 8000000');
    expect(host.querySelector('label details')).toBeNull(); expect(host.querySelector('.v3-listing-fact select')).toBeNull();
    await click('Back');
    const composer = host.querySelector<HTMLTextAreaElement>('[aria-label="Property text"]')!;
    expect(composer.value).toBe('Address: River Road\nPrice: INR 8000000'); expect(document.activeElement).toBe(composer);
    expect(host.querySelector('.v3-listing-review')).toBeNull(); expect(fixtures.setPending).not.toHaveBeenCalled();
  });
  it('shows the current baseline and keeps populated property facts unchecked until explicitly selected', async () => {
    const record = createEmptyListing(); record.property.address = 'Existing Road'; record.property.amount = '5000000'; fixtures.pending = record;
    await render(); await click('← Search'); await click('Paste text'); await change('Property text', 'Address: New Road\nPrice: INR 8000000\nBeds: 3'); await click('Extract & review');
    const cards = [...host.querySelectorAll<HTMLElement>('.v3-listing-fact')];
    const address = cards.find(card => card.querySelector('label')?.textContent?.includes('Address: New Road'))!;
    expect(address.textContent).toContain('Current: Existing Road'); expect(address.querySelector<HTMLInputElement>('input')?.checked).toBe(false);
    const price = cards.find(card => card.querySelector('label')?.textContent?.includes('Price:'))!;
    expect(price.textContent).toContain('Current: ₹50 Lakh'); expect(price.querySelector<HTMLInputElement>('input')?.checked).toBe(false);
    const beds = cards.find(card => card.querySelector('label')?.textContent?.includes('Bedrooms: 3'))!;
    expect(beds.querySelector<HTMLInputElement>('input')?.checked).toBe(true);
    await click('Confirm selected facts');
    expect(fixtures.setPending.mock.calls.at(-1)?.[0]).toMatchObject({ property: { address: 'Existing Road', amount: '5000000', beds: '3' } });
    expect(fixtures.applyToDesign).not.toHaveBeenCalled();
  });
  it('keeps an empty review recoverable through Back without importing anything', async () => {
    await render(); await click('Paste text'); await change('Property text', 'Nothing supported here'); await click('Extract & review');
    expect(host.querySelector('h2')?.textContent).toBe('Review detected facts'); expect(host.textContent).toContain('No supported facts recognized.');
    expect([...host.querySelectorAll('button')].find(button => button.textContent === 'Confirm selected facts')?.disabled).toBe(true);
    await click('Back'); expect(host.querySelector<HTMLTextAreaElement>('[aria-label="Property text"]')?.value).toBe('Nothing supported here'); expect(fixtures.setPending).not.toHaveBeenCalled();
  });
  // Contract: mixed-property paste cannot be confirmed into pending state.
  it("blocks mixed-property import", async () => {
    await render();
    await click("Paste text");
    await change("Property text", "Address: River Road\nAddress: Lake Lane");
    await click("Extract & review");
    expect(host.textContent).toContain("Multiple properties detected");
    const confirm = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === "Confirm selected facts",
    )!;
    expect(confirm.disabled).toBe(true);
    expect(fixtures.setPending).toHaveBeenCalledTimes(0);
  });
  // Contract: a fact edited while review is open cannot be silently overwritten by an older extraction.
  it("requires re-extraction after a reviewed fact changes", async () => {
    await render();
    await click("Paste text");
    await change("Property text", "Address: River Road");
    await click("Extract & review");
    (
      fixtures.pending as ReturnType<typeof createEmptyListing>
    ).property.address = "Newer user edit";
    await click("Confirm selected facts");
    expect(host.textContent).toContain("changed during review");
    expect(fixtures.setPending).toHaveBeenCalledTimes(0);
  });
  // Contract: failed persistence retains the address input for retry.
  it("retains a failed property draft for retry", async () => {
    fixtures.create.mockRejectedValue(Error("Property service unavailable"));
    await render();
    await click("Enter manually");
    await change("Address", "12 Retry Road");
    await click("Save property");
    expect(host.textContent).toContain("Property service unavailable");
    expect(
      (host.querySelector('[aria-label="Address"]') as HTMLInputElement).value,
    ).toBe("12 Retry Road");
    expect(fixtures.create.mock.calls[0][0].property.address).toBe(
      "12 Retry Road",
    );
  });
  // Contract: a failed profile request exposes retry instead of accepting an unversioned save.
  it("retries failed profile loading", async () => {
    fixtures.getProfile.mockRejectedValue(Error("Profile service unavailable"));
    await render("Brand");
    await vi.waitFor(() =>
      expect(host.textContent).toContain("Profile service unavailable"),
    );
    expect(
      [...host.querySelectorAll("button")].some(
        (b) => b.textContent === "Save Brand",
      ),
    ).toBe(false);
    fixtures.getProfile.mockResolvedValue({
      version: 4,
      record: {
        agent: createEmptyListing().agent,
        brand: createEmptyListing().brand,
      },
    });
    await click("Retry profile");
    await vi.waitFor(() =>
      expect(host.querySelector('[aria-label="Brand name"]')).toBeTruthy(),
    );
  }); // Contract: saving Agent uses the fetched version and retains the server Brand even if the design currently uses a different Brand.
  it("saves one profile section without overwriting the other", async () => {
    const record = createEmptyListing();
    record.brand.name = "Saved Brand";
    fixtures.getProfile.mockResolvedValue({
      version: 4,
      record: { agent: record.agent, brand: record.brand },
    });
    fixtures.saveProfile.mockResolvedValue({
      version: 5,
      record: {
        agent: { ...record.agent, name: "New Agent" },
        brand: record.brand,
      },
    });
    await render("Agent");
    await vi.waitFor(() =>
      expect(host.querySelector('[aria-label="Full name"]')).toBeTruthy(),
    );
    await change("Full name", "New Agent");
    await click("Save changes");
    expect(fixtures.saveProfile).toHaveBeenCalledWith(
      { agent: { ...record.agent, name: "New Agent" }, brand: record.brand },
      4,
    );
    expect(fixtures.setPending.mock.calls.at(-1)?.[0]).toMatchObject({
      agent: { name: "New Agent" },
      brand: { name: "" },
    });
  });
  // Contract: removing a gallery image only stages the updated photos; it makes no API request or automatic artwork selection.
  it("removes photos only from the pending record", async () => {
    const record = createEmptyListing();
    record.photos = [
      { id: "photo1", name: "Kitchen", src: "https://example.com/kitchen.jpg" },
    ];
    fixtures.pending = record;
    await render("Media");
    await click("Remove");
    expect(fixtures.setPending).toHaveBeenCalledWith({ ...record, photos: [] });
    expect(fixtures.create).toHaveBeenCalledTimes(0);
  });
  // Contract: an in-flight save disables duplicate submission and property editing until the authoritative response arrives.
  it("prevents duplicate submissions while saving", async () => {
    let finish!: (value: unknown) => void;
    fixtures.create.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render();
    await click("Enter manually");
    await change("Address", "Pending save");
    await click("Save property");
    const save = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === "Saving…",
    )!;
    expect(save.disabled).toBe(true);
    expect(
      host.querySelector('[aria-label="Address"]')?.matches(":disabled"),
    ).toBe(true);
    await act(async () => save.click());
    expect(fixtures.create).toHaveBeenCalledTimes(1);
    expect(fixtures.setPending).toHaveBeenCalledTimes(0);
    await act(async () => {
      finish({
        id: "saved1",
        version: 1,
        record: fixtures.create.mock.calls[0][0],
      });
    });
    expect(fixtures.setPending.mock.calls[0][0].property.address).toBe(
      "Pending save",
    );
  });
  // Contract: editing source text invalidates its old extraction so only a freshly reviewed source can be confirmed.
  it('invalidates extracted facts when the pasted source changes', async () => {
    await render();
    await click("Paste text");
    await change('Property text', 'Address: First property');
    await click('Extract & review');
    expect(host.querySelector('blockquote')?.textContent).toBe('Address: First property');
    await click('Back');
    await change('Property text', 'Address: Second property');
    expect(host.querySelectorAll('blockquote')).toHaveLength(0);
    expect([...host.querySelectorAll('button')].filter(button => button.textContent === 'Confirm selected facts')).toHaveLength(0);
    expect(fixtures.setPending).toHaveBeenCalledTimes(0);
  });});
