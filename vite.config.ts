import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env vars based on mode
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Single source of truth for the Sentry release name — must be identical to what
  // Sentry.init({ release }) reports at runtime (client/src/main.tsx reads it back via
  // import.meta.env.VITE_APP_BUILD), or Sentry cannot match a live event to the source
  // maps this plugin uploads and falls back to raw minified stack frames.
  const releaseName = process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev';

  return {
    define: {
      'import.meta.env.VITE_APP_BUILD': JSON.stringify(releaseName),
    },
    plugins: [
      react(),
      // Uploads source maps to Sentry at build time so stack traces show real
      // filenames instead of minified bundle hashes. No-ops (and deletes no
      // files) when SENTRY_AUTH_TOKEN isn't set, so local/CI builds without
      // the token are unaffected.
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        disable: !process.env.SENTRY_AUTH_TOKEN,
        release: {
          name: releaseName,
        },
        sourcemaps: {
          filesToDeleteAfterUpload: ['**/*.map'],
        },
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
      },
    },
    root: path.resolve(__dirname, "client"),
    publicDir: path.resolve(__dirname, "client", "public"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      target: 'esnext',
      sourcemap: true,
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        // Proxy API requests during development
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
      fs: {
        strict: false, // Allow accessing files outside root
        allow: ['..'], // Allow accessing parent directory (where node_modules is)
      },
    },
  };
});
