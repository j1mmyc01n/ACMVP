export declare function submitFeedback(params: {
    subject: string;
    category: string;
    priority: string;
    message: string;
    submittedBy?: string;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
export declare function listFeedback(params?: {
    status?: string;
}): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<any[]>>;
export declare function updateFeedbackStatus(id: string, status: string): Promise<import("@supabase/postgrest-js").PostgrestSingleResponse<null>>;
//# sourceMappingURL=settings.service.d.ts.map