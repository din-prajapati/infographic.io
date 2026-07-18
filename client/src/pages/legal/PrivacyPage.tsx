import { Link } from "wouter";
import { Building2 } from "lucide-react";

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
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          &copy; {new Date().getFullYear()} Buildographic. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <LegalNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <article className="prose prose-stone prose-headings:font-display max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Effective date: 8 July 2026</p>

          <p>
            Buildographic (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed
            to protecting your privacy. This Privacy Policy explains how we collect, use, store, and
            share your personal information when you use our service.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect the following categories of information:</p>
          <ul>
            <li>
              <strong>Account data:</strong> Name, email address, and organisation name provided
              during registration. If you sign in with Google, we receive your name, email address,
              and profile picture from Google.
            </li>
            <li>
              <strong>Listing content:</strong> Property descriptions, addresses, and images you
              provide when creating infographics.
            </li>
            <li>
              <strong>Usage data:</strong> Features used, pages visited, infographics generated,
              and timestamps of interactions.
            </li>
            <li>
              <strong>Device and browser data:</strong> IP address, browser type, operating system,
              and referring URLs, collected via server logs and analytics.
            </li>
            <li>
              <strong>Communication data:</strong> Emails or support messages you send to us.
            </li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide, maintain, and improve the Buildographic service.</li>
            <li>Process subscription payments and manage billing.</li>
            <li>Send transactional emails such as receipts and password reset links.</li>
            <li>Respond to your support requests.</li>
            <li>Monitor usage against plan limits and prevent abuse.</li>
            <li>
              Comply with legal obligations and enforce our Terms of Service.
            </li>
          </ul>
          <p>
            We do not use your data for advertising purposes and do not sell your personal
            information to third parties.
          </p>

          <h2>3. Payment Processing</h2>
          <p>
            Subscription payments are processed by <strong>RazorPay</strong>, a PCI-DSS compliant
            payment gateway. When you subscribe to a paid plan, your payment card details are
            entered directly into RazorPay&apos;s secure checkout. <strong>We do not store, see, or
            have access to your full card number, CVV, or banking credentials.</strong> We only
            receive a transaction reference, subscription status, and the last four digits of your
            card for display purposes.
          </p>
          <p>
            RazorPay&apos;s privacy practices are governed by the&nbsp;
            <a
              href="https://razorpay.com/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              RazorPay Privacy Policy
            </a>.
          </p>

          <h2>4. AI Processing of Your Content</h2>
          <p>
            To generate infographics, listing text and images you provide are processed by our
            AI providers. These providers receive the content you submit solely to produce the
            requested visual output. We do not identify individual AI providers publicly as part
            of our model-opacity policy.
          </p>
          <p>
            AI providers are contractually obligated to handle your data in accordance with
            applicable data protection laws and are not permitted to use your listing content to
            train their own models.
          </p>

          <h2>5. Data Sharing</h2>
          <p>We share your information only with:</p>
          <ul>
            <li>
              <strong>Payment processor (RazorPay):</strong> For subscription management.
            </li>
            <li>
              <strong>AI providers:</strong> To generate infographic output from your listing data.
            </li>
            <li>
              <strong>Cloud infrastructure providers:</strong> Hosting and database services that
              store your account data and generated content.
            </li>
            <li>
              <strong>Analytics and monitoring tools:</strong> To detect errors and measure
              performance (data is anonymised or pseudonymised where possible).
            </li>
            <li>
              <strong>Legal authorities:</strong> Where required by law or court order.
            </li>
          </ul>

          <h2>6. Data Storage and Security</h2>
          <p>
            Your account data is stored on servers located in cloud data centres. We implement
            industry-standard security measures including encryption in transit (TLS) and at rest,
            access controls, and regular security reviews. No method of transmission or storage is
            100% secure; we cannot guarantee absolute security.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. If you delete your
            account, we will delete or anonymise your personal data within 30 days, except where
            we are required to retain it for legal or regulatory purposes (such as financial
            records, which are retained for the period required by Indian law).
          </p>

          <h2>8. Your Rights</h2>
          <p>
            You have the right to access, correct, or request deletion of your personal data.
            To exercise these rights, contact us at&nbsp;
            <a href="mailto:privacy@infographicai.in">privacy@infographicai.in</a>. We will
            respond to requests within 30 days.
          </p>

          <h2>9. Cookies</h2>
          <p>
            We use strictly necessary cookies and local storage tokens for authentication (JWT) and
            session management. We do not use third-party advertising cookies.
          </p>

          <h2>10. Children&apos;s Privacy</h2>
          <p>
            The service is not directed to children under 18 years of age. We do not knowingly
            collect personal information from children.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes via email or in-app notification at least 7 days before the change takes
            effect.
          </p>

          <h2>12. Contact</h2>
          <p>
            For questions or concerns about this Privacy Policy, contact us at&nbsp;
            <a href="mailto:privacy@infographicai.in">privacy@infographicai.in</a>.
          </p>
        </article>
      </main>

      <LegalFooter />
    </div>
  );
}
