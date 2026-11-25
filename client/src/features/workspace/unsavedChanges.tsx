import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { initializeV3NavigationGuard } from '@/lib/v3NavigationGuard';

/**
 * Unsaved-work guard for workspace forms (rev-2 spec §4).
 *
 * Built on the app-wide history guard (v3NavigationGuard), which already intercepts every Wouter push/replace and
 * browser Back/Forward. A dirty form blocks the navigation and the workspace shows a Save / Discard / Stay dialog;
 * the chosen action then continues to the destination through `allowInternal`, so the guard does not fire twice.
 * Tab close and reload use the browser's own `beforeunload` prompt.
 */
type PendingLeave = { kind: 'navigate'; to: string } | { kind: 'action'; run: () => void };
interface GuardForm { dirty: () => boolean; save?: () => Promise<boolean> }
interface UnsavedState {
  forms: Set<GuardForm>;
  pending: PendingLeave | null;
  saving: boolean;
  error: string | null;
}
export const useUnsavedStore = create<UnsavedState>(() => ({ forms: new Set(), pending: null, saving: false, error: null }));

const dirtyForms = () => [...useUnsavedStore.getState().forms].filter(form => form.dirty());
export const hasUnsavedChanges = () => dirtyForms().length > 0;

function relative(url: string) { const value = new URL(url, window.location.href); return value.pathname + value.search + value.hash; }

let navigateImpl: (to: string) => void = to => window.history.pushState(null, '', to);
/** The workspace layout hands in Wouter's navigate so continued navigations re-render routes. */
export function setUnsavedNavigate(navigate: (to: string) => void) { navigateImpl = navigate; }

function proceed(pending: PendingLeave) {
  useUnsavedStore.setState({ pending: null, saving: false, error: null });
  if (pending.kind === 'navigate') initializeV3NavigationGuard().allowInternal(() => navigateImpl(pending.to));
  else initializeV3NavigationGuard().allowInternal(pending.run);
}

/** Run an action (e.g. Sign out) only after the unsaved-work dialog, if a form is dirty. */
export function runAfterUnsavedCheck(run: () => void) {
  if (!hasUnsavedChanges()) { run(); return; }
  useUnsavedStore.setState({ pending: { kind: 'action', run }, error: null });
}

export function stayOnPage() { useUnsavedStore.setState({ pending: null, saving: false, error: null }); }
export function discardAndLeave() {
  const { pending } = useUnsavedStore.getState();
  if (!pending) return;
  // Forms stay mounted until the route changes; mark them clean so the history guard lets this navigation through.
  for (const form of useUnsavedStore.getState().forms) form.dirty = () => false;
  proceed(pending);
}
export async function saveAndLeave() {
  const { pending } = useUnsavedStore.getState();
  if (!pending) return;
  const forms = dirtyForms();
  if (forms.some(form => !form.save)) { useUnsavedStore.setState({ error: 'This page cannot be saved from here. Stay to save it, or discard the changes.' }); return; }
  useUnsavedStore.setState({ saving: true, error: null });
  for (const form of forms) {
    const ok = await form.save!().catch(() => false);
    if (!ok) { useUnsavedStore.setState({ saving: false, error: 'Your changes could not be saved. Stay to fix them, or discard them.' }); return; }
  }
  proceed(pending);
}

let installed = false;
function installOnce() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  initializeV3NavigationGuard().register(hasUnsavedChanges, destination => {
    useUnsavedStore.setState({ pending: { kind: 'navigate', to: relative(destination) }, error: null });
    return false;
  });
  window.addEventListener('beforeunload', event => { if (hasUnsavedChanges()) { event.preventDefault(); event.returnValue = ''; } });
}

/**
 * Register a form with the guard. `dirty` is read at navigation time, so pass the latest value each render.
 * `save` resolves true when the form saved successfully.
 */
export function useUnsavedChanges(dirty: boolean, save?: () => Promise<boolean>) {
  const latest = useRef({ dirty, save });
  latest.current = { dirty, save };
  useEffect(() => {
    installOnce();
    const form: GuardForm = { dirty: () => latest.current.dirty, save: () => latest.current.save ? latest.current.save() : Promise.resolve(false) };
    if (!latest.current.save) delete form.save;
    useUnsavedStore.setState(state => ({ forms: new Set(state.forms).add(form) }));
    return () => useUnsavedStore.setState(state => { const forms = new Set(state.forms); forms.delete(form); return { forms }; });
  }, [Boolean(save)]);
}
