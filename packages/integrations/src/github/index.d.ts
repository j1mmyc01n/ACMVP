export interface LocationHealthChecks {
    netlify_status: 'up' | 'down' | 'unknown';
    supabase_status: 'up' | 'down' | 'unknown';
    github_status: 'up' | 'down' | 'unknown';
    response_time_ms: number;
    uptime_percentage: number;
}
export interface LocationHealth extends LocationHealthChecks {
    status: 'healthy' | 'degraded' | 'down';
    checked_at: string;
}
interface Location {
    netlify_url?: string;
    supabase_url?: string;
    github_repo_full_name?: string;
    [key: string]: unknown;
}
export declare function checkLocationHealth(_locationId: string, location: Location): Promise<LocationHealth>;
export declare function triggerGitHubWorkflow(params: {
    token: string;
    owner: string;
    repo: string;
    workflow: string;
    ref?: string;
    inputs?: Record<string, string>;
}): Promise<{
    ok: boolean;
    status: number;
}>;
export {};
//# sourceMappingURL=index.d.ts.map