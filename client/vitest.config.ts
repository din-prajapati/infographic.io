/**
 * Canvas testing strategy — US-DEPLOY-007 AC6 — DECISION: option (b)
 *
 * jsdom does NOT implement <canvas>: document.createElement('canvas').getContext('2d')
 * returns null, so canvasExport.ts cannot run end-to-end without a canvas mock library.
 *
 * Two options evaluated:
 *   (a) vitest-canvas-mock / jest-canvas-mock — one new dependency; lets you call
 *       exportCanvasToImage() end-to-end and assert on recorded ctx calls.
 *   (b) Export and test the pure geometry helpers (computeObjectFitDraw, wrapTextToWidth)
 *       and the padding constants — zero extra dependencies; covers where the actual
 *       US-AI-032 bugs were (padding offsets, objectFit geometry, crop source rect).
 *
 * CHOSEN: (b). The four T6 divergences are pure number computations with no ctx dependency.
 * Exporting the helpers and testing them directly is lower cost and higher signal than
 * mocking the full canvas API. If end-to-end ctx-call tests become necessary, add
 * vitest-canvas-mock in a separate story.
 */
import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
  },
  resolve: {
    alias: {
      // @/* resolves to client/src/* — exactly as vite.config.ts does:
      //   path.resolve(__dirname, "client", "src") where __dirname = repo root
      // Here __dirname = repo-root/client, so "src" is the same path.
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, '..', 'shared'),
    },
  },
});
