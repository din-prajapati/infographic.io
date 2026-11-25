import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Download } from 'lucide-react';
import { generationsApi, usageAnalyticsApi } from '@/lib/api';
import { SettingRow, SettingSection, UsageMeter } from '../SettingsPrimitives';
import { selectSettingsTab } from '../settingsRoute';

/**
 * Settings → Usage, simplified: the two allowances, when they reset, the last six months, and the export.
 * Plan and price live in Billing. Customers never see model names or our AI cost (BL-02, Critical Rule #5).
 */
export default function UsagePane() {
  const designQuota = useQuery({ queryKey: ['/api/v1/infographics/generations/usage/quota'], queryFn: () => generationsApi.getUsageQuota() });
  const editableQuota = useQuery({ queryKey: ['/api/v1/infographics/generations/usage/quota/editable'], queryFn: () => generationsApi.getEditableUsageQuota() });
  const monthly = useQuery({ queryKey: ['/api/v1/payments/usage/monthly', 6], queryFn: () => usageAnalyticsApi.getMonthlyUsage(6) });
  const [exportError, setExportError] = useState<string | null>(null);

  const design = designQuota.data;
  const editable = editableQuota.data;
  // The server counts allowances per calendar month (usage-limit.service monthWindow), not per billing period,
  // so the honest reset date is the 1st of next month — even for plans that renew mid-month.
  const resets = creditsResetDate();
  const nearLimit = design && design.limit > 0 && design.current / design.limit >= 0.8;
  const rows = monthly.data?.data ?? [];
  const maxCount = Math.max(1, ...rows.map(row => row.count));

  const download = async (format: 'csv' | 'json') => {
    setExportError(null);
    try {
      const data = await usageAnalyticsApi.exportUsageData(format);
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `buildographic-usage.${format}`; anchor.click();
      URL.revokeObjectURL(url);
    } catch { setExportError('The report could not be downloaded. Try again.'); }
  };

  return (
    <>
      {nearLimit && (
        <div className="ws-alert ws-alert-warn st-banner" role="status">
          <span>{design.current >= design.limit ? `You’ve used all ${design.limit}` : `You’ve used ${design.current} of ${design.limit}`} design credits this month.</span>
          <Link href="/pricing" className="ws-btn ws-btn-small ws-btn-primary">Upgrade plan</Link>
        </div>
      )}

      <SettingSection title="This month" description={`Credits reset on ${resets}.`}
        action={<button type="button" className="ws-text-button" onClick={() => selectSettingsTab('billing', 'current-plan')}>Plan &amp; billing</button>}>
        <SettingRow id="design-credits" title="Design credits" description="One per new design you generate.">
          <UsageMeter label="Design credits used" used={design ? design.current : null} limit={design ? design.limit : null} />
        </SettingRow>
        <SettingRow id="editable-credits" title="Editable credits" description="One the first time you open a design in the editor.">
          <UsageMeter label="Editable credits used" used={editable ? editable.editableUsed : null} limit={editable ? editable.editableLimit : null} />
        </SettingRow>
      </SettingSection>

      <SettingSection title="Last 6 months">
        <SettingRow id="monthly-usage" stacked title="Designs generated">
          {monthly.isLoading ? <div className="ws-skeleton st-chart-skeleton" /> : rows.length === 0 ? <p className="st-muted">No designs yet.</p> : (
            <ul className="st-bars" aria-label="Designs generated per month">
              {rows.map(row => (
                <li key={row.month}>
                  <span className="st-bar-label">{row.month}</span>
                  <span className="st-bar-track"><span className="st-bar-fill" style={{ width: `${(row.count / maxCount) * 100}%` }} /></span>
                  <span className="st-bar-value">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </SettingRow>
        <SettingRow id="export-usage" title="Download usage report" description={exportError ? <span className="ws-field-error" role="alert">{exportError}</span> : 'Every generation on your account, as CSV or JSON.'}>
          <button type="button" className="ws-btn ws-btn-small" onClick={() => void download('csv')}><Download aria-hidden="true" />CSV</button>
          <button type="button" className="ws-btn ws-btn-small" onClick={() => void download('json')}><Download aria-hidden="true" />JSON</button>
        </SettingRow>
      </SettingSection>
    </>
  );
}

/** First day of next calendar month — when the server's monthly credit count restarts. */
export function creditsResetDate(now = new Date(), locale?: string): string {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** FREE → Free, API_STARTER → API Starter. */
export function planName(tier: string): string {
  return tier.toLowerCase().split('_').map(part => part === 'api' ? 'API' : part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
