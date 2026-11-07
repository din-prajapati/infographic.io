import type { CanvasElement } from './canvasTypes';
import { useCanvasStore } from '../hooks/useCanvasStore';

export type V3LayerMove = 'forward' | 'backward' | 'front' | 'back';

/** Reverse the stable canvas paint order; later document entries win equal stacking indices. */
export function orderedV3Layers(elements: readonly CanvasElement[]): CanvasElement[] {
  return elements.map((element, index) => ({ element, index })).sort((a, b) => {
    const az = Number.isFinite(a.element.zIndex) ? a.element.zIndex : 0;
    const bz = Number.isFinite(b.element.zIndex) ? b.element.zIndex : 0;
    return az - bz || a.index - b.index;
  }).map(entry => entry.element).reverse();
}

function validStack(elements: readonly CanvasElement[]): boolean {
  return new Set(elements.map(element => element.id)).size === elements.length && elements.every(element => Number.isFinite(element.zIndex));
}

function commitOrder(topFirst: CanvasElement[]): boolean {
  const state = useCanvasStore.getState(), previous = orderedV3Layers(state.elements);
  if (previous.length !== topFirst.length || previous.every((element, index) => element.id === topFirst[index].id)) return false;
  const ranks = new Map(topFirst.map((element, index) => [element.id, topFirst.length - index]));
  state.pushToHistory(state.elements);
  useCanvasStore.setState({ elements: state.elements.map(element => element.zIndex === ranks.get(element.id) ? element : { ...element, zIndex: ranks.get(element.id)! }) });
  return true;
}

export function reorderV3Layer(id: string, anchorId: string, placement: 'before' | 'after'): boolean {
  const state = useCanvasStore.getState();
  if (id === anchorId || !['before', 'after'].includes(placement) || !validStack(state.elements)) return false;
  const target = state.elements.find(element => element.id === id);
  if (!target || target.locked || !state.elements.some(element => element.id === anchorId)) return false;
  const order = orderedV3Layers(state.elements).filter(element => element.id !== id);
  const index = order.findIndex(element => element.id === anchorId);
  order.splice(index + (placement === 'after' ? 1 : 0), 0, target);
  return commitOrder(order);
}

export function canMoveV3Layer(id: string, direction: V3LayerMove): boolean {
  const { elements } = useCanvasStore.getState();
  if (!validStack(elements) || !['forward', 'backward', 'front', 'back'].includes(direction)) return false;
  const order = orderedV3Layers(elements), index = order.findIndex(element => element.id === id);
  if (index < 0 || order[index].locked) return false;
  return direction === 'forward' || direction === 'front' ? index > 0 : index < order.length - 1;
}

export function moveV3Layer(id: string, direction: V3LayerMove): boolean {
  if (!canMoveV3Layer(id, direction)) return false;
  const order = orderedV3Layers(useCanvasStore.getState().elements), index = order.findIndex(element => element.id === id);
  const destination = direction === 'front' ? 0 : direction === 'back' ? order.length - 1 : index + (direction === 'forward' ? -1 : 1);
  return reorderV3Layer(id, order[destination].id, destination < index ? 'before' : 'after');
}

export function setV3LayerVisibility(id: string, visible: boolean): boolean {
  const state = useCanvasStore.getState(), target = state.elements.find(element => element.id === id);
  if (!target || target.locked || typeof visible !== 'boolean' || target.visible === visible) return false;
  state.pushToHistory(state.elements);
  useCanvasStore.setState({ elements: state.elements.map(element => element.id === id ? { ...element, visible } : element) });
  return true;
}

export function setV3LayerLocked(id: string, locked: boolean): boolean {
  const state = useCanvasStore.getState(), target = state.elements.find(element => element.id === id);
  if (!target || typeof locked !== 'boolean' || target.locked === locked) return false;
  state.pushToHistory(state.elements);
  useCanvasStore.setState({ elements: state.elements.map(element => element.id === id ? { ...element, locked } : element) });
  return true;
}
