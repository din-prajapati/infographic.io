import { Home, LayoutGrid, LayoutTemplate, PenSquare, UserRound, Workflow, type LucideIcon } from 'lucide-react';

// Icons follow the mockup sidebar (design.md §5): grid, house, layout, edit, user, workflow.

export interface WorkspaceNavItem {
  id: 'home' | 'listings' | 'templates' | 'designs' | 'agent-brand' | 'how-it-works';
  label: string;
  href: string;
  icon: LucideIcon;
  /** Sidebar group (design.md §5): WORKSPACE or CONFIGURE ONCE. */
  section: 'workspace' | 'configure';
  /** Extra path prefixes that keep this item active (detail routes). */
  activePrefixes?: string[];
}

/** Final order per rev-2 spec §3: Home · Listings · Templates · Designs · Agent & brand · How it works. */
export const WORKSPACE_NAV: WorkspaceNavItem[] = [
  { id: 'home', label: 'Home', href: '/workspace', icon: LayoutGrid, section: 'workspace' },
  { id: 'listings', label: 'Listings', href: '/listings', icon: Home, section: 'workspace', activePrefixes: ['/listings/'] },
  { id: 'templates', label: 'Templates', href: '/templates', icon: LayoutTemplate, section: 'workspace' },
  { id: 'designs', label: 'Designs', href: '/my-designs', icon: PenSquare, section: 'workspace' },
  { id: 'agent-brand', label: 'Agent & brand', href: '/agent-brand', icon: UserRound, section: 'configure' },
  { id: 'how-it-works', label: 'How it works', href: '/workspace/how-it-works', icon: Workflow, section: 'configure' },
];

export const NAV_SECTIONS: { id: WorkspaceNavItem['section']; label: string }[] = [{ id: 'workspace', label: 'Workspace' }, { id: 'configure', label: 'Configure once' }];

/** Exactly one item is active for a path. `/workspace/how-it-works` must not also light up Home. */
export function activeNavItem(pathname: string): WorkspaceNavItem['id'] | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  for (const item of WORKSPACE_NAV) {
    if (path === item.href || item.activePrefixes?.some(prefix => path.startsWith(prefix))) return item.id;
  }
  return null;
}

/** Initials for the account avatar: account name first, then the e-mail's local part. */
export function accountInitials(name: string | undefined, email: string | undefined): string {
  const source = (name ?? '').trim() || (email ?? '').split('@')[0] || '';
  const words = source.split(/[\s._-]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase() || '?';
}
