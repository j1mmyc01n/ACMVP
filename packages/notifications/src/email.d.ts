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
export declare function sendEmail(options: EmailOptions): Promise<{
    ok: boolean;
    error?: string;
}>;
//# sourceMappingURL=email.d.ts.map