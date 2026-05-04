export interface CheckInPayload {
    crn?: string;
    userId?: string;
    carecentreId?: string;
    mood?: number;
    concerns?: string;
    callWindow?: string;
    deviceInfo?: Record<string, unknown>;
}
export declare function submitCheckIn(payload: CheckInPayload): Promise<{
    ok: boolean;
}>;
export declare function validateCRNForCheckIn(crn: string): Promise<any>;
//# sourceMappingURL=checkin.service.d.ts.map