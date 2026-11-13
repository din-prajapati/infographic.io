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
}));
vi.mock("../../../../hooks/useV3ListingWorkflow", () => ({
  useV3ListingWorkflow: () => ({
    pending: fixtures.pending,
    selectedListingId: null,
    selectedListingVersion: null,
    setPending: fixtures.setPending,
    selectListing: fixtures.selectListing,
    setSelectedListingIdentity: vi.fn(),
    pendingChanges: false,
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
  section: "Listing" | "Agent" | "Brand" | "Media" = "Listing",
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
  // Contract: successful catalogue loading exposes the exact result count and preserves the authoritative selected record.
  it("selects a saved property into pending state", async () => {
    const record = createEmptyListing();
    record.property.address = "123 River Road";
    fixtures.list.mockResolvedValue([{ id: "listing-1", version: 2, record }]);
    await render();
    await click("Saved properties");
    await vi.waitFor(() => expect(host.textContent).toContain("1 property"));
    await click("123 River Road");
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
      expect(host.querySelector('input[aria-label="Agent name"]')).toBeTruthy(),
    );
    expect(host.textContent).toContain("Save Agent");
    expect(host.textContent).toContain("Cancel");
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
  // Contract: mixed-property paste cannot be confirmed into pending state.
  it("blocks mixed-property import", async () => {
    await render();
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
      expect(host.querySelector('[aria-label="Agent name"]')).toBeTruthy(),
    );
    await change("Agent name", "New Agent");
    await click("Save Agent");
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
    await change('Property text', 'Address: First property');
    await click('Extract & review');
    expect(host.querySelector('blockquote')?.textContent).toBe('Address: First property');
    await change('Property text', 'Address: Second property');
    expect(host.querySelectorAll('blockquote')).toHaveLength(0);
    expect([...host.querySelectorAll('button')].filter(button => button.textContent === 'Confirm selected facts')).toHaveLength(0);
    expect(fixtures.setPending).toHaveBeenCalledTimes(0);
  });});
