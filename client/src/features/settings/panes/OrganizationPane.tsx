import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Loader2, UserPlus } from 'lucide-react';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usersApi, type OrganizationMember } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { accountInitials } from '../../workspace/navigation';
import { planName } from './UsagePane';
import { SettingRow, SettingSection, UsageMeter } from '../SettingsPrimitives';

const ORG_KEYS = [['users', 'organization'], ['users', 'organization', 'members'], ['users', 'organization', 'slots']] as const;

/**
 * Settings → Organization. Only what is built: organization name and plan, seats, the member list, add an existing
 * account by email, remove a member. (No roles, invitations by link or ownership transfer — none exist.)
 * You can't remove yourself here, so nobody locks themselves out of their own organization by accident.
 */
export default function OrganizationPane() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<OrganizationMember | null>(null);

  const org = useQuery({ queryKey: ORG_KEYS[0], queryFn: () => usersApi.getOrganizationInfo().then(response => response.data) });
  const hasOrg = Boolean(org.data?.organization);
  const members = useQuery({ queryKey: ORG_KEYS[1], queryFn: () => usersApi.getOrganizationMembers().then(response => response.data), enabled: hasOrg });
  const refresh = () => Promise.all(ORG_KEYS.map(queryKey => queryClient.invalidateQueries({ queryKey })));

  const add = useMutation({
    mutationFn: (address: string) => usersApi.inviteMemberByEmail(address),
    onSuccess: async () => { setEmail(''); setError(null); await refresh(); },
    onError: (err: Error) => setError(err.message || 'This person could not be added.'),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => usersApi.removeMember(userId),
    onSuccess: async () => { setRemoveTarget(null); setError(null); await refresh(); },
    onError: (err: Error) => { setRemoveTarget(null); setError(err.message || 'This member could not be removed.'); },
  });

  if (org.isLoading) return <div className="ws-skeleton st-pane-skeleton" aria-label="Loading organization" />;
  if (org.isError) {
    return (
      <div className="ws-alert ws-alert-error" role="alert">
        <span>Your organization could not be loaded.</span>
        <button type="button" className="ws-btn ws-btn-small" onClick={() => void org.refetch()}>Retry</button>
      </div>
    );
  }
  if (!org.data) {
    return (
      <SettingSection title="Organization">
        <SettingRow id="organization-seats" title="No shared organization" description="Your account works on its own. Team and Brokerage plans add an organization with several seats.">
          <Link href="/pricing" className="ws-btn ws-btn-small">View plans</Link>
        </SettingRow>
      </SettingSection>
    );
  }

  const { organization, userSlots, planLimits } = org.data;
  const seatLimit = planLimits?.userLimit ?? userSlots.limit;
  const unlimited = seatLimit === -1;
  const singleSeat = !unlimited && seatLimit <= 1;
  const full = !unlimited && userSlots.remaining <= 0;
  const list = members.data ?? [];

  return (
    <>
      <SettingSection title="Organization">
        <SettingRow title="Name" description="Shown to everyone in the organization.">
          <span className="st-value">{organization.name}</span>
        </SettingRow>
        <SettingRow title="Plan" description={`${organization.monthlyLimit === -1 ? 'Unlimited' : organization.monthlyLimit} designs a month, shared by everyone.`}>
          <span className="ws-pill ws-pill-green">{planName(organization.planTier)}</span>
        </SettingRow>
        <SettingRow id="organization-seats" title="Seats" description={singleSeat ? 'Your plan includes one seat. Team plans add up to 5.' : full ? 'All seats are in use. Remove someone or upgrade to add more.' : 'People your plan allows in this organization.'}>
          {unlimited ? <span className="st-value">{userSlots.current} used · Unlimited</span> : <UsageMeter label="Seats used" used={userSlots.current} limit={seatLimit} />}
          {(singleSeat || full) && <Link href="/pricing" className="ws-btn ws-btn-small">{singleSeat ? 'Compare plans' : 'Upgrade'}</Link>}
        </SettingRow>
      </SettingSection>

      <SettingSection title="Members">
        {error && <div className="ws-alert ws-alert-error" role="alert">{error}</div>}
        <div data-setting-id="organization-members" tabIndex={-1}>
          {members.isLoading ? <div className="ws-skeleton st-chart-skeleton" /> : (
            <ul className="st-members" aria-label="Members">
              {list.map(member => {
                const self = member.id === user?.id;
                return (
                  <li key={member.id} className="st-member">
                    <span className="st-avatar st-avatar-initials st-avatar-small" aria-hidden="true">{accountInitials(member.name ?? undefined, member.email)}</span>
                    <span className="st-member-text">
                      <span className="st-row-title">{member.name || member.email}{self && <span className="ws-pill st-you">You</span>}</span>
                      {member.name && <span className="st-row-desc">{member.email}</span>}
                    </span>
                    {!self && <button type="button" className="ws-btn ws-btn-small ws-btn-subtle ws-btn-danger" disabled={remove.isPending} onClick={() => setRemoveTarget(member)} aria-label={`Remove ${member.name || member.email}`}>Remove</button>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {!singleSeat && (
          <SettingRow id="add-member" title={<label htmlFor="st-add-member">Add member</label>} description="They need a Buildographic account already. We’ll add it to this organization.">
            <form className="st-inline-form" onSubmit={event => { event.preventDefault(); if (email.trim()) add.mutate(email.trim()); }}>
              <input id="st-add-member" className="st-input" type="email" autoComplete="off" placeholder="colleague@company.com" value={email}
                disabled={full || add.isPending} onChange={event => { setEmail(event.target.value); setError(null); }} />
              <button type="submit" className="ws-btn ws-btn-small ws-btn-primary" disabled={full || add.isPending || !email.trim()}>
                {add.isPending ? <Loader2 className="st-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}Add
              </button>
            </form>
          </SettingRow>
        )}
      </SettingSection>

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={open => { if (!open) setRemoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name || removeTarget?.email}?</AlertDialogTitle>
            <AlertDialogDescription>They leave this organization but keep their personal account and designs.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Keep</AlertDialogCancel>
            <button type="button" className="ws-btn ws-btn-danger" disabled={remove.isPending} onClick={() => removeTarget && remove.mutate(removeTarget.id)}>
              {remove.isPending ? <Loader2 className="st-spin" aria-hidden="true" /> : 'Remove'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
