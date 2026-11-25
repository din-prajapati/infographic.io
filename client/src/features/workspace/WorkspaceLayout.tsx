import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowUpCircle, ChevronDown, Gauge, HelpCircle, Link2, LogOut, Menu, Moon, Settings, Sun, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme-provider';
import { useProductSurfaceTheme } from '@/hooks/useProductSurfaceTheme';
import { EmailVerificationBanner } from '@/components/ui/EmailVerificationBanner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NAV_SECTIONS, WORKSPACE_NAV, activeNavItem, accountInitials } from './navigation';
import { SettingsDialog } from '../settings/SettingsDialog';
import { openSettings } from '../settings/settingsRoute';
import { SUPPORT_EMAIL } from '../settings/panes/PrivacyPane';
import { discardAndLeave, runAfterUnsavedCheck, saveAndLeave, setUnsavedNavigate, stayOnPage, useUnsavedStore } from './unsavedChanges';
import '@/styles/v3-tokens.css';
import './workspace.css';

/** Workspace shell for every authenticated non-editor page (rev-2 spec §2–§3). */
export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { resolvedTheme } = useTheme();
  useProductSurfaceTheme(resolvedTheme);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const active = activeNavItem(location);

  useEffect(() => { setUnsavedNavigate(to => navigate(to)); }, [navigate]);
  useEffect(() => { setDrawerOpen(false); }, [location]);
  // Ctrl+Shift+, (⌘⇧, on macOS) opens Settings from anywhere in the workspace, as in claude.ai.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'Comma') { event.preventDefault(); openSettings('account'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const nav = (compactTooltips: boolean) => (
    <nav aria-label="Workspace" className="ws-nav">
      {NAV_SECTIONS.map(section => (
        <div key={section.id} className="ws-nav-section">
          <p className="ws-nav-label-group" id={`ws-nav-${section.id}${compactTooltips ? '' : '-drawer'}`}>{section.label}</p>
          <ul aria-labelledby={`ws-nav-${section.id}${compactTooltips ? '' : '-drawer'}`}>
            {WORKSPACE_NAV.filter(item => item.section === section.id).map(item => {
              const Icon = item.icon;
              const link = (
                <Link href={item.href} className="ws-nav-item" aria-current={active === item.id ? 'page' : undefined} data-active={active === item.id || undefined}>
                  <Icon aria-hidden="true" /><span className="ws-nav-label">{item.label}</span>
                </Link>
              );
              return (
                <li key={item.id}>
                  {compactTooltips ? (
                    <Tooltip><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="right" className="ws-nav-tooltip">{item.label}</TooltipContent></Tooltip>
                  ) : link}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
  const setupNote = (
    <div className="ws-setup-note"><Link2 aria-hidden="true" /><strong>Set up once. Create again.</strong>Save each property and your Agent &amp; Brand once; every template reuses them.</div>
  );

  return (
    <div className="v3-theme ws-tokens ws-root" data-theme={resolvedTheme}>
      <a className="ws-skip" href="#ws-main">Skip to content</a>
      <header className="ws-topbar">
        <div className="ws-top-left">
          <button type="button" className="ws-menu-button" aria-label="Open navigation" aria-expanded={drawerOpen} aria-controls="ws-drawer" onClick={() => setDrawerOpen(true)}><Menu aria-hidden="true" /></button>
          <Link href="/listings" className="ws-wordmark" aria-label="Buildographic home">
            <img src="/logo-icon-option6-light.png" alt="" width="28" height="28" />
            <span>Buildographic</span>
          </Link>
          <span className="ws-workspace-label">Your listing workspace</span>
        </div>
        <AccountMenu />
      </header>
      <div className="ws-body">
        <aside className="ws-sidebar">{nav(true)}{setupNote}</aside>
        <main id="ws-main" className="ws-main" tabIndex={-1}>
          <EmailVerificationBanner />
          {children}
        </main>
      </div>
      {drawerOpen && (
        <div className="ws-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div id="ws-drawer" className="ws-drawer" role="dialog" aria-modal="true" aria-label="Navigation" onClick={event => event.stopPropagation()}>
            <div className="ws-drawer-head">
              <span className="ws-wordmark-text">Menu</span>
              <button type="button" className="ws-icon-button" aria-label="Close navigation" autoFocus onClick={() => setDrawerOpen(false)}><X aria-hidden="true" /></button>
            </div>
            {nav(false)}
          </div>
        </div>
      )}
      <UnsavedChangesDialog />
      <SettingsDialog />
    </div>
  );
}

const SETTINGS_SHORTCUT = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘⇧,' : 'Ctrl+Shift+,';

/** Account menu (spec §3): identity → everyday account actions → commercial → session. Settings opens the dialog. */
function AccountMenu() {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [, navigate] = useLocation();
  const name = user?.name?.trim() || user?.email?.split('@')[0] || 'Account';
  return (
    <div className="ws-top-right">
      <button type="button" className="ws-icon-button ws-theme" aria-label={resolvedTheme === 'dark' ? 'Use light theme' : 'Use dark theme'} onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
        {resolvedTheme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </button>
      <span className="ws-top-divider" aria-hidden="true" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="ws-account-trigger" aria-label={`Account menu for ${name}`}>
            {user?.avatarUrl
              ? <img className="ws-avatar ws-avatar-photo" src={user.avatarUrl} alt="" />
              : <span className="ws-avatar" aria-hidden="true">{accountInitials(user?.name, user?.email)}</span>}
            <span className="ws-account-text"><span className="ws-account-name">{name}</span>{user?.email && user.email !== name && <span className="ws-account-sub">{user.email}</span>}</span>
            <ChevronDown className="ws-account-chevron" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="v3-theme ws-tokens ws-account-menu" data-theme={resolvedTheme}>
          <DropdownMenuLabel className="ws-account-label"><strong>{name}</strong>{user?.email && <small>{user.email}</small>}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openSettings('account')}><Settings aria-hidden="true" />Settings<DropdownMenuShortcut className="ws-menu-shortcut">{SETTINGS_SHORTCUT}</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openSettings('usage')}><Gauge aria-hidden="true" />Usage</DropdownMenuItem>
          <DropdownMenuItem asChild><a href={`mailto:${SUPPORT_EMAIL}`}><HelpCircle aria-hidden="true" />Get help</a></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/pricing')}><ArrowUpCircle aria-hidden="true" />Upgrade plan</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => runAfterUnsavedCheck(logout)}><LogOut aria-hidden="true" />Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function UnsavedChangesDialog() {
  const { pending, saving, error } = useUnsavedStore();
  useEffect(() => {
    if (!pending) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') stayOnPage(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending]);
  if (!pending) return null;
  return (
    <div className="ws-dialog-backdrop">
      <div className="ws-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ws-unsaved-title" aria-describedby="ws-unsaved-body">
        <h2 id="ws-unsaved-title">You have unsaved changes</h2>
        <p id="ws-unsaved-body">Save them before you leave, or discard them.</p>
        {error && <p className="ws-field-error" role="alert">{error}</p>}
        <div className="ws-dialog-actions">
          <button type="button" className="ws-btn" autoFocus onClick={stayOnPage} disabled={saving}>Stay</button>
          <button type="button" className="ws-btn ws-btn-danger" onClick={discardAndLeave} disabled={saving}>Discard</button>
          <button type="button" className="ws-btn ws-btn-primary" onClick={() => void saveAndLeave()} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
