import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { V3TemplateFields } from "../V3TemplateFields";
import { useCanvasStore } from "../../../../hooks/useCanvasStore";
import {
  activateV3ListingWorkflow,
  deactivateV3ListingWorkflow,
  useV3ListingStore,
  v3ListingActions,
} from "../../../../hooks/useV3ListingWorkflow";
import {
  createTextElement,
  createImageElement,
} from "../../../../lib/canvasUtils";
let host: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  useCanvasStore.setState({
    elements: [],
    selectedElementIds: [],
    history: { past: [], future: [] },
  });
  activateV3ListingWorkflow();
});
afterEach(() => {
  act(() => root.unmount());
  deactivateV3ListingWorkflow();
  host.remove();
  vi.unstubAllGlobals();
});
async function render() {
  await act(async () => root.render(<V3TemplateFields onClose={() => {}} />));
}
async function button(text: string) {
  const b = [...host.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!b) throw Error(`Missing ${text}`);
  await act(async () => b.click());
}
describe("Template Fields inspector contracts", () => {
  // Contract: without a selected artwork element, the inspector instructs selection at its empty state.
  it("explains an empty selection", async () => {
    await render();
    expect(host.textContent).toContain("Select one text or image element");
  });
  // Contract: selecting a text element exposes friendly text mapping and explicitly disables image fields.
  it("offers compatible friendly fields without altering artwork on mapping", async () => {
    const element = createTextElement(10, 10, "Original");
    useCanvasStore.setState({
      elements: [element],
      selectedElementIds: [element.id],
    });
    await render();
    const select = host.querySelector(
      'select[aria-label="Linked field"]',
    ) as HTMLSelectElement;
    expect(
      [...select.options].find((o) => o.textContent === "Property photo")
        ?.disabled,
    ).toBe(true);
    await act(async () => {
      select.value = "property.price";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(
      useV3ListingStore.getState().snapshot.bindings[element.id].slot,
    ).toBe("property.price");
    expect(
      (useCanvasStore.getState().elements[0] as typeof element).content,
    ).toBe("Original");
  });
  // Contract: specifications render distinct beds/baths/area/unit controls, never a combined canonical text input.
  it("shows structured inputs for specifications", async () => {
    const element = createTextElement();
    useCanvasStore.setState({
      elements: [element],
      selectedElementIds: [element.id],
    });
    v3ListingActions.setBinding(element.id, "property.specs");
    await render();
    for (const label of ["Beds", "Baths", "Area", "Area unit"])
      expect(host.querySelector(`[aria-label="${label}"]`)).toBeTruthy();
  });
  // Contract: customization is collapsed initially and opens only through an explicit action.
  it("starts customization collapsed and exposes expanded state", async () => {
    const element = createTextElement();
    useCanvasStore.setState({
      elements: [element],
      selectedElementIds: [element.id],
    });
    await render();
    const b = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === "Customize this design",
    )!;
    expect(b.getAttribute("aria-expanded")).toBe("false");
    await button("Customize this design");
    expect(b.getAttribute("aria-expanded")).toBe("true");
  });
  // Contract: canonical linked editing stages the Property address without changing applied artwork content.
  it("stages linked text edits until Apply", async () => {
    const element = createTextElement(10, 10, "Original address");
    useCanvasStore.setState({
      elements: [element],
      selectedElementIds: [element.id],
    });
    v3ListingActions.setBinding(element.id, "property.location");
    await render();
    const input = host.querySelector(
      '[aria-label="Linked value"]',
    ) as HTMLTextAreaElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )!.set!.call(input, "Pending address");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(useV3ListingStore.getState().snapshot.pending.property.address).toBe(
      "Pending address",
    );
    expect(
      (useCanvasStore.getState().elements[0] as typeof element).content,
    ).toBe("Original address");
  });
  // Contract: a local customization changes only the element; Apply preserves it and Use linked value explicitly removes its override.
  it("isolates and explicitly resets a design customization", async () => {
    const element = createTextElement(10, 10, "Original");
    useCanvasStore.setState({
      elements: [element],
      selectedElementIds: [element.id],
    });
    v3ListingActions.setBinding(element.id, "property.location");
    await render();
    await button("Customize this design");
    const input = host.querySelector(
      '[aria-label="Design text"]',
    ) as HTMLTextAreaElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )!.set!.call(input, "Custom design");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(useV3ListingStore.getState().snapshot.pending.property.address).toBe(
      "",
    );
    expect(useV3ListingStore.getState().snapshot.overrides[element.id]).toBe(
      "Custom design",
    );
    await act(async () => {
      v3ListingActions.applyToDesign();
    });
    expect(
      (useCanvasStore.getState().elements[0] as typeof element).content,
    ).toBe("Custom design");
    await button("Use linked value");
    expect(
      Object.keys(useV3ListingStore.getState().snapshot.overrides),
    ).toEqual([]);
  });
  // Contract: detach retains current element content and mapping it again restores an explicit linked state.
  it("detaches without deleting artwork and reconnects explicitly", async () => {
    const element = createTextElement(10, 10, "Keep visible");
    useCanvasStore.setState({
      elements: [element],
      selectedElementIds: [element.id],
    });
    v3ListingActions.setBinding(element.id, "property.location");
    await render();
    await button("Detach field");
    expect(
      (useCanvasStore.getState().elements[0] as typeof element).content,
    ).toBe("Keep visible");
    expect(host.textContent).toContain("Independent element");
    const select = host.querySelector(
      '[aria-label="Linked field"]',
    ) as HTMLSelectElement;
    await act(async () => {
      select.value = "property.location";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(useV3ListingStore.getState().snapshot.bindings[element.id]).toEqual({
      slot: "property.location",
    });
  });
});
