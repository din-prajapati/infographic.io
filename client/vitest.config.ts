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
