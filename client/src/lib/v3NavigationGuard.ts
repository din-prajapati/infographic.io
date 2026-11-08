/** Wouter dispatches push/replace notifications synchronously. Reject writes before
 * invoking its wrappers and rejected popstate before its route subscribers run.
 * Native history stores a private envelope; public state/event.state retain the
 * caller's exact value, including null, arrays and primitive values.
 */
export function createV3NavigationGuard(target: Window) {
  const history = target.history;
  const originalPush = history.pushState;
  const originalReplace = history.replaceState;
  const ownState = Object.getOwnPropertyDescriptor(history, 'state');
  const stateGetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(history), 'state')!.get!;
  const key = '__buildographicV3History';
  let owner = Math.random().toString(36).slice(2);
  let index = 0;
  let href = target.location.href;
  let restoring: number | null = null;
  let internal = 0;
  let disposed = false;
  const guards = new Set<{ dirty: () => boolean; confirm: () => boolean }>();
  const stamp = (value: unknown, position: number) => ({ [key]: { owner, position }, value });
  const metadata = (state: unknown): { owner: string; position: number } | undefined => {
    const value = state && typeof state === 'object' ? (state as Record<string, unknown>)[key] : undefined;
    if (!value || typeof value !== 'object') return;
    const data = value as { owner?: unknown; position?: unknown };
    return typeof data.owner === 'string' && typeof data.position === 'number' && Number.isSafeInteger(data.position)
      ? data as { owner: string; position: number } : undefined;
  };
  const position = (state: unknown) => { const data = metadata(state); return data?.owner === owner ? data.position : undefined; };
  // State and same-document history entries persist across a reload.
  const unwrap = (state: unknown) => metadata(state) ? (state as { value: unknown }).value : state;
  const address = (url: string) => { const value = new URL(url); return value.pathname + value.search; };
  const permitted = () => internal > 0 || [...guards].every(guard => !guard.dirty() || guard.confirm());
  const previous = metadata(history.state);
  if (previous) { owner = previous.owner; index = previous.position; }
  originalReplace.call(history, stamp(unwrap(history.state), index), '', href);
  Object.defineProperty(history, 'state', { configurable: true, get: () => unwrap(stateGetter.call(history)) });

  function write(method: 'pushState' | 'replaceState', state: unknown, unused: string, url?: string | URL | null) {
    const next = url == null ? target.location.href : new URL(String(url), target.location.href).href;
    if (restoring !== null || (address(next) !== address(href) && !permitted())) return;
    const nextIndex = method === 'pushState' ? index + 1 : index;
    (method === 'pushState' ? originalPush : originalReplace).call(history, stamp(state, nextIndex), unused, url);
    index = nextIndex;
    href = target.location.href;
  }
  const push: History['pushState'] = (state, unused, url) => write('pushState', state, unused, url);
  const replace: History['replaceState'] = (state, unused, url) => write('replaceState', state, unused, url);
  history.pushState = push;
  history.replaceState = replace;

  const onPop = (event: PopStateEvent) => {
    const destination = position(event.state);
    Object.defineProperty(event, 'state', { configurable: true, value: unwrap(event.state) });
    if (restoring !== null) {
      event.stopImmediatePropagation();
      if (destination === restoring) { index = restoring; restoring = null; href = target.location.href; }
      else if (destination !== undefined) history.go(restoring - destination);
      return;
    }
    // Native hash navigation creates an entry without calling pushState. Stamp
    // it immediately so a later Back from the editor has a known destination.
    if ((destination === undefined || destination === index) &&
      address(target.location.href) === address(href)) {
      if (target.location.href !== href) {
        index++;
        originalReplace.call(history, stamp(event.state, index), '', target.location.href);
      }
      href = target.location.href;
      return;
    }
    // Entries outside the tracked SPA history chain use document unload.
    if (destination === undefined || destination === index) return;
    if (address(target.location.href) !== address(href) && !permitted()) {
      event.stopImmediatePropagation();
      restoring = index;
      history.go(index - destination);
      return;
    }
    index = destination;
    href = target.location.href;
  };
  target.addEventListener('popstate', onPop, true);
  return {
    register(dirty: () => boolean, confirm: () => boolean) {
      const guard = { dirty, confirm }; guards.add(guard); return () => { guards.delete(guard); };
    },
    allowInternal<T>(action: () => T): T { internal++; try { return action(); } finally { internal--; } },
    dispose() {
      if (disposed) return; disposed = true;
      target.removeEventListener('popstate', onPop, true); guards.clear();
      if (history.pushState === push) history.pushState = originalPush;
      if (history.replaceState === replace) history.replaceState = originalReplace;
      originalReplace.call(history, history.state, '', target.location.href);
      if (ownState) Object.defineProperty(history, 'state', ownState);
      else Reflect.deleteProperty(history, 'state');
    },
  };
}
let boundary: ReturnType<typeof createV3NavigationGuard> | undefined;
export function initializeV3NavigationGuard() { return boundary ??= createV3NavigationGuard(window); }
export const V3_UNSAVED_MESSAGE = 'You have unsaved changes. Leave this design?';
