/**
 * Guards BL-30 / BL-39 at the loader level.
 *
 * ## Why this test exists
 *
 * Vitest transforms with esbuild, which does not implement `emitDecoratorMetadata`. The app is
 * served by `ts-node`, which does. So **the suite runs on a different loader than production**,
 * and metadata-dependent behaviour proven in an ordinary spec says nothing about the real app.
 * That asymmetry is precisely how BL-30 — every DTO validation in the app silently disabled —
 * survived undetected: the suite could not see it.
 *
 * Rather than convert the whole suite's transform, this spec launches a minimal Nest app as a
 * child process **under the production loader** and probes it over HTTP. It is the one place in
 * CI where production's module semantics are actually exercised.
 *
 * ## What breaks it
 *
 * - `server/index.ts` reverting to `tsx` (or any esbuild loader) for the NestJS child
 * - `api/package.json`, `shared/package.json` or `server/payments/package.json` losing
 *   `"type": "commonjs"` — a CommonJS loader then dies on ERR_REQUIRE_ESM
 * - `emitDecoratorMetadata` being dropped from `api/tsconfig.json`
 *
 * Any of those silently disables validation across all 22 DTO routes again. This test fails loudly
 * instead. Keep the loader command below in sync with the spawn in `server/index.ts`.
 *
 * **If you see `Transform failed … Parameter decorators only work when experimental decorators are
 * enabled` here, the loader has been reverted to an esbuild one.** The failure shows up as the
 * fixture never becoming ready rather than as a metadata assertion, because esbuild refuses to
 * compile the fixture at all (it sits in `tests/`, outside `api/tsconfig.json`'s
 * `include: ["src/**\/*"]`, so it gets no `experimentalDecorators`). Verified by temporarily
 * swapping `ts-node` for `tsx`: this spec goes red either way, which is the point.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Must mirror server/index.ts's spawn.
const LOADER_ARGS = ['ts-node', '--transpile-only', '-r', 'tsconfig-paths/register'];
const FIXTURE = path.join('tests', 'fixtures', 'global-pipe-probe.app.ts');
const API_DIR = path.resolve(__dirname, '..', '..');
const BOOT_TIMEOUT_MS = 90_000;

let child: ChildProcessWithoutNullStreams | undefined;
let base = '';
let bootLog = '';

beforeAll(async () => {
  const isWindows = process.platform === 'win32';
  child = spawn(isWindows ? 'npx.cmd' : 'npx', [...LOADER_ARGS, FIXTURE], {
    cwd: API_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows,
  }) as ChildProcessWithoutNullStreams;

  const port = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`fixture did not print READY within ${BOOT_TIMEOUT_MS}ms.\n${bootLog}`)),
      BOOT_TIMEOUT_MS,
    );
    const onData = (buf: Buffer) => {
      bootLog += buf.toString();
      const match = bootLog.match(/READY (\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    };
    child!.stdout.on('data', onData);
    child!.stderr.on('data', onData);
    child!.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`fixture exited with code ${code} before becoming ready.\n${bootLog}`));
    });
  });

  base = `http://127.0.0.1:${port}/probe`;
}, BOOT_TIMEOUT_MS + 10_000);

afterAll(() => {
  child?.kill();
});

const postBody = async (body: unknown) => {
  const res = await fetch(`${base}/body`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json().catch(() => null)) as any };
};

describe('the production loader emits decorator metadata', () => {
  it('reports metadata present — unlike this suite, which runs on esbuild', async () => {
    const res = await fetch(`${base}/metadata`);
    const json = (await res.json()) as { hasMetadata: boolean; resolved: string | null };
    expect(json.hasMetadata, 'design:paramtypes missing under the production loader').toBe(true);
    expect(json.resolved).toBe('ProbeDto');
  });
});

describe('the GLOBAL ValidationPipe is live under the production loader', () => {
  // These are the exact BL-30 reproducers, against a plain @Body() route — no @ValidatedBody.
  // Before BL-39 every one of these returned 200 and the raw value reached the handler.
  it('rejects a wrong-typed field with 400', async () => {
    const { status, body } = await postBody({ token: 12345 });
    expect(status).toBe(400);
    expect(JSON.stringify(body.message)).toMatch(/token must be/);
  });

  it('rejects an unknown extra property with 400', async () => {
    const { status, body } = await postBody({ token: 'abc', evil: 'x' });
    expect(status).toBe(400);
    expect(JSON.stringify(body.message)).toMatch(/evil should not exist/);
  });

  it('accepts a valid body', async () => {
    const { status, body } = await postBody({ token: 'a-real-token' });
    expect(status).toBe(200);
    expect(body).toEqual({ token: 'a-real-token', type: 'string' });
  });
});
