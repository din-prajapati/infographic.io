import { Link } from "wouter";
import { Building2 } from "lucide-react";

function LegalNav() {
  return (
    <nav className="border-b border-gray-200 bg-[#f5f5f0]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-black">
          <Building2 className="h-6 w-6" />
          <span>InfographicAI</span>
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
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          &copy; {new Date().getFullYear()} InfographicAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <LegalNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <article className="prose prose-stone prose-headings:font-display max-w-none">
          <h1>Refund &amp; Cancellation Policy</h1>
          <p className="text-gray-500 text-sm">Effective date: 8 July 2026</p>

          <p>
            This policy explains how subscriptions, cancellations, and refunds work for
            InfographicAI. Please read it carefully before purchasing a paid plan.
          </p>

          <h2>1. Subscription Model</h2>
          <p>
            InfographicAI offers paid plans billed in <strong>Indian Rupees (INR)</strong> on a
            <strong> monthly or annual</strong> basis. Subscriptions are managed through&nbsp;
            <strong>RazorPay</strong>, a PCI-DSS compliant payment gateway. Current plan pricing is
            shown on our&nbsp;
            <Link href="/pricing" className="text-primary hover:underline">Pricing</Link>&nbsp;page.
          </p>
          <p>
            Annual plans are billed as a single upfront payment covering 12 months and are offered
            at a discount compared to paying monthly. Monthly plans are billed on the same date each
            month.
          </p>

          <h2>2. Free Plan</h2>
          <p>
            The Free plan includes a limited number of infographic generations per month at no cost.
            No payment details are required for the Free plan, and no charges apply.
          </p>

          <h2>3. Cancellation</h2>
          <p>
            You may cancel your subscription at any time from your account settings. Cancellation
            takes effect at the end of your current billing period:
          </p>
          <ul>
            <li>
              <strong>Monthly plans:</strong> Access continues until the last day of the month you
              have paid for.
            </li>
            <li>
              <strong>Annual plans:</strong> Access continues until the last day of the 12-month
              period you have paid for.
            </li>
          </ul>
          <p>
            After the billing period ends, your account reverts to the Free plan. You will not be
            charged again after cancellation.
          </p>

          <h2>4. Refund Terms</h2>

          <h3>4.1 General Policy</h3>
          <p>
            Because our service delivers immediate value upon subscription activation (access to
            AI-powered generation and premium templates), <strong>we do not offer prorated refunds
            for unused time</strong> within a paid billing period when you cancel voluntarily.
          </p>

          <h3>4.2 Exceptions — When Refunds Apply</h3>
          <p>We will issue a full refund in the following circumstances:</p>
          <ul>
            <li>
              <strong>Duplicate charge:</strong> If you were billed more than once for the same
              subscription period due to a technical error.
            </li>
            <li>
              <strong>Technical failure at activation:</strong> If your payment was captured
              successfully but your account was never upgraded to the paid plan within 24 hours and
              you report the issue within 7 days of payment.
            </li>
            <li>
              <strong>Service unavailability:</strong> If the service was unavailable for more than
              72 consecutive hours during your paid period due to issues on our end and you request
              a refund within 14 days of the outage.
            </li>
          </ul>

          <h3>4.3 Refund Processing</h3>
          <p>
            Approved refunds are processed via RazorPay back to the original payment method. Please
            allow 5&ndash;10 business days for the refund to appear, depending on your bank.
          </p>

          <h2>5. Plan Upgrades and Downgrades</h2>
          <p>
            If you upgrade to a higher plan mid-cycle, you will be billed for the new plan at the
            next renewal. Access to the higher plan is granted immediately upon upgrade. Downgrading
            takes effect at the start of your next billing period.
          </p>

          <h2>6. How to Request a Refund</h2>
          <p>
            To request a refund, email us at&nbsp;
            <a href="mailto:billing@infographicai.in">billing@infographicai.in</a> with:
          </p>
          <ul>
            <li>Your registered email address</li>
            <li>The RazorPay payment or subscription ID</li>
            <li>A description of the issue</li>
          </ul>
          <p>
            We will acknowledge your request within 2 business days and aim to resolve it within
            7 business days.
          </p>

          <h2>7. Contact</h2>
          <p>
            For billing questions or to request a refund, contact&nbsp;
            <a href="mailto:billing@infographicai.in">billing@infographicai.in</a>.
          </p>
        </article>
      </main>

      <LegalFooter />
    </div>
  );
}
