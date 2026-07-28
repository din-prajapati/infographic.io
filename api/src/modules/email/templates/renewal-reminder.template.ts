import { renderEmailLayout } from './layout';

export interface RenewalReminderData {
  userName: string;
  planTier: string;
  renewalDate: string;
  amountInRupees: number;
}

export function renewalReminderTemplate(data: RenewalReminderData): { subject: string; html: string } {
  return {
    subject: `Renewal reminder — ${data.planTier} plan`,
    html: renderEmailLayout({
      bodyHtml: `<p>Dear ${data.userName},</p>
<p>Your <strong>${data.planTier}</strong> plan subscription will renew automatically on
<strong>${data.renewalDate}</strong>.</p>
<p>The renewal amount will be <strong>&#x20B9;${data.amountInRupees.toLocaleString('en-IN')}</strong>.</p>
<p>To cancel or update your payment method before the renewal date, visit your
<a href="/account">account page</a>.</p>`,
    }),
  };
}
