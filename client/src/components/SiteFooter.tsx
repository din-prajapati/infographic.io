import { Link } from "wouter";

/**
 * Minimal legal-links footer bar used on pages that have no full-page footer
 * (AuthPage). LandingPage and PricingPage carry their own full footers with
 * additional columns — this component adds the three required legal links to
 * those pages' Company column and to any page that needs a standalone strip.
 */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={`border-t border-gray-200 bg-transparent py-5 ${className ?? ""}`.trim()}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/refund-policy" className="hover:text-foreground transition-colors">
            Refund &amp; Cancellation Policy
          </Link>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          &copy; {new Date().getFullYear()} InfographicAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
