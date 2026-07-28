import { renderEmailLayout } from './layout';

export interface PaymentReceiptData {
  userName: string;
  planTier: string;
  billingPeriod: string;
  amountInRupees: number;
  paymentDate: string;
  paymentId: string;
  orgName: string;
}

export function paymentReceiptTemplate(data: PaymentReceiptData): { subject: string; html: string } {
  return {
    subject: `Payment receipt — ${data.planTier} plan`,
    html: renderEmailLayout({
      bodyHtml: `<p>Dear ${data.userName},</p>
<p>Thank you for subscribing to Buildographic. Here are your payment details:</p>
<ul>
  <li><strong>Plan:</strong> ${data.planTier}</li>
  <li><strong>Billing period:</strong> ${data.billingPeriod}</li>
  <li><strong>Amount:</strong> &#x20B9;${data.amountInRupees.toLocaleString('en-IN')}</li>
  <li><strong>Date:</strong> ${data.paymentDate}</li>
  <li><strong>Payment ID:</strong> ${data.paymentId}</li>
  <li><strong>Organisation:</strong> ${data.orgName}</li>
</ul>
<p>If you have any questions, please contact our support team.</p>`,
    }),
  };
}
