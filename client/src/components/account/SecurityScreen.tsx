import { Shield, Clock, CheckCircle2, AlertTriangle, Smartphone, Lock, Key } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";

const loginHistory = [
  { id: 1, device: "Chrome on MacBook Pro", location: "San Francisco, CA", time: "Nov 29, 04:45:49 PM", status: "success" },
  { id: 2, device: "Safari on iPhone 14", location: "San Francisco, CA", time: "Nov 29, 04:40:08 PM", status: "success" },
  { id: 3, device: "Chrome on Windows", location: "New York, NY", time: "Nov 28, 01:45:33 PM", status: "failed" },
  { id: 4, device: "Safari on iPad Air", location: "San Francisco, CA", time: "Nov 28, 01:39:31 PM", status: "success" },
  { id: 5, device: "Firefox on MacBook", location: "Los Angeles, CA", time: "Nov 27, 05:51:08 PM", status: "success" },
  { id: 6, device: "Chrome on MacBook Pro", location: "San Francisco, CA", time: "Nov 27, 05:38:42 PM", status: "success" },
  { id: 7, device: "Safari on iPhone 14", location: "Oakland, CA", time: "Nov 27, 05:33:20 PM", status: "success" },
  { id: 8, device: "Chrome on MacBook Pro", location: "San Francisco, CA", time: "Nov 27, 04:11:45 PM", status: "success" },
];

export function SecurityScreen() {
  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <div className="glass rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Two-Factor Authentication</h2>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium text-foreground">Two-factor authentication is enabled</h3>
                <Badge className="bg-success/15 text-success hover:bg-success/15 border-success/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Protect your account with an extra layer of security. You'll need to enter a code from your authenticator app when signing in.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="border-border text-foreground">
                  Configure
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  Disable
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="glass rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Password</h2>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-1 text-foreground">Update your password</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Last changed 3 months ago
              </p>
              <p className="text-sm text-muted-foreground">
                Make sure it's at least 8 characters including a number and a lowercase letter.
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-sm text-muted-foreground">
                Current Password
              </Label>
              <Input 
                id="current-password" 
                type="password" 
                placeholder="Enter current password"
                className="bg-input-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm text-muted-foreground">
                New Password
              </Label>
              <Input 
                id="new-password" 
                type="password" 
                placeholder="Enter new password"
                className="bg-input-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm text-muted-foreground">
                Confirm New Password
              </Label>
              <Input 
                id="confirm-password" 
                type="password" 
                placeholder="Confirm new password"
                className="bg-input-background border-border text-foreground"
              />
            </div>

            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Update Password</Button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="glass rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Active Sessions</h2>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              Sign out all devices
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {loginHistory.slice(0, 3).map((session, index) => (
              <div 
                key={session.id}
                className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{session.device}</p>
                      <p className="text-sm text-muted-foreground">{session.location}</p>
                    </div>
                    {index === 0 && (
                      <Badge variant="secondary" className="bg-success/15 text-success hover:bg-success/15 border-success/20">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{session.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login History */}
      <div className="glass rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Login History</h2>
          <p className="text-sm text-muted-foreground mt-1">View all login attempts on your account</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loginHistory.map((login) => (
                <tr key={login.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {login.status === "success" ? (
                      <Badge className="bg-success/15 text-success hover:bg-success/15 border-success/20">
                        Success
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15 border-destructive/20">
                        Failed
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{login.device}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-muted-foreground">{login.location}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-muted-foreground">{login.time}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing 8 of 8 entries</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="border-border">
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled className="border-border">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
