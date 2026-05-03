// SMS notification service stub.
// TODO: Integrate with Twilio or similar SMS provider.

export interface SmsOptions {
  to: string;
  message: string;
}

/**
 * Send an SMS message.
 * Currently a no-op stub — replace with actual provider SDK.
 */
export async function sendSms(options: SmsOptions): Promise<{ ok: boolean; error?: string }> {
  console.log('[notifications/sms] stub — not yet implemented', options);
  return { ok: true };
}
