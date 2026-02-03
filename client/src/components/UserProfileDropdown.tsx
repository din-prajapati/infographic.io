/**
 * User Profile Dropdown Component
 * Displays user avatar (profile image when available, otherwise initials) with dropdown menu for account options
 */

import { useState, useRef, useEffect } from "react";
import { Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

interface UserProfileDropdownProps {
  userName?: string;
  userEmail?: string;
  userInitials?: string;
  /** Profile image URL when available (e.g. from OAuth or account settings) */
  profileImageUrl?: string;
  avatarColor?: string;
  currentPlan?: string;
  onAccountSettingsClick?: () => void;
  onSignOutClick?: () => void;
}

export function UserProfileDropdown({
  userName,
  userEmail,
  userInitials,
  profileImageUrl: profileImageUrlProp,
  avatarColor = "from-blue-500 to-indigo-600",
  currentPlan = "Basic",
  onAccountSettingsClick,
  onSignOutClick,
}: UserProfileDropdownProps) {
  const { user, logout } = useAuth();
  // Support profile image from props or from user object (e.g. user.imageUrl when API adds it)
  const profileImageUrl = profileImageUrlProp ?? (user as { imageUrl?: string })?.imageUrl ?? (user as { picture?: string })?.picture;
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Use auth user data if available, otherwise use props
  const displayName = userName || user?.name || user?.email?.split('@')[0] || "User";
  const displayEmail = userEmail || user?.email || "";
  
  // Calculate initials from userName if not provided
  const initials =
    userInitials ||
    displayName
      .split(" ")
      .map((name) => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener(
        "mousedown",
        handleClickOutside,
      );
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleAccountSettingsClick = () => {
    setIsOpen(false);
    if (onAccountSettingsClick) {
      onAccountSettingsClick();
    } else {
      setLocation('/account');
    }
  };

  const handleSignOutClick = () => {
    setIsOpen(false);
    if (onSignOutClick) {
      onSignOutClick();
    } else {
      logout();
      setLocation('/auth');
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button - Profile image when available, otherwise initials */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
        aria-label="Open profile menu"
      >
        <Avatar className="w-10 h-10">
          {profileImageUrl ? (
            <AvatarImage src={profileImageUrl} alt={displayName} className="object-cover" />
          ) : null}
          <AvatarFallback className={`bg-gradient-to-br ${avatarColor} text-white text-sm font-medium`}>
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          >
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-start gap-3">
                {/* Avatar - profile image when available, otherwise initials */}
                <Avatar className={`w-10 h-10 flex-shrink-0`}>
                  {profileImageUrl ? (
                    <AvatarImage src={profileImageUrl} alt={displayName} className="object-cover" />
                  ) : null}
                  <AvatarFallback className={`bg-gradient-to-br ${avatarColor} text-white text-sm font-medium`}>
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-gray-500 text-sm truncate">
                    {displayEmail}
                  </p>

                  {/* Current Plan Badge */}
                  <div className="mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                      {currentPlan}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {/* Account Settings */}
              <button
                onClick={handleAccountSettingsClick}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                <span>Account settings</span>
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-gray-200" />

              {/* Log Out */}
              <button
                onClick={handleSignOutClick}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}