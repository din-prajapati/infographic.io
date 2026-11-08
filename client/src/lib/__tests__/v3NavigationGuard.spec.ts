import { afterEach, describe, expect, it, vi } from 'vitest';
import { createV3NavigationGuard } from '../v3NavigationGuard';

const cleanups: (() => void)[] = [];
afterEach(() => { cleanups.splice(0).reverse().forEach(fn => fn()); vi.restoreAllMocks(); });
function setup() {
  const guard = createV3NavigationGuard(window); cleanups.push(guard.dispose);
  let dirty = true;
  const confirm = vi.fn(() => false);
  cleanups.push(guard.register(() => dirty, confirm));
  return { guard, confirm, clean: () => { dirty = false; } };
}
describe('V3 navigation boundary', () => {
  // Contract: cancelled dirty route writes retain the current URL and existing application state.
  it.each(['pushState', 'replaceState'] as const)('rejects dirty %s before mutation', method => {
    const f = setup(), url = location.href, state = history.state;
    history[method]({ app: 'destination' }, '', '/templates');
    expect(location.href).toBe(url); expect(history.state).toEqual(state);
    expect(f.confirm).toHaveBeenCalledTimes(1);
  });
  // Contract: consent applies once at the history boundary; unrelated state fields survive tagging.
  it('accepts a route with original application state fields', () => {
    const f = setup(); f.confirm.mockReturnValue(true);
    history.pushState({ app: { selected: 7 } }, '', '/templates');
    expect(location.pathname).toBe('/templates'); expect(history.state.app).toEqual({ selected: 7 });
    expect(f.confirm).toHaveBeenCalledTimes(1);
  });
  // Contract: clean and detached sessions navigate with zero prompts.
  it('allows clean navigation and restores original methods on disposal', () => {
    const original = history.pushState, f = setup(); f.clean();
    history.pushState({}, '', '/account'); expect(location.pathname).toBe('/account');
    expect(f.confirm).toHaveBeenCalledTimes(0);
    f.guard.dispose(); expect(history.pushState).toBe(original);
  });
  // Contract: internal first-save URL adoption retains a dirty session without requesting consent.
  it('allows a scoped internal replacement, then guards the next user transition', () => {
    const f = setup();
    f.guard.allowInternal(() => history.replaceState(history.state, '', '/editor?editor=v3&designId=c123456789012345678901234'));
    expect(location.search).toBe('?editor=v3&designId=c123456789012345678901234');
    expect(f.confirm).toHaveBeenCalledTimes(0);
    history.pushState({}, '', '/templates'); expect(f.confirm).toHaveBeenCalledTimes(1);
    expect(location.pathname).toBe('/editor');
  });
  // Contract: same-address state writes do not leave a document and must not ask for consent.
  it('permits same-address state changes', () => {
    const f = setup(); history.replaceState({ existing: 9 }, '', location.href);
    expect(history.state.existing).toBe(9); expect(f.confirm).toHaveBeenCalledTimes(0);
  });
});

// Contract: public History.state preserves exact caller values across all SPA routes.
it.each([null, 42, 'legacy-state', ['a', 'b'], { app: true }])('preserves public state %j', value => {
  const f = setup(); f.clean(); history.replaceState(value, '', location.href);
  expect(history.state).toEqual(value);
});
