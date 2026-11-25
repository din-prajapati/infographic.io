import { ArrowUpRight } from 'lucide-react';
import { selectSettingsTab } from '../settingsRoute';
import { SettingRow, SettingSection } from '../SettingsPrimitives';

export const SUPPORT_EMAIL = 'hello@buildographic.com';
const POLICIES = [
  { href: '/privacy', label: 'Privacy policy', description: 'What we collect and why.' },
  { href: '/terms', label: 'Terms of service', description: 'The agreement for using Buildographic.' },
  { href: '/refund-policy', label: 'Refund policy', description: 'When and how refunds are made.' },
  { href: '/cookies', label: 'Cookie policy', description: 'The cookies we set.' },
];

/** Settings → Privacy. Policy links and data requests; no toggles, because there are no optional data uses to switch off. */
export default function PrivacyPane() {
  return (
    <>
      <SettingSection title="Policies">
        <div data-setting-id="policies" tabIndex={-1}>
          {POLICIES.map(policy => (
            <SettingRow key={policy.href} title={policy.label} description={policy.description}>
              <a className="ws-btn ws-btn-small" href={policy.href} target="_blank" rel="noopener noreferrer">Open<ArrowUpRight aria-hidden="true" /><span className="ws-sr-only"> (opens in a new tab)</span></a>
            </SettingRow>
          ))}
        </div>
      </SettingSection>
      <SettingSection title="Your data">
        <div data-setting-id="your-data" tabIndex={-1}>
          <SettingRow title="Usage history" description="Download a CSV or JSON report of your generations.">
            <button type="button" className="ws-btn ws-btn-small" onClick={() => selectSettingsTab('usage', 'export-usage')}>Open Usage</button>
          </SettingRow>
          <SettingRow title="Delete your account" description="Email us from the address you sign in with and we’ll handle your request.">
            <a className="ws-btn ws-btn-small ws-btn-danger" href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Delete my Buildographic account')}`}>Email {SUPPORT_EMAIL}</a>
          </SettingRow>
        </div>
      </SettingSection>
    </>
  );
}
