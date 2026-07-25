export type AppEnv = 'local' | 'staging' | 'production';

const KNOWN_APP_ENVS: readonly AppEnv[] = ['local', 'staging', 'production'];

/**
 * Resolves which environment this process is running in.
 *
 * Order: explicit APP_ENV -> RAILWAY_ENVIRONMENT_NAME -> NODE_ENV=production -> 'local'.
 * Staging and production both run NODE_ENV=production, so that check alone can't
 * distinguish them — it's only the final fallback, after the more specific signals.
 *
 * Accepts an optional env source (defaults to `process.env`) so boot-time validation can
 * key off the exact merged config object ConfigModule passes to `validate()`, rather than
 * `process.env` at a moment before ConfigModule has finished assigning loaded values to it.
 */
export function getAppEnv(env: NodeJS.ProcessEnv | Record<string, unknown> = process.env): AppEnv {
  const explicit = env.APP_ENV as string | undefined;
  if (isAppEnv(explicit)) {
    return explicit;
  }

  const railwayEnv = env.RAILWAY_ENVIRONMENT_NAME as string | undefined;
  if (railwayEnv === 'staging' || railwayEnv === 'production') {
    return railwayEnv;
  }

  if (env.NODE_ENV === 'production') {
    return 'production';
  }

  return 'local';
}

function isAppEnv(value: string | undefined): value is AppEnv {
  return !!value && (KNOWN_APP_ENVS as readonly string[]).includes(value);
}
