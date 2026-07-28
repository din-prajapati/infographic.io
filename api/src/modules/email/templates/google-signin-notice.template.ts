export function googleSigninNoticeTemplate(): { subject: string; text: string } {
  return {
    subject: 'Signing in to Buildographic',
    text:
      `You requested a password reset, but this account signs in with Google — ` +
      `there is no password to reset. Just use "Continue with Google" on the login page.`,
  };
}
