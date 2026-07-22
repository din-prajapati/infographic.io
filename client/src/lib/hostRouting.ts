const APEX_HOSTNAMES = new Set(["buildographic.com", "www.buildographic.com"]);
const APP_HOSTNAME = "app.buildographic.com";

export const APP_ORIGIN = "https://app.buildographic.com";

/** True on the marketing/landing host (buildographic.com, www.buildographic.com). False on localhost/staging/app host. */
export function isApexHost(): boolean {
  return typeof window !== "undefined" && APEX_HOSTNAMES.has(window.location.hostname);
}

/** True only on the production app host (app.buildographic.com). False on localhost/staging so dev/staging behavior is unchanged. */
export function isAppHost(): boolean {
  return typeof window !== "undefined" && window.location.hostname === APP_HOSTNAME;
}
