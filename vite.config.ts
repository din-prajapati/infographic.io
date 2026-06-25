import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Load env vars based on mode
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  return {
    define: {
      // Injected at build time — Railway sets RAILWAY_GIT_COMMIT_SHA automatically.
      // Shows as "dev" locally. Change with every deploy → visible in UserProfileDropdown.
      'import.meta.env.VITE_APP_BUILD': JSON.stringify(
        process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev'
      ),
    },
    plugins: [react()],
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
