// GitHub integration utilities — location health checks, repo management.
// Extracted from src/lib/locationRolloutUtils.js
export async function checkLocationHealth(_locationId, location) {
    const checks = {
        netlify_status: 'unknown',
        supabase_status: 'unknown',
        github_status: 'unknown',
        response_time_ms: 0,
        uptime_percentage: 100,
    };
    if (location.netlify_url) {
        const start = Date.now();
        try {
            const res = await fetch(location.netlify_url, { method: 'HEAD' });
            checks.response_time_ms = Date.now() - start;
            checks.netlify_status = res.ok ? 'up' : 'down';
        }
        catch {
            checks.netlify_status = 'down';
        }
    }
    if (location.supabase_url) {
        try {
            const res = await fetch(`${location.supabase_url}/rest/v1/`, { method: 'HEAD' });
            checks.supabase_status = res.ok || res.status === 404 ? 'up' : 'down';
        }
        catch {
            checks.supabase_status = 'down';
        }
    }
    if (location.github_repo_full_name) {
        try {
            const res = await fetch(`https://api.github.com/repos/${location.github_repo_full_name}`);
            checks.github_status = res.ok ? 'up' : 'down';
        }
        catch {
            checks.github_status = 'down';
        }
    }
    const allUp = checks.netlify_status !== 'down' &&
        checks.supabase_status !== 'down' &&
        checks.github_status !== 'down';
    return {
        ...checks,
        status: allUp ? 'healthy' : 'degraded',
        checked_at: new Date().toISOString(),
    };
}
export async function triggerGitHubWorkflow(params) {
    const res = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/actions/workflows/${params.workflow}/dispatches`, {
        method: 'POST',
        headers: {
            Authorization: `token ${params.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: params.ref ?? 'main', inputs: params.inputs ?? {} }),
    });
    return { ok: res.ok, status: res.status };
}
//# sourceMappingURL=index.js.map