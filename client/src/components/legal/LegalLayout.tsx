import { Link } from "wouter";
import type { ReactNode } from "react";

function LegalNav() {
  return (
    <nav className="border-b border-gray-200 bg-[#f5f5f0]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex flex-col items-center justify-center leading-none">
          <img src="/logo-icon-option6.png" alt="" className="h-10 w-10" />
          <span className="text-xs leading-none font-extrabold tracking-tight text-black mt-0.5">Buildographic</span>
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

export function PolicyContactCard({
  email,
  responseTime,
  website = "https://buildographic.com",
}: {
  email: string;
  responseTime: string;
  website?: string;
}) {
  return (
    <div className="mt-12 mb-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Questions about this policy?</h3>
      <p className="text-gray-600 mb-6">We typically respond within {responseTime}.</p>
      <div className="text-gray-700 space-y-1">
        <p>
          <span className="font-medium text-gray-900">Website:</span> {website}
        </p>
        <p>
          <span className="font-medium text-gray-900">Email:</span> {email}
        </p>
      </div>
    </div>
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
