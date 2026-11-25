import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import { authApi, usersApi, type UserProfile } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { uploadV3Image } from '@/lib/v3MediaUpload';
import { accountInitials } from '../../workspace/navigation';
import { SettingRow, SettingSection } from '../SettingsPrimitives';

export const PROFILE_QUERY_KEY = ['users', 'me'] as const;

/**
 * Settings → Account (spec §6.1, trimmed per §9 and the 2026-11-18 drop list).
 * Name and photo save as soon as they change (blur / Enter / upload), like every other control in the dialog,
 * so the dialog never holds unsaved work. No sessions, login history or 2FA rows: those are BL-50/BL-51, not built.
 */
export default function AccountPane() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: PROFILE_QUERY_KEY, queryFn: () => usersApi.getMe().then(response => response.data) });
  const profile = profileQuery.data;

  // Keep the cached session (account menu, avatar) in step with the server copy.
  useEffect(() => {
    if (!profile || !user) return;
    if (profile.name !== (user.name ?? null) || profile.avatarUrl !== (user.avatarUrl ?? null) || profile.emailVerified !== (user.emailVerified ?? true)) {
      updateUser({ name: profile.name ?? undefined, avatarUrl: profile.avatarUrl, emailVerified: profile.emailVerified });
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: (patch: { name?: string; avatarUrl?: string | null }) => usersApi.updateMe(patch).then(response => response.data),
    onSuccess: next => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, next);
      updateUser({ name: next.name ?? undefined, avatarUrl: next.avatarUrl });
    },
  });

  if (profileQuery.isError) {
    return (
      <div className="ws-alert ws-alert-error" role="alert">
        <span>Your profile could not be loaded. Check your connection and try again.</span>
        <button type="button" className="ws-btn ws-btn-small" onClick={() => void profileQuery.refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <>
      <SettingSection title="Profile">
        <PhotoRow profile={profile} fallbackName={user?.name} email={user?.email} onSave={avatarUrl => save.mutateAsync({ avatarUrl })} />
        <NameRow saved={profile?.name ?? user?.name ?? ''} loading={!profile} onSave={name => save.mutateAsync({ name })} />
        <SettingRow id="email" title="Email address" description="The address you sign in with. It can’t be changed here.">
          <span className="st-value">{profile?.email ?? user?.email}</span>
          {profile && <span className={`ws-pill ${profile.emailVerified ? 'ws-pill-green' : 'ws-pill-amber'}`}>{profile.emailVerified ? 'Verified' : 'Not verified'}</span>}
        </SettingRow>
      </SettingSection>
      <SettingSection title="Sign-in">
        <PasswordRow profile={profile} />
        <SettingRow id="sign-in-method" title="Sign-in method" description={profile?.hasGoogle ? 'Your Google account is linked.' : 'You sign in with your email and password.'}>
          <span className="ws-pill">{!profile ? '—' : profile.hasGoogle && profile.hasPassword ? 'Email + Google' : profile.hasGoogle ? 'Google' : 'Email and password'}</span>
        </SettingRow>
      </SettingSection>
    </>
  );
}

function PhotoRow({ profile, fallbackName, email, onSave }: { profile?: UserProfile; fallbackName?: string; email?: string; onSave: (avatarUrl: string | null) => Promise<unknown> }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (task: () => Promise<unknown>) => {
    setBusy(true); setError(null);
    try { await task(); } catch (err) { setError(err instanceof Error ? err.message : 'The photo could not be saved. Try again.'); } finally { setBusy(false); }
  };
  const upload = (file: File) => run(async () => { const image = await uploadV3Image(file); await onSave(image.src); });
  const photo = profile?.avatarUrl;
  return (
    <SettingRow id="profile-photo" title="Profile photo" description={error ? <span className="ws-field-error" role="alert">{error}</span> : 'JPEG, PNG, WebP, GIF or AVIF, up to 10 MB.'}>
      {photo
        ? <img className="st-avatar" src={photo} alt="Your profile photo" />
        : <span className="st-avatar st-avatar-initials" aria-hidden="true">{accountInitials(profile?.name ?? fallbackName, email)}</span>}
      <button type="button" className="ws-btn ws-btn-small" disabled={busy || !profile} onClick={() => input.current?.click()}>
        {busy ? <><Loader2 className="st-spin" aria-hidden="true" />Saving…</> : photo ? 'Replace' : 'Upload photo'}
      </button>
      {photo && <button type="button" className="ws-btn ws-btn-small ws-btn-subtle" disabled={busy} onClick={() => void run(() => onSave(null))}>Remove</button>}
      <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif,image/avif" aria-label="Upload profile photo"
        onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }} />
    </SettingRow>
  );
}

