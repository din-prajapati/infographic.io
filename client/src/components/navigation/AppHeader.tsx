import { Sparkles } from "lucide-react";
import { useLocation, Link } from "wouter";
import { UserProfileDropdown } from "../UserProfileDropdown";

interface AppHeaderProps {
  activeTab?: "templates" | "my-designs" | "account";
  onTabChange?: (tab: "templates" | "my-designs" | "account") => void;
}

export function AppHeader({ activeTab, onTabChange }: AppHeaderProps) {
  const [location] = useLocation();
  
  // Determine active tab from URL if not provided
  const currentTab = activeTab || (location.startsWith('/templates') ? 'templates' : location.startsWith('/my-designs') ? 'my-designs' : location.startsWith('/account') ? 'account' : 'templates');
  
  const handleTabChange = (tab: "templates" | "my-designs" | "account") => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="h-16 border-b border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo & Brand */}
        <Link href="/templates" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-lg">
            <span className="font-semibold text-white">Infograph</span>
            <span className="text-gray-500">.ai</span>
          </div>
        </Link>

        {/* Navigation Tabs + Profile: aligned to the right, nav immediately before profile */}
        <div className="flex items-center gap-6 ml-auto">
          <Link href="/templates">
            <button
              onClick={() => handleTabChange("templates")}
              className={`
                px-1 py-1 border-b-2 transition-colors text-sm
                ${
                  currentTab === "templates"
                    ? "border-white text-white font-medium"
                    : "border-transparent text-gray-400 hover:text-white"
                }
              `}
            >
              Templates
            </button>
          </Link>
          <Link href="/my-designs">
            <button
              onClick={() => handleTabChange("my-designs")}
              className={`
                px-1 py-1 border-b-2 transition-colors text-sm
                ${
                  currentTab === "my-designs"
                    ? "border-white text-white font-medium"
                    : "border-transparent text-gray-400 hover:text-white"
                }
              `}
            >
              My Designs
            </button>
          </Link>
          <Link href="/account">
            <button
              onClick={() => handleTabChange("account")}
              className={`
                px-1 py-1 border-b-2 transition-colors text-sm
                ${
                  currentTab === "account"
                    ? "border-white text-white font-medium"
                    : "border-transparent text-gray-400 hover:text-white"
                }
              `}
            >
              Account
            </button>
          </Link>
          {/* User Profile */}
          <UserProfileDropdown />
        </div>
      </div>
    </div>
  );
}
