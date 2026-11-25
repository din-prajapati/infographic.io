import { useSyncExternalStore } from 'react';
import { parseSettingsHash, settingsHash, type SettingsRoute, type SettingsTabId } from './settingsRegistry';

/**
 * Settings is a dialog over the current page, addressed by the URL hash (spec §1).
 * Hash-only changes keep pathname + search, so the app-wide history guard (v3NavigationGuard) lets them through
 * without the unsaved-changes prompt, and Wouter does not re-route the page underneath.
 *
 * History model:
 *   open         → push   (Back closes the dialog)
 *   switch tab   → replace (one Back still closes it, as in claude.ai's modal)
 *   close        → back() when this tab opened it with a push, otherwise replace with the bare URL
 */
const EVENTS = ['hashchange', 'popstate', 'pushState', 'replaceState'] as const;

function subscribe(onChange: () => void) {
  for (const name of EVENTS) window.addEventListener(name, onChange);
  return () => { for (const name of EVENTS) window.removeEventListener(name, onChange); };
}
const readHash = () => (typeof window === 'undefined' ? '' : window.location.hash);

/** The current settings route, or null when the dialog is closed. */
export function useSettingsRoute(): SettingsRoute | null {
  const hash = useSyncExternalStore(subscribe, readHash, () => '');
  return parseSettingsHash(hash);
}

const base = () => window.location.pathname + window.location.search;
/** Set when this document pushed the entry that opened the dialog; cleared by any other navigation. */
let openedByPush = false;
if (typeof window !== 'undefined') window.addEventListener('popstate', () => { openedByPush = false; });

export function openSettings(tab: SettingsTabId = 'account', settingId?: string | null) {
  const hash = settingsHash(tab, settingId);
  if (parseSettingsHash(window.location.hash)) { window.history.replaceState(window.history.state, '', base() + hash); return; }
  window.history.pushState(null, '', base() + hash);
  openedByPush = true;
}

export function selectSettingsTab(tab: SettingsTabId, settingId?: string | null) {
  window.history.replaceState(window.history.state, '', base() + settingsHash(tab, settingId));
}

export function closeSettings() {
  if (!parseSettingsHash(window.location.hash)) return;
  if (openedByPush) { openedByPush = false; window.history.back(); return; }
  window.history.replaceState(window.history.state, '', base());
}