function NameRow({ saved, loading, onSave }: { saved: string; loading: boolean; onSave: (name: string) => Promise<unknown> }) {
  const [value, setValue] = useState(saved);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setValue(saved); }, [saved]);

  const commit = async () => {
    const next = value.trim();
    if (next === saved.trim()) { setValue(saved); setError(null); return; }
    if (!next) { setError('Enter your name.'); return; }
    setStatus('saving'); setError(null);
    try { await onSave(next); setValue(next); setStatus('saved'); }
    catch (err) { setStatus('idle'); setError(err instanceof Error ? err.message : 'Your name could not be saved. Try again.'); }
  };
  return (
    <SettingRow id="full-name" title={<label htmlFor="st-full-name">Full name</label>}
      description={error ? <span className="ws-field-error" id="st-full-name-error" role="alert">{error}</span> : 'Shown in your account menu and to your team.'}>
      <span className="st-save-status" aria-live="polite">
        {status === 'saving' && <><Loader2 className="st-spin" aria-hidden="true" />Saving…</>}
        {status === 'saved' && <><Check aria-hidden="true" />Saved</>}
      </span>
      <input id="st-full-name" className="st-input" value={value} maxLength={100} disabled={loading} autoComplete="name"
        aria-invalid={error ? true : undefined} aria-describedby={error ? 'st-full-name-error' : undefined}
        data-escape-guard={value !== saved ? '' : undefined}
        onFocus={() => { focused.current = true; setStatus('idle'); }}
        onChange={event => { setValue(event.target.value); setError(null); }}
        onBlur={() => { focused.current = false; void commit(); }}
        onKeyDown={event => {
          if (event.key === 'Enter') { event.preventDefault(); (event.target as HTMLInputElement).blur(); }
          // First Escape reverts an edit and keeps the dialog open; a second Escape closes it.
          if (event.key === 'Escape' && value !== saved) { event.preventDefault(); setValue(saved); setError(null); }
        }} />
    </SettingRow>
  );
}

function PasswordRow({ profile }: { profile?: UserProfile }) {
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'sent'; error: string | null }>({ status: 'idle', error: null });
  if (profile && !profile.hasPassword) {
    return <SettingRow id="password" title="Password" description="You sign in with Google, so there’s no password to change here." />;
  }
  const send = async () => {
    if (!profile) return;
    setState({ status: 'sending', error: null });
    try { await authApi.forgotPassword({ email: profile.email }); setState({ status: 'sent', error: null }); }
    catch (err) { setState({ status: 'idle', error: err instanceof Error ? err.message : 'The email could not be sent. Try again in a few minutes.' }); }
  };
  const description = state.error ? <span className="ws-field-error" role="alert">{state.error}</span>
    : state.status === 'sent' ? <span role="status">We sent a link to {profile?.email}. It expires in 1 hour.</span>
      : 'We’ll email you a link to set a new password.';
  return (
    <SettingRow id="password" title="Password" description={description}>
      <button type="button" className="ws-btn ws-btn-small" disabled={!profile || state.status === 'sending'} onClick={() => void send()}>
        {state.status === 'sending' ? 'Sending…' : state.status === 'sent' ? 'Send again' : 'Send reset link'}
      </button>
    </SettingRow>
  );
}
