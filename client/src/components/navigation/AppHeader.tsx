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
    <div className="h-16 border-b border-border glass relative z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo & Brand */}
        <Link href="/templates" className="flex items-center gap-2">
          <img src="/logo-icon-option6.png" alt="" className="h-8 w-8" />
          <span className="text-lg font-semibold text-foreground">Buildographic</span>
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
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
