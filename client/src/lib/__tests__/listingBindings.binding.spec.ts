/**
 * US-PROP-004 — element binding types on the template contract.
 * Real stores (no mocks of the unit); spies only prove "no store write".
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import {
  applySlotFormat,
  detachBinding,
  migrateElementBinding,
  reconnectBinding,
} from '../listingBindings';
import { captureCanvasData, restoreCanvasData } from '../canvasState';
import { useCanvasStore } from '../../hooks/useCanvasStore';
import { usePropertyStore } from '../../hooks/usePropertyStore';
import { useAgentStore } from '../../hooks/useAgentStore';
import type { BindingDescriptor, CanvasElement } from '../canvasTypes';

const COMPOUND: BindingDescriptor = { type: 'compound', parts: ['beds', 'baths', 'sqft'] };

const text = (id: string, slot: string | undefined, content: string, extra: Record<string, unknown> = {}) =>
  ({
    id, type: 'text', content, slot, x: 0, y: 0, width: 100, height: 20, rotation: 0,
    opacity: 1, locked: false, visible: true, zIndex: 1, name: id, ...extra,
  }) as unknown as CanvasElement;

const shape = (id: string, extra: Record<string, unknown> = {}) =>
  ({ id, type: 'shape', fill: '#fde68a', x: 0, y: 0, width: 10, height: 10, rotation: 0,
     opacity: 1, locked: false, visible: true, zIndex: 1, name: id, ...extra }) as unknown as CanvasElement;

const image = (id: string, extra: Record<string, unknown> = {}) =>
  ({ id, type: 'image', src: 'data:image/png;base64,x', x: 0, y: 0, width: 10, height: 10, rotation: 0,
     opacity: 1, locked: false, visible: true, zIndex: 1, name: id, ...extra }) as unknown as CanvasElement;

const bindingOf = (el: unknown) => (el as { binding?: BindingDescriptor }).binding;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const byId = (id: string) => useCanvasStore.getState().elements.find((e) => e.id === id);

let setPropertySpy: ReturnType<typeof vi.spyOn>;
let setAgentSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
  useCanvasStore.setState({ elements: [], history: { past: [], future: [] } });
  usePropertyStore.getState().resetProperty();
  useAgentStore.getState().resetAgent();
  setPropertySpy = vi.spyOn(usePropertyStore.getState(), 'setProperty');
  setAgentSpy = vi.spyOn(useAgentStore.getState(), 'setAgent');
});

// AC2 Contract: slot -> binding per the design table; location: migrateElementBinding() return value
describe('migrateElementBinding — AC2', () => {
  it('property.price -> field/price', () => {
    expect(bindingOf(migrateElementBinding(text('p', 'property.price', '[Price]')))).toEqual({ type: 'field', key: 'price' });
  });

  it.each(['property.specs', 'property.facts'])('%s -> compound beds/baths/sqft', (slot) => {
    expect(bindingOf(migrateElementBinding(text('s', slot, '[Specs]')))).toEqual(COMPOUND);
  });

  it('agent.rera -> field/agentLicense', () => {
    expect(bindingOf(migrateElementBinding(text('r', 'agent.rera', 'RERA [x]')))).toEqual({ type: 'field', key: 'agentLicense' });
  });

  it('text with no slot -> independent', () => {
    expect(bindingOf(migrateElementBinding(text('t', undefined, 'Hello')))).toEqual({ type: 'independent' });
  });

  it.each(['agent.cta', 'openHouse.date'])('text with unmapped slot %s -> independent', (slot) => {
    expect(bindingOf(migrateElementBinding(text('t', slot, 'x')))).toEqual({ type: 'independent' });
  });

  it('non-text elements come back unchanged, even when slot-tagged (no binding added)', () => {
    const s = shape('s', { slot: 'property.price' });
    const i = image('i', { slot: 'property.price' });
    const outS = migrateElementBinding(clone(s));
    const outI = migrateElementBinding(clone(i));
    expect(outS).toEqual(s);
    expect(outI).toEqual(i);
    expect(bindingOf(outS)).toBeUndefined();
    expect(bindingOf(outI)).toBeUndefined();
  });

  it('an already-bound element is left alone (independent price stays independent)', () => {
    const el = text('p', 'property.price', '[Price]', { binding: { type: 'independent' } });
    expect(bindingOf(migrateElementBinding(el))).toEqual({ type: 'independent' });
    const fieldEl = text('a', undefined, 'x', { binding: { type: 'field', key: 'address' } });
    expect(bindingOf(migrateElementBinding(fieldEl))).toEqual({ type: 'field', key: 'address' });
  });

  it('never mutates its input and never changes content, slot or slotFormat', () => {
    const el = text('p', 'property.price', 'Price: [x]', { slotFormat: 'Price: {}' });
    const snapshot = clone(el);
    Object.freeze(el);
    const out = migrateElementBinding(el) as unknown as Record<string, unknown>;
    expect(el).toEqual(snapshot);
    expect(bindingOf(el)).toBeUndefined();
    expect(out.content).toBe('Price: [x]');
    expect(out.slot).toBe('property.price');
    expect(out.slotFormat).toBe('Price: {}');
  });
});

// AC3 Contract
describe('detachBinding / reconnectBinding — AC3', () => {
  it('detachBinding -> independent, same content, nothing written to any store', () => {
    const el = text('p', 'property.price', '₹9 Cr', { binding: { type: 'field', key: 'price' } });
    useCanvasStore.setState({ elements: [el] });
    const out = detachBinding(el) as unknown as Record<string, unknown>;
    expect(out.binding).toEqual({ type: 'independent' });
    expect(out.content).toBe('₹9 Cr');
    expect(setPropertySpy).not.toHaveBeenCalled();
    expect(setAgentSpy).not.toHaveBeenCalled();
    expect(useCanvasStore.getState().elements).toEqual([el]);
    expect(bindingOf(el)).toEqual({ type: 'field', key: 'price' }); // input not mutated
  });

  it('reconnectBinding(price) pulls the store value into content, no slotFormat', () => {
    usePropertyStore.setState({ property: { ...usePropertyStore.getState().property, price: '₹2.5 Cr' } });
    setPropertySpy = vi.spyOn(usePropertyStore.getState(), 'setProperty');
    const el = text('p', 'property.price', 'whatever the user typed', { binding: { type: 'independent' } });
    const snapshot = clone(el);
    const out = reconnectBinding(el, 'price') as unknown as Record<string, unknown>;
    expect(out.binding).toEqual({ type: 'field', key: 'price' });
    expect(out.content).toBe('₹2.5 Cr');
    expect(out.content).toBe(applySlotFormat(undefined, '₹2.5 Cr'));
    expect(setPropertySpy).not.toHaveBeenCalled();
    expect(setAgentSpy).not.toHaveBeenCalled();
    expect(usePropertyStore.getState().property.price).toBe('₹2.5 Cr');
    expect(el).toEqual(snapshot);
  });

  it('reconnectBinding(price) applies slotFormat', () => {
    usePropertyStore.setState({ property: { ...usePropertyStore.getState().property, price: '₹2.5 Cr' } });
    setPropertySpy = vi.spyOn(usePropertyStore.getState(), 'setProperty');
    const el = text('p', 'property.price', 'x', { slotFormat: 'Price: {}', binding: { type: 'independent' } });
    const out = reconnectBinding(el, 'price') as unknown as Record<string, unknown>;
    expect(out.content).toBe('Price: ₹2.5 Cr');
    expect(out.content).toBe(applySlotFormat(el.slotFormat as string | undefined, '₹2.5 Cr'));
    expect(setPropertySpy).not.toHaveBeenCalled();
  });

  it('reconnectBinding(agentLicense) reads the agent store through slotFormat', () => {
    useAgentStore.setState({ agent: { ...useAgentStore.getState().agent, license: 'A123' } });
    setAgentSpy = vi.spyOn(useAgentStore.getState(), 'setAgent');
    const el = text('r', 'agent.rera', 'x', { slotFormat: 'RERA {}', binding: { type: 'independent' } });
    const out = reconnectBinding(el, 'agentLicense') as unknown as Record<string, unknown>;
    expect(out.binding).toEqual({ type: 'field', key: 'agentLicense' });
    expect(out.content).toBe('RERA A123');
    expect(setAgentSpy).not.toHaveBeenCalled();
    expect(setPropertySpy).not.toHaveBeenCalled();
  });
});

// AC2 (load path) + AC4 (round trip)
describe('restoreCanvasData / captureCanvasData — AC2, AC4', () => {
  it('legacy canvasData gets bindings on load; content/slot/slotFormat untouched; shapes get none', () => {
    const legacy = {
      elements: [
        text('price', 'property.price', 'Price: [x]', { slotFormat: 'Price: {}' }),
        text('free', undefined, 'Hello'),
        shape('box'),
      ],
      canvasWidth: 800, canvasHeight: 600,
    };
    expect(restoreCanvasData(clone(legacy))).toBe(true);
    const price = byId('price') as unknown as Record<string, unknown>;
    expect(price.binding).toEqual({ type: 'field', key: 'price' });
    expect(price.content).toBe('Price: [x]');
    expect(price.slot).toBe('property.price');
    expect(price.slotFormat).toBe('Price: {}');
    expect(bindingOf(byId('free'))).toEqual({ type: 'independent' });
    expect(bindingOf(byId('box'))).toBeUndefined();
  });

  it('a field/price binding survives capture -> JSON -> restore', () => {
    useCanvasStore.setState({
      elements: [text('price', 'property.price', '₹1 Cr', { binding: { type: 'field', key: 'price' } })],
    });
    const saved = JSON.parse(JSON.stringify(captureCanvasData()));
    useCanvasStore.setState({ elements: [] });
    expect(restoreCanvasData(saved)).toBe(true);
    expect(bindingOf(byId('price'))).toEqual({ type: 'field', key: 'price' });
  });

  it('an independent binding on a slot-tagged price survives the round trip (migration does not overwrite)', () => {
    useCanvasStore.setState({
      elements: [text('price', 'property.price', 'mine', { binding: { type: 'independent' } })],
    });
    const saved = JSON.parse(JSON.stringify(captureCanvasData()));
    expect(restoreCanvasData(saved)).toBe(true);
    expect(bindingOf(byId('price'))).toEqual({ type: 'independent' });
  });
});
