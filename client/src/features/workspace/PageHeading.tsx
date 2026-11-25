import type { ReactNode } from 'react';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';

export interface Crumb { label: string; href?: string }

/** design.md §4.4 page heading: breadcrumb → eyebrow → heading → description, actions aligned right on desktop. */
export function PageHeading({ crumbs, eyebrow, title, subtitle, actions }: { crumbs: Crumb[]; eyebrow: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <>
      <nav className="ws-breadcrumb" aria-label="Breadcrumb">
        {[{ label: 'Workspace', href: '/listings' }, ...crumbs].map((crumb, index, all) => {
          const last = index === all.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} style={{ display: 'contents' }}>
              {crumb.href && !last ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current={last ? 'page' : undefined}>{crumb.label}</span>}
              {!last && <ChevronRight aria-hidden="true" />}
            </span>
          );
        })}
      </nav>
      <div className="ws-page-head">
        <div>
          <p className="ws-eyebrow">{eyebrow}</p>
          <h1 className="ws-title">{title}</h1>
          {subtitle && <p className="ws-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="ws-actions">{actions}</div>}
      </div>
    </>
  );
}
