/**
 * Shared brand constants for transactional emails.
 *
 * getBaseUrl() duplicates AuthService's private frontendUrl() logic on purpose —
 * that method is not exported, and this module must not change auth.service.ts's
 * existing behavior. Same env-var precedence, same fallback.
 */
export const BRAND_NAME = 'Buildographic';
export const BRAND_PRIMARY_COLOR = '#1379CC';

export function getBaseUrl(): string {
  return (process.env.CLIENT_URL || process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
}

export function getLogoUrl(): string {
  return `${getBaseUrl()}/logo-icon-option6.png`;
}

export function getFooterHtml(): string {
  const baseUrl = getBaseUrl();
  const year = new Date().getFullYear();
  return `
        <p style="margin:0 0 6px;">
          <a href="${baseUrl}/terms" style="color:#888;">Terms of Service</a> &middot;
          <a href="${baseUrl}/privacy" style="color:#888;">Privacy Policy</a> &middot;
          <a href="${baseUrl}/refund-policy" style="color:#888;">Refund &amp; Cancellation</a> &middot;
          <a href="${baseUrl}/cookies" style="color:#888;">Cookie Policy</a>
        </p>
        <p style="margin:0;">&copy; ${year} ${BRAND_NAME}. All rights reserved.</p>`;
}
