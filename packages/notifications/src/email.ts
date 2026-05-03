// Email notification service stub.
// TODO: Integrate with a transactional email provider (Resend / SendGrid / Postmark).

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

/**
 * Send a transactional email.
 * Currently a no-op stub — replace with actual provider SDK.
 */
export async function sendEmail(options: EmailOptions): Promise<{ ok: boolean; error?: string }> {
  console.log('[notifications/email] stub — not yet implemented', options);
  return { ok: true };
}
