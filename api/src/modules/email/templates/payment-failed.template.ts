import { renderEmailLayout } from './layout';

export interface PaymentFailedData {
  userName: string;
  planTier: string;
  amountInRupees: number;
  paymentId: string;
}

export function paymentFailedTemplate(data: PaymentFailedData): { subject: string; html: string } {
  return {
    subject: `Payment failed — ${data.planTier} plan renewal`,
    html: renderEmailLayout({
      bodyHtml: `<p>Dear ${data.userName},</p>
<p>We were unable to process the renewal charge for your <strong>${data.planTier}</strong> plan subscription.</p>
<ul>
  <li><strong>Amount:</strong> &#x20B9;${data.amountInRupees.toLocaleString('en-IN')}</li>
  <li><strong>Payment ID:</strong> ${data.paymentId}</li>
</ul>
<p>To keep your access, please update your payment method on your
<a href="/account">account page</a>.</p>
<p>If you need help, contact our support team.</p>`,
    }),
  };
}
