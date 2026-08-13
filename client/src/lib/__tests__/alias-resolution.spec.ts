/**
 * Alias resolution smoke test — US-DEPLOY-007 T1
 *
 * Verifies that the @/* → client/src/* alias resolves in vitest
 * exactly as it does in the Vite dev server (vite.config.ts).
 * If the alias is misconfigured, this import throws MODULE_NOT_FOUND
 * and the test errors out — not a false "pass".
 */
import { describe, it, expect } from 'vitest';
// canvasTypes.ts exports only TypeScript type aliases — no runtime values.
// The module object is empty ({}) but the import succeeding proves alias works.
import * as canvasTypes from '@/lib/canvasTypes';

describe('@/* alias resolution', () => {
  it('resolves @/lib/canvasTypes via the vitest alias (matches vite.config.ts)', () => {
    // Module imported without MODULE_NOT_FOUND error → alias is correct.
    // typeof check avoids "always truthy" lint: an undefined or null module
    // would be caught here at runtime even if the import did not throw.
    expect(typeof canvasTypes).toBe('object');
  });
});
