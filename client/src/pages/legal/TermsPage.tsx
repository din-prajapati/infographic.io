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

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <LegalNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <article className="prose prose-stone prose-headings:font-display max-w-none">
          <h1>Terms of Service</h1>
          <p className="text-gray-500 text-sm">Effective date: 8 July 2026</p>

          <p>
            Welcome to InfographicAI. By accessing or using our service you agree to be bound by
            these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, please do not use
            the service.
          </p>

          <h2>1. Description of Service</h2>
          <p>
            InfographicAI is an AI-powered tool that converts real estate listing information into
            visual infographics. The service is provided on a subscription basis as described on
            our&nbsp;<Link href="/pricing" className="text-primary hover:underline">Pricing</Link>&nbsp;page.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 18 years of age and have the legal capacity to enter into binding
            agreements under the laws of India. By using the service you represent that you meet
            these requirements.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activity that occurs under your account. Notify us immediately at&nbsp;
            <a href="mailto:support@infographicai.in">support@infographicai.in</a> if you suspect
            unauthorised access.
          </p>

          <h2>4. Subscription and Billing</h2>
          <p>
            Paid plans are billed in Indian Rupees (INR) on a monthly or annual basis via RazorPay.
            Your subscription renews automatically at the end of each billing period unless you
            cancel before the renewal date. Prices are inclusive of applicable taxes.
          </p>
          <p>
            You authorise us to charge your payment method for the applicable fees. If a payment
            fails, we may suspend your access until the outstanding amount is settled.
          </p>

          <h2>5. Cancellation</h2>
          <p>
            You may cancel your subscription at any time from your account settings. Upon
            cancellation, you retain access to paid features until the end of your current billing
            period. No partial refunds are issued for unused time within a paid period except as
            stated in our&nbsp;
            <Link href="/refund-policy" className="text-primary hover:underline">
              Refund &amp; Cancellation Policy
            </Link>.
          </p>

          <h2>6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any unlawful purpose or in violation of any regulations.</li>
            <li>
              Upload content that is defamatory, obscene, or infringes third-party intellectual
              property rights.
            </li>
            <li>Attempt to reverse-engineer, decompile, or disassemble any part of the service.</li>
            <li>
              Use automated means to access the service in a manner that exceeds normal human usage
              without prior written permission.
            </li>
          </ul>

          <h2>7. Intellectual Property</h2>
          <p>
            InfographicAI and its licensors retain all intellectual property rights in the service,
            including software, templates, and AI models. You retain ownership of any original
            listing data you provide. You grant us a limited licence to use that data solely to
            provide the service to you.
          </p>
          <p>
            Infographics generated by the service may be used by you for lawful commercial purposes.
            We do not claim ownership of generated outputs.
          </p>

          <h2>8. AI-Generated Content</h2>
          <p>
            Outputs are generated using AI providers and may occasionally contain inaccuracies.
            You are responsible for reviewing all generated content before publication. InfographicAI
            does not guarantee the accuracy, completeness, or fitness for any particular purpose of
            AI-generated outputs.
          </p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, whether express or implied, including but not limited to
            warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, InfographicAI and its directors,
            employees, and agents shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising from your use of or inability to use the
            service, even if we have been advised of the possibility of such damages.
          </p>
          <p>
            Our total aggregate liability to you for any claim arising out of or relating to these
            Terms shall not exceed the total fees paid by you to us in the three months preceding
            the event giving rise to the claim.
          </p>

          <h2>11. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account without notice if you violate
            these Terms or if we reasonably believe your use poses a risk to other users or to the
            service. You may terminate your account at any time by cancelling your subscription and
            deleting your account from settings.
          </p>

          <h2>12. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes arising from these Terms
            shall be subject to the exclusive jurisdiction of the courts located in Bengaluru,
            Karnataka, India.
          </p>

          <h2>13. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes via
            email or in-app notification. Continued use of the service after the effective date of
            the updated Terms constitutes your acceptance.
          </p>

          <h2>14. Contact</h2>
          <p>
            For questions about these Terms, contact us at&nbsp;
            <a href="mailto:support@infographicai.in">support@infographicai.in</a>.
          </p>
        </article>
      </main>

      <LegalFooter />
    </div>
  );
}
