import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Users, UserPlus, Loader2, AlertCircle } from "lucide-react";
import { usersApi, type OrganizationMember } from "@/lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

function memberInitials(m: OrganizationMember): string {
  if (m.name?.trim()) {
    return m.name
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }
  const local = m.email.split("@")[0] || "?";
  return local.slice(0, 2).toUpperCase();
}

function formatPlanTier(tier: string): string {
  return tier.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OrganizationScreen() {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [removeTarget, setRemoveTarget] = useState<OrganizationMember | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const orgQuery = useQuery({
    queryKey: ["users", "organization"],
    queryFn: async () => {
      const res = await usersApi.getOrganizationInfo();
      return res.data;
    },
  });

  const membersQuery = useQuery({
    queryKey: ["users", "organization", "members"],
    queryFn: async () => {
      const res = await usersApi.getOrganizationMembers();
      return res.data;
    },
    enabled: !!orgQuery.data?.organization,
  });

  const slotsQuery = useQuery({
    queryKey: ["users", "organization", "slots"],
    queryFn: async () => {
      const res = await usersApi.getRemainingSlots();
      return res.data;
    },
    enabled: !!orgQuery.data?.organization,
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => usersApi.inviteMemberByEmail(email),
    onSuccess: async () => {
      setInviteEmail("");
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["users", "organization"] });
      await queryClient.invalidateQueries({ queryKey: ["users", "organization", "members"] });
      await queryClient.invalidateQueries({ queryKey: ["users", "organization", "slots"] });
    },
    onError: (err: Error) => {
      setFormError(err.message || "Could not add member");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => usersApi.removeMember(userId),
    onSuccess: async () => {
      setRemoveTarget(null);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["users", "organization"] });
      await queryClient.invalidateQueries({ queryKey: ["users", "organization", "members"] });
      await queryClient.invalidateQueries({ queryKey: ["users", "organization", "slots"] });
    },
    onError: (err: Error) => {
      setFormError(err.message || "Could not remove member");
    },
  });

  const hasOrg = !!orgQuery.data?.organization;
  const loading =
    orgQuery.isLoading || (hasOrg && (membersQuery.isLoading || slotsQuery.isLoading));
  const orgInfo = orgQuery.data;
  const members = membersQuery.data ?? [];
  const slots = slotsQuery.data;

  const userLimit = orgInfo?.planLimits.userLimit ?? orgInfo?.userSlots.limit ?? 1;
  const isUnlimited = userLimit === -1;
  const atCap = !isUnlimited && userLimit > 0 && (slots?.remaining ?? 0) <= 0;
  const canInviteMore = isUnlimited || (!atCap && userLimit > 1);
  const soloLike = !isUnlimited && userLimit <= 1;

  if (orgQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load organization</AlertTitle>
        <AlertDescription>{(orgQuery.error as Error)?.message || "Please try again later."}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="glass rounded-xl border border-border p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Loading organization…</p>
      </div>
    );
  }

  if (!orgInfo) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-xl border border-border p-6">
          <div className="flex items-start gap-3">
            <Users className="h-10 w-10 text-muted-foreground shrink-0" />
            <div>
              <h2 className="text-lg font-medium text-foreground mb-1">Organization</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Your account is not linked to a shared organization yet. Team plans include a shared workspace and multiple
                seats.
              </p>
              <Link href="/pricing">
                <Button variant="default">View plans</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { organization, userSlots } = orgInfo;

  return (
    <div className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="glass rounded-xl border border-border p-6">
        <h2 className="text-lg font-medium text-foreground mb-1">Workspace</h2>
        <p className="text-sm text-muted-foreground mb-4">{organization.name}</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Plan </span>
            <span className="font-medium text-foreground">{formatPlanTier(organization.planTier)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Infographics / month </span>
            <span className="font-medium text-foreground">{organization.monthlyLimit}</span>
          </div>
        </div>
        <Separator className="my-4 bg-border" />
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-foreground">Team seats</span>
            {isUnlimited ? (
              <span className="text-sm text-muted-foreground">Unlimited</span>
            ) : (
              <span className="text-sm text-foreground">
                {userSlots.current} / {userSlots.limit} used
                {userSlots.remaining > 0 ? (
                  <span className="text-muted-foreground"> ({userSlots.remaining} remaining)</span>
                ) : null}
              </span>
            )}
          </div>
          {!isUnlimited && userSlots.limit > 0 && (
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (userSlots.current / userSlots.limit) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
        {atCap && (
          <Alert className="mt-4 border-amber-500/40 bg-amber-500/5">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 dark:text-amber-200">Seat limit reached</AlertTitle>
            <AlertDescription className="text-amber-900/90 dark:text-amber-100/90">
              Your {formatPlanTier(organization.planTier)} plan allows up to {userSlots.limit} team members. Remove someone
              below or upgrade on the Billing page to add more people.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="glass rounded-xl border border-border p-6">
        <h2 className="text-lg font-medium text-foreground mb-1">Members</h2>
        <p className="text-sm text-muted-foreground mb-4">
          People who share this workspace. Adding someone requires an existing account with us.
        </p>

        {soloLike && (
          <Alert className="mb-4">
            <AlertTitle>Solo workspace</AlertTitle>
            <AlertDescription>
              Your current plan includes one seat. Upgrade to Team for up to 5 members and shared templates.
              <Link href="/pricing" className="block mt-2">
                <Button variant="outline" size="sm">
                  Compare plans
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <ul className="space-y-3">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs">{memberInitials(m)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.name || m.email}</p>
                  {m.name ? <p className="text-xs text-muted-foreground truncate">{m.email}</p> : null}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive shrink-0"
                disabled={removeMutation.isPending}
                onClick={() => setRemoveTarget(m)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>

        {!soloLike && (
          <>
            <Separator className="my-6 bg-border" />
            <div className="space-y-3">
              <Label htmlFor="invite-email" className="text-foreground">
                Add member by email
              </Label>
              <p className="text-xs text-muted-foreground">
                They must already have registered. We&apos;ll attach their account to this organization.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <Input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  disabled={!canInviteMore || inviteMutation.isPending}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setFormError(null);
                  }}
                  className="bg-input-background border-border text-foreground flex-1"
                />
                <Button
                  type="button"
                  disabled={!canInviteMore || inviteMutation.isPending || !inviteEmail.trim()}
                  onClick={() => inviteMutation.mutate(inviteEmail.trim())}
                  className="shrink-0 gap-2"
                >
                  {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Add
                </Button>
              </div>
              {!canInviteMore && !soloLike && atCap && (
                <p className="text-sm text-destructive">
                  You cannot add more members until you free a seat or upgrade your plan.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from organization?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.email} will leave this workspace. They keep their personal account and designs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
            >
              {removeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
