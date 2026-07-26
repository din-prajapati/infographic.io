import * as Sentry from '@sentry/react';
import { browserTracingIntegration } from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV || import.meta.env.MODE,
  // Must match the release name the vite plugin uploads source maps under
  // (see vite.config.ts's releaseName) or Sentry can't symbolicate stack traces.
  release: import.meta.env.VITE_APP_BUILD,
  integrations: [browserTracingIntegration()],
  tracesSampleRate: 1.0,
  enabled: import.meta.env.PROD,
});

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  const root = createRoot(rootElement);
  root.render(<App />);
} catch (error) {
  console.error("Failed to render app:", error);
  throw error;
}
