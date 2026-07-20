import { Link } from "wouter";
import { Building2 } from "lucide-react";
import type { ReactNode } from "react";

function LegalNav() {
  return (
    <nav className="border-b border-gray-200 bg-[#f5f5f0]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-black">
          <Building2 className="h-6 w-6" />
          <span>Buildographic</span>
        </Link>
        <Link href="/" className="text-sm text-gray-600 hover:text-black transition-colors">
          &larr; Back to Home
        </Link>
      </div>
    </nav>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-gray-200 py-6 mt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-black transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-black transition-colors">
            Privacy Policy
          </Link>
          <Link href="/refund-policy" className="hover:text-black transition-colors">
            Refund &amp; Cancellation Policy
          </Link>
          <Link href="/cookies" className="hover:text-black transition-colors">
            Cookie Policy
          </Link>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          &copy; {new Date().getFullYear()} Buildographic. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function LegalLayout({
  title,
  effectiveDate,
  intro,
  children,
}: {
  title: string;
  effectiveDate: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f0] text-gray-900">
      <LegalNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <article className="max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-500 text-sm mb-6">Effective date: {effectiveDate}</p>
          {intro ? <p className="text-gray-700 leading-relaxed mb-8">{intro}</p> : null}
          {children}
        </article>
      </main>

      <LegalFooter />
    </div>
  );
}
