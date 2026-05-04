export declare const FREE_PUSH_LIMIT = 3;
export declare const PACK_PUSH_EXTRA = 5;
export declare const PUSH_PACK_FEE = 75;
export interface PushNotification {
    id?: string;
    type: 'info' | 'reminder' | 'welfare' | 'alert';
    title: string;
    message: string;
    target_centre_id?: string;
    target_client_id?: string;
    sender_email?: string;
    sent_at?: string;
    status?: 'sent' | 'failed' | 'pending';
}
export declare function sendPushNotification(notification: PushNotification): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
export declare function listPushNotifications(params?: {
    centreId?: string;
    limit?: number;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function getMonthlyPushCount(centreId: string): Promise<number>;
export declare function requestPushPackUpgrade(params: {
    locationId: string;
    requestedBy: string;
    notes?: string;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
//# sourceMappingURL=push.d.ts.map