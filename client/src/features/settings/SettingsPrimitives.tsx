import { useId, type ReactNode } from 'react';

/** Section heading + rows (spec §5.1). Sections are separated by spacing, not divider lines. */
export function SettingSection({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section className="st-section" aria-labelledby={id}>
      <div className="st-section-head">
        <div>
          <h3 id={id}>{title}</h3>
          {description && <p className="st-section-desc">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * One setting (spec §5.2): title + muted description on the left, one control on the right.
 * `id` matches a SETTINGS_INDEX entry so search and `#settings/<tab>/<id>` can scroll to and highlight it.
 * `stacked` puts the control under the text (wide controls such as theme cards or tables).
 */
export function SettingRow({ id, title, description, children, stacked = false }: { id?: string; title: ReactNode; description?: ReactNode; children?: ReactNode; stacked?: boolean }) {
  const titleId = useId();
  return (
    <div className={`st-row${stacked ? ' st-row-stacked' : ''}`} data-setting-id={id} tabIndex={id ? -1 : undefined} role="group" aria-labelledby={titleId}>
      <div className="st-row-text">
        <div className="st-row-title" id={titleId}>{title}</div>
        {description && <div className="st-row-desc">{description}</div>}
      </div>
      {children !== undefined && <div className="st-row-control">{children}</div>}
    </div>
  );
}

/** Two-line usage meter: "12 of 50" plus a bar. `limit === -1` means unlimited. */
export function UsageMeter({ used, limit, label }: { used: number | null; limit: number | null; label: string }) {
  if (used === null || limit === null) return <span className="st-muted">—</span>;
  const unlimited = limit === -1;
  const percent = unlimited || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="st-meter">
      <span className="st-meter-value">{unlimited ? `${used} used · Unlimited` : `${used} of ${limit} used`}</span>
      {!unlimited && (
        <span className="st-meter-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(used, limit)} data-level={percent >= 100 ? 'full' : percent >= 80 ? 'high' : undefined}>
          <span className="st-meter-fill" style={{ width: `${percent}%` }} />
        </span>
      )}
    </div>
  );
}
