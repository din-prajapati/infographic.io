import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENV || process.env.NODE_ENV,
  release: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7),
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  enabled: process.env.NODE_ENV === 'production',
});
