import { useState } from "react";
import { User, Mail, Bell, Lock, CreditCard, LogOut, BarChart3, Palette, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { SecurityScreen } from "../account/SecurityScreen";
import { BillingScreen } from "../account/BillingScreen";
import { UsageScreen } from "../account/UsageScreen";
import { AppearanceScreen } from "../account/AppearanceScreen";
import { OrganizationScreen } from "../account/OrganizationScreen";
import { useAuth } from "@/lib/auth";
import { SubscriptionCard, PaymentHistory } from "../payment";

type AccountSection = "profile" | "notifications" | "appearance" | "organization" | "security" | "billing" | "usage";

export function AccountPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AccountSection>("profile");
  
  const displayName = user?.name || user?.email?.split('@')[0] || "User";
  const displayEmail = user?.email || "";
  const initials = displayName.split(" ").map((name) => name.charAt(0).toUpperCase()).slice(0, 2).join("");

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-foreground">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-xl border border-border p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarFallback className="bg-primary/20 text-primary text-xl">{initials}</AvatarFallback>
                </Avatar>
                <h3 className="mb-1 text-foreground">{displayName}</h3>
                <p className="text-sm text-muted-foreground">{displayEmail}</p>
              </div>
              <Separator className="mb-4 bg-border" />
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveSection("profile")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "profile" 
                      ? "bg-primary/10 text-foreground font-medium" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className={`w-4 h-4 ${activeSection === "profile" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm">Profile</span>
                </button>
                <button 
                  onClick={() => setActiveSection("notifications")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "notifications" 
                      ? "bg-primary/10 text-foreground font-medium" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bell className={`w-4 h-4 ${activeSection === "notifications" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm">Notifications</span>
                </button>
                <button 
                  onClick={() => setActiveSection("appearance")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "appearance" 
                      ? "bg-primary/10 text-foreground font-medium" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Palette className={`w-4 h-4 ${activeSection === "appearance" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm">Appearance</span>
                </button>
                <button 
                  onClick={() => setActiveSection("organization")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "organization" 
                      ? "bg-primary/10 text-foreground font-medium" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className={`w-4 h-4 ${activeSection === "organization" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm">Organization</span>
                </button>
                <button 
                  onClick={() => setActiveSection("security")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "security" 
                      ? "bg-primary/10 text-foreground font-medium" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Lock className={`w-4 h-4 ${activeSection === "security" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm">Security</span>
                </button>
                <button 
                  onClick={() => setActiveSection("billing")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "billing" 
                      ? "bg-primary/10 text-foreground font-medium" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CreditCard className={`w-4 h-4 ${activeSection === "billing" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm">Billing</span>
                </button>
                <button 
                  onClick={() => setActiveSection("usage")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "usage" 
                      ? "bg-primary/10 text-foreground font-medium" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BarChart3 className={`w-4 h-4 ${activeSection === "usage" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm">Usage</span>
                </button>
              </nav>
              <Separator className="my-4 bg-border" />
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeSection === "profile" && (
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="glass rounded-xl border border-border p-6">
                  <h2 className="mb-4 text-foreground font-medium">Profile Information</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-muted-foreground">First Name</Label>
                        <Input id="firstName" defaultValue="John" className="bg-input-background border-border text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-muted-foreground">Last Name</Label>
                        <Input id="lastName" defaultValue="Doe" className="bg-input-background border-border text-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                      <Input id="email" type="email" defaultValue="john.doe@example.com" className="bg-input-background border-border text-foreground" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-muted-foreground">Bio</Label>
                      <textarea
                        id="bio"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border bg-input-background border-border text-foreground placeholder:text-muted-foreground resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="glass rounded-xl border border-border p-6">
                  <h2 className="mb-2 text-destructive font-medium">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Irreversible actions that will affect your account
                  </p>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10">
                      Delete All Designs
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="glass rounded-xl border border-border p-6">
                <h2 className="mb-4 text-foreground font-medium">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your projects
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Marketing Emails</p>
                      <p className="text-sm text-muted-foreground">
                        Receive tips, updates, and special offers
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified about important updates
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Auto-save Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Show notification when work is auto-saved
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "appearance" && <AppearanceScreen />}

            {activeSection === "organization" && <OrganizationScreen />}

            {activeSection === "security" && <SecurityScreen />}
            
            {activeSection === "billing" && <BillingScreen />}
            
            {activeSection === "usage" && <UsageScreen />}
          </div>
        </div>
      </div>
    </div>
  );
}
