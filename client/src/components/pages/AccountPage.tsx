import { useState } from "react";
import { User, Mail, Bell, Lock, CreditCard, LogOut, BarChart3 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { SecurityScreen } from "../account/SecurityScreen";
import { BillingScreen } from "../account/BillingScreen";
import { UsageScreen } from "../account/UsageScreen";
import { useAuth } from "@/lib/auth";
import { SubscriptionCard, PaymentHistory } from "../payment";

type AccountSection = "profile" | "notifications" | "security" | "billing" | "usage";

export function AccountPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<AccountSection>("profile");
  
  const displayName = user?.name || user?.email?.split('@')[0] || "User";
  const displayEmail = user?.email || "";
  const initials = displayName.split(" ").map((name) => name.charAt(0).toUpperCase()).slice(0, 2).join("");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-white">Account Settings</h1>
          <p className="text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarFallback className="bg-white/10 text-white text-xl">{initials}</AvatarFallback>
                </Avatar>
                <h3 className="mb-1 text-white">{displayName}</h3>
                <p className="text-sm text-gray-400">{displayEmail}</p>
              </div>
              <Separator className="mb-4 bg-white/10" />
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveSection("profile")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "profile" 
                      ? "bg-white/10 text-white font-medium" 
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  <User className={`w-4 h-4 ${activeSection === "profile" ? "text-white" : "text-gray-400"}`} />
                  <span className="text-sm">Profile</span>
                </button>
                <button 
                  onClick={() => setActiveSection("notifications")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "notifications" 
                      ? "bg-white/10 text-white font-medium" 
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  <Bell className={`w-4 h-4 ${activeSection === "notifications" ? "text-white" : "text-gray-400"}`} />
                  <span className="text-sm">Notifications</span>
                </button>
                <button 
                  onClick={() => setActiveSection("security")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "security" 
                      ? "bg-white/10 text-white font-medium" 
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  <Lock className={`w-4 h-4 ${activeSection === "security" ? "text-white" : "text-gray-400"}`} />
                  <span className="text-sm">Security</span>
                </button>
                <button 
                  onClick={() => setActiveSection("billing")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "billing" 
                      ? "bg-white/10 text-white font-medium" 
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  <CreditCard className={`w-4 h-4 ${activeSection === "billing" ? "text-white" : "text-gray-400"}`} />
                  <span className="text-sm">Billing</span>
                </button>
                <button 
                  onClick={() => setActiveSection("usage")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === "usage" 
                      ? "bg-white/10 text-white font-medium" 
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  <BarChart3 className={`w-4 h-4 ${activeSection === "usage" ? "text-white" : "text-gray-400"}`} />
                  <span className="text-sm">Usage</span>
                </button>
              </nav>
              <Separator className="my-4 bg-white/10" />
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-red-500/10">
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
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                  <h2 className="mb-4 text-white font-medium">Profile Information</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                        <Input id="firstName" defaultValue="John" className="bg-white/5 border-white/10 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                        <Input id="lastName" defaultValue="Doe" className="bg-white/5 border-white/10 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                      <Input id="email" type="email" defaultValue="john.doe@example.com" className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-gray-300">Bio</Label>
                      <textarea
                        id="bio"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <Button className="bg-white text-black hover:bg-gray-100">Save Changes</Button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-red-500/20 p-6">
                  <h2 className="mb-2 text-destructive font-medium">Danger Zone</h2>
                  <p className="text-sm text-gray-400 mb-4">
                    Irreversible actions that will affect your account
                  </p>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start text-red-400 border-red-500/20 hover:bg-red-500/10">
                      Delete All Designs
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-red-400 border-red-500/20 hover:bg-red-500/10">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                <h2 className="mb-4 text-white font-medium">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Email Notifications</p>
                      <p className="text-sm text-gray-400">
                        Receive email updates about your projects
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Marketing Emails</p>
                      <p className="text-sm text-gray-400">
                        Receive tips, updates, and special offers
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Push Notifications</p>
                      <p className="text-sm text-gray-400">
                        Get notified about important updates
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Auto-save Notifications</p>
                      <p className="text-sm text-gray-400">
                        Show notification when work is auto-saved
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "security" && <SecurityScreen />}
            
            {activeSection === "billing" && <BillingScreen />}
            
            {activeSection === "usage" && <UsageScreen />}
          </div>
        </div>
      </div>
    </div>
  );
}
