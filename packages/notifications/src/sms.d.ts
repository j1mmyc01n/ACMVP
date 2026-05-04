export interface SmsOptions {
    to: string;
    message: string;
}
/**
 * Send an SMS message.
 * Currently a no-op stub — replace with actual provider SDK.
 */
export declare function sendSms(options: SmsOptions): Promise<{
    ok: boolean;
    error?: string;
}>;
//# sourceMappingURL=sms.d.ts.map