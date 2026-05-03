// GitHub integration utilities — location health checks, repo management.
// Extracted from src/lib/locationRolloutUtils.js

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

export async function checkLocationHealth(
  _locationId: string,
  location: Location,
): Promise<LocationHealth> {
  const checks: LocationHealthChecks = {
    netlify_status: 'unknown',
    supabase_status: 'unknown',
    github_status: 'unknown',
    response_time_ms: 0,
    uptime_percentage: 100,
  };

  if (location.netlify_url) {
    const start = Date.now();
    try {
      const res = await fetch(location.netlify_url as string, { method: 'HEAD' });
      checks.response_time_ms = Date.now() - start;
      checks.netlify_status = res.ok ? 'up' : 'down';
    } catch {
      checks.netlify_status = 'down';
    }
  }

  if (location.supabase_url) {
    try {
      const res = await fetch(`${location.supabase_url}/rest/v1/`, { method: 'HEAD' });
      checks.supabase_status = res.ok || res.status === 404 ? 'up' : 'down';
    } catch {
      checks.supabase_status = 'down';
    }
  }

  if (location.github_repo_full_name) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${location.github_repo_full_name}`,
      );
      checks.github_status = res.ok ? 'up' : 'down';
    } catch {
      checks.github_status = 'down';
    }
  }

  const allUp =
    checks.netlify_status !== 'down' &&
    checks.supabase_status !== 'down' &&
    checks.github_status !== 'down';

  return {
    ...checks,
    status: allUp ? 'healthy' : 'degraded',
    checked_at: new Date().toISOString(),
  };
}

export async function triggerGitHubWorkflow(params: {
  token: string;
  owner: string;
  repo: string;
  workflow: string;
  ref?: string;
  inputs?: Record<string, string>;
}) {
  const res = await fetch(
    `https://api.github.com/repos/${params.owner}/${params.repo}/actions/workflows/${params.workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${params.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: params.ref ?? 'main', inputs: params.inputs ?? {} }),
    },
  );
  return { ok: res.ok, status: res.status };
}
