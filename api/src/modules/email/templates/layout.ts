import { BRAND_NAME, BRAND_PRIMARY_COLOR, getFooterHtml, getLogoUrl } from './brand';

/**
 * Wraps an email's body HTML in the branded shell: header (logo image + text
 * wordmark, rendered as two separate elements so the wordmark still shows if the
 * image is blocked), content card, footer (legal links + copyright).
 *
 * Inline CSS only — email clients strip <style> blocks and external stylesheets
 * unreliably, so every rule is inlined on the element itself.
 */
export function renderEmailLayout({ bodyHtml }: { bodyHtml: string }): string {
  return `<body style="margin:0;padding:32px 16px;background:#f5f4f0;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="padding:20px 32px;border-bottom:2px solid ${BRAND_PRIMARY_COLOR};text-align:center;">
        <img src="${getLogoUrl()}" alt="${BRAND_NAME}" height="32" style="vertical-align:middle;margin-right:8px;" />
        <span style="font-size:18px;font-weight:700;color:${BRAND_PRIMARY_COLOR};vertical-align:middle;">${BRAND_NAME}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;color:#1a1a1a;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px;border-top:1px solid #e5e5e5;text-align:center;font-size:12px;color:#888;">${getFooterHtml()}
      </td>
    </tr>
  </table>
</body>`;
}
