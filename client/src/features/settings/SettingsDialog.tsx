import { lazy, Suspense, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-provider';
import { SETTINGS_GROUPS, SETTINGS_TABS, searchSettings, tabLabel, type SettingsSearchResult, type SettingsTabId } from './settingsRegistry';
import { closeSettings, selectSettingsTab, useSettingsRoute } from './settingsRoute';
import { SUPPORT_EMAIL } from './panes/PrivacyPane';
import '@/styles/v3-tokens.css';
import './settings.css';

const ALL_TAB_IDS = SETTINGS_TABS.map(entry => entry.id);
const PANES: Record<SettingsTabId, React.LazyExoticComponent<() => JSX.Element>> = {
  account: lazy(() => import('./panes/AccountPane')),
  billing: lazy(() => import('./panes/BillingPane')),
  usage: lazy(() => import('./panes/UsagePane')),
  organization: lazy(() => import('./panes/OrganizationPane')),
  appearance: lazy(() => import('./panes/AppearancePane')),
  privacy: lazy(() => import('./panes/PrivacyPane')),
};

/**
 * Settings dialog (docs/research/2026-11-18-ACCOUNT-MENU-SETTINGS-STRUCTURE-SPEC.md §4–§5).
 * Opens over the current page whenever the URL hash is `#settings/<tab>`; fixed size on every tab, only the pane scrolls.
 * Left: settings search + grouped vertical tabs + footer links. Right: the tab's sections and rows.
 */
export function SettingsDialog() {
  const route = useSettingsRoute();
  const { resolvedTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const open = Boolean(route) && isAuthenticated;
  const tab = route?.tab ?? 'account';
  const paneRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const visibleTabs = SETTINGS_TABS;

  // Scroll to and briefly highlight a setting named in the hash (search results, cross-links, deep links).
  const settingId = route?.settingId ?? null;
  useEffect(() => {
    const pane = paneRef.current;
    if (!open || !pane) return;
    if (!settingId) { pane.scrollTop = 0; return; }
    let cancelled = false; let tries = 0; let timer = 0;
    const find = () => {
      if (cancelled) return;
      const target = pane.querySelector<HTMLElement>(`[data-setting-id="${settingId}"]`);
      if (!target) { if (tries++ < 40) timer = window.setTimeout(find, 50); return; } // the pane is lazy-loaded
      target.scrollIntoView({ block: 'center', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      target.setAttribute('data-highlight', '');
      target.focus({ preventScroll: true });
      timer = window.setTimeout(() => target.removeAttribute('data-highlight'), 2000);
    };
    find();
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [open, tab, settingId]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={next => { if (!next) closeSettings(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="st-overlay" data-theme={resolvedTheme} />
        <DialogPrimitive.Content className="v3-theme ws-tokens st-dialog" data-theme={resolvedTheme} aria-describedby={undefined}
          onOpenAutoFocus={event => { event.preventDefault(); searchRef.current?.focus(); }}
          // Radix handles Escape before React does: an input with a pending edit (search text, a changed name) marks itself
          // so the first Escape only clears/reverts it and a second Escape closes the dialog.
          onEscapeKeyDown={event => { if ((event.target as HTMLElement | null)?.closest?.('[data-escape-guard]')) event.preventDefault(); }}>
          <header className="st-head">
            <DialogPrimitive.Title className="st-title">Settings</DialogPrimitive.Title>
            <DialogPrimitive.Close className="st-close" aria-label="Close settings"><X aria-hidden="true" /></DialogPrimitive.Close>
          </header>
          <div className="st-body">
            <nav className="st-nav" aria-label="Settings">
              <SettingsSearch inputRef={searchRef} visibleTabs={ALL_TAB_IDS}
                onPick={result => selectSettingsTab(result.tab, result.id)}>
                <div className="st-tabs">
                {SETTINGS_GROUPS.map(group => (
                  <ul key={group} className="st-tab-group">
                    {visibleTabs.filter(entry => entry.group === group).map(entry => {
                      const Icon = entry.icon;
                      return (
                        <li key={entry.id}>
                          <button type="button" className="st-tab" aria-current={entry.id === tab ? 'page' : undefined} onClick={() => selectSettingsTab(entry.id)}>
                            <Icon aria-hidden="true" /><span>{entry.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ))}
                </div>
              </SettingsSearch>
              <div className="st-nav-foot">
                <a href="/pricing" onClick={() => closeSettings()}>Plans &amp; pricing<ArrowUpRight aria-hidden="true" /></a>
                <a href={`mailto:${SUPPORT_EMAIL}`}>Get help<ArrowUpRight aria-hidden="true" /></a>
              </div>
            </nav>
            <div className="st-pane" ref={paneRef} role="region" aria-labelledby="st-pane-title">
              <div className="st-pane-inner">
                <h2 id="st-pane-title" className="ws-sr-only">{tabLabel(tab)}</h2>
                {open && <Suspense fallback={<div className="ws-skeleton st-pane-skeleton" aria-label="Loading" />}>{(() => { const Pane = PANES[tab]; return <Pane key={tab} />; })()}</Suspense>}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * "Search settings" combobox (spec §4 nav search). While a query is typed the tab list is replaced by matching
 * settings across every tab; ↑/↓ move, Enter opens, Escape clears the query (a second Escape closes the dialog).
 */
function SettingsSearch({ inputRef, visibleTabs, onPick, children }: { inputRef: React.RefObject<HTMLInputElement>; visibleTabs: SettingsTabId[]; onPick: (result: SettingsSearchResult) => void; children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchSettings(query, visibleTabs), [query, visibleTabs]);
  const searching = query.trim().length > 0;
  useEffect(() => { setActive(0); }, [query]);

  const pick = (result: SettingsSearchResult | undefined) => { if (!result) return; onPick(result); setQuery(''); };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); setActive(index => (index + 1) % results.length); }
    else if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); setActive(index => (index - 1 + results.length) % results.length); }
    else if (event.key === 'Enter' && searching) { event.preventDefault(); pick(results[active]); }
    else if (event.key === 'Escape' && query) { event.preventDefault(); setQuery(''); }
  };
  const activeId = searching && results[active] ? `st-result-${results[active].id}` : undefined;

  return (
    <>
      <div className="st-search">
        <Search className="st-search-icon" aria-hidden="true" />
        <input ref={inputRef} type="text" role="combobox" aria-label="Search settings" placeholder="Search settings" value={query}
          aria-expanded={searching} aria-controls="st-search-results" aria-autocomplete="list" aria-activedescendant={activeId}
          data-escape-guard={query ? '' : undefined}
          autoComplete="off" spellCheck={false} onChange={event => setQuery(event.target.value)} onKeyDown={onKeyDown} />
        {query && <button type="button" className="st-search-clear" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus(); }}><X aria-hidden="true" /></button>}
      </div>
      {searching ? (
        <div className="st-results">
          <ul id="st-search-results" role="listbox" aria-label="Matching settings">
            {results.map((result, index) => (
              <li key={result.id} id={`st-result-${result.id}`} role="option" aria-selected={index === active} className="st-result"
                onMouseEnter={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => pick(result)}>
                <span className="st-result-label">{result.label}</span>
                <span className="st-result-meta">{result.tabLabel} · {result.section}</span>
              </li>
            ))}
          </ul>
          {results.length === 0 && <p className="st-results-empty" role="status">No settings match “{query.trim()}”.</p>}
          {results.length > 0 && <p className="ws-sr-only" role="status">{results.length} {results.length === 1 ? 'setting' : 'settings'} found</p>}
        </div>
      ) : children}
    </>
  );
}
