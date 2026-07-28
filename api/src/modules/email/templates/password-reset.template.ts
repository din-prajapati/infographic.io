import { renderEmailLayout } from './layout';

export function passwordResetTemplate({ link }: { link: string }): {
  subject: string;
  html: string;
  text: string;
} {
  return {
    subject: 'Reset your Buildographic password',
    text:
      `Reset your password using this link (valid for 1 hour):\n${link}\n\n` +
      `If you didn't request this, you can safely ignore this email.`,
    html: renderEmailLayout({
      bodyHtml:
        `<p>Reset your password using the link below (valid for 1 hour):</p>` +
        `<p><a href="${link}">Reset my password</a></p>` +
        `<p>If you didn't request this, you can safely ignore this email.</p>`,
    }),
  };
}
