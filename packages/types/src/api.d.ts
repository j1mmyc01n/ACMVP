export interface ApiResponse<T = unknown> {
    data: T | null;
    error: ApiError | null;
}
export interface ApiError {
    message: string;
    code?: string;
    status?: number;
}
export interface PaginatedResponse<T = unknown> {
    data: T[];
    total: number;
    page: number;
    perPage: number;
    hasMore: boolean;
}
export interface PaginationParams {
    page?: number;
    perPage?: number;
    offset?: number;
}
export interface AgentResponse {
    message: string;
    action?: string;
    data?: Record<string, unknown>;
    error?: string;
    model?: string;
    timestamp?: string;
}
//# sourceMappingURL=api.d.ts.map