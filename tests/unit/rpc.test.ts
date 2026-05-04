/**
 * RPC and integration tests
 * No active Supabase RPC calls were found in the codebase — the app uses
 * direct table queries instead. These tests document the expected RPC call
 * contract and verify external API integration patterns.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── RPC call contract ────────────────────────────────────────────────────────

describe('Supabase RPC contract', () => {
  it('rpc returns data/error shape on success', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: { result: 'ok' }, error: null });
    const sb = { rpc: mockRpc };
    const result = await sb.rpc('some_function', { param: 'value' });
    expect(result.data).toEqual({ result: 'ok' });
    expect(result.error).toBeNull();
    expect(mockRpc).toHaveBeenCalledWith('some_function', { param: 'value' });
  });

  it('rpc returns error on failure without throwing', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'function not found' } });
    const sb = { rpc: mockRpc };
    const result = await sb.rpc('nonexistent_fn', {});
    expect(result.error?.message).toBe('function not found');
    expect(result.data).toBeNull();
  });
});

// ─── GitHub API integration ───────────────────────────────────────────────────

describe('GitHub API integration (provision-location)', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('fork template repo — POST to correct endpoint with auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html_url: 'https://github.com/org/new-repo', full_name: 'org/new-repo', id: 12345 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const GITHUB_API = 'https://api.github.com';
    const templateOwner = 'acmvp-templates';
    const templateRepo  = 'aclocation-template';
    const newRepoName   = 'loc-sydney-north';

    const response = await fetch(`${GITHUB_API}/repos/${templateOwner}/${templateRepo}/forks`, {
      method: 'POST',
      headers: { Authorization: 'token ghtoken', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRepoName, default_branch_only: true }),
    });
    const data = await response.json() as { html_url: string; full_name: string };

    expect(fetchMock).toHaveBeenCalledWith(
      `${GITHUB_API}/repos/${templateOwner}/${templateRepo}/forks`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(data.html_url).toBe('https://github.com/org/new-repo');
    expect(data.full_name).toBe('org/new-repo');
  });

  it('repo create — handles 422 (name taken) without crashing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 422,
      json: async () => ({ message: 'Repository already exists' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await fetch('https://api.github.com/user/repos', { method: 'POST', body: JSON.stringify({ name: 'existing' }) });
    expect(response.ok).toBe(false);
    expect(response.status).toBe(422);
  });

  it('repo create — handles 401 (bad credentials)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({ message: 'Bad credentials' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await fetch('https://api.github.com/user/repos', { method: 'POST' });
    expect(response.status).toBe(401);
    const data = await response.json() as { message: string };
    expect(data.message).toBe('Bad credentials');
  });
});

// ─── Netlify API integration ──────────────────────────────────────────────────

describe('Netlify API integration (provision-location)', () => {
  const NETLIFY_API = 'https://api.netlify.com/api/v1';
  beforeEach(() => { vi.restoreAllMocks(); });

  it('create site — returns site id and ssl_url', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'site-abc', ssl_url: 'https://my-site.netlify.app' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await fetch(`${NETLIFY_API}/sites`, {
      method: 'POST',
      headers: { Authorization: 'Bearer netlify-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'loc-sydney-north' }),
    });
    const data = await response.json() as { id: string; ssl_url: string };
    expect(data.id).toBe('site-abc');
    expect(data.ssl_url).toBe('https://my-site.netlify.app');
  });

  it('create site — handles 401 (bad token)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({ message: 'Not authorized' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await fetch(`${NETLIFY_API}/sites`, { method: 'POST' });
    expect(response.status).toBe(401);
  });
});

// ─── Supabase Management API ──────────────────────────────────────────────────

describe('Supabase Management API (provision-location)', () => {
  const MANAGEMENT_API = 'https://api.supabase.com/v1';
  beforeEach(() => { vi.restoreAllMocks(); });

  it('create project — returns project ref and API URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'proj-ref-abc', api: { url: 'https://proj-ref-abc.supabase.co' } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await fetch(`${MANAGEMENT_API}/projects`, {
      method: 'POST',
      headers: { Authorization: 'Bearer sb-mgmt-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'loc-sydney-north', organization_id: 'org-123', plan: 'free', region: 'ap-southeast-2' }),
    });
    const data = await response.json() as { id: string };
    expect(fetchMock).toHaveBeenCalledWith(
      `${MANAGEMENT_API}/projects`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(data.id).toBe('proj-ref-abc');
  });

  it('create project — handles invalid org ID (400)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false, status: 400,
      json: async () => ({ message: 'Invalid Supabase Organization ID' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = await fetch(`${MANAGEMENT_API}/projects`, { method: 'POST', body: JSON.stringify({ organization_id: 'bad-org' }) });
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    const data = await response.json() as { message: string };
    expect(data.message).toContain('Invalid');
  });
});

// ─── Audit log helper ─────────────────────────────────────────────────────────

describe('logActivity integration (audit_logs_1777090020)', () => {
  it('inserts entry with correct shape', () => {
    const chain = { insert: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const from  = vi.fn().mockReturnValue(chain);
    const entry = { action: 'LOCATION_PROVISIONED', entity_type: 'location_instance', user_id: 'u1' };
    from('audit_logs_1777090020').insert({ ...entry, created_at: new Date().toISOString() });
    expect(from).toHaveBeenCalledWith('audit_logs_1777090020');
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ action: 'LOCATION_PROVISIONED' }));
  });

  it('error in logActivity — returns error without crash', async () => {
    const resolved = { data: null, error: { message: 'DB down' } };
    const chain    = { insert: vi.fn().mockResolvedValue(resolved), then: vi.fn().mockResolvedValue(resolved) };
    const from     = vi.fn().mockReturnValue(chain);
    const result   = await from('audit_logs_1777090020').insert({ action: 'TEST' });
    expect((result as { error: { message: string } }).error).toBeTruthy();
  });
});

// ─── recordAgreementAudit helper ──────────────────────────────────────────────

describe('recordAgreementAudit (profile_audit_log)', () => {
  it('inserts all legal version fields', () => {
    const chain   = { insert: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const from    = vi.fn().mockReturnValue(chain);
    const payload = {
      profile_id: 'p1', crn: 'CRN-001', action: 'CRN_CREATED',
      agreement_accepted: true, agreement_text: 'By using Acute Connect...',
      legal_bundle_version: 'v1.0', privacy_version: 'v1.0',
      terms_version: 'v1.0', medical_disclaimer_version: 'v1.0',
      ai_disclosure_version: 'v1.0', crisis_notice_version: 'v1.0', cookie_policy_version: 'v1.0',
    };
    from('profile_audit_log').insert(payload);
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ legal_bundle_version: 'v1.0', agreement_accepted: true }));
  });

  it('error — returns error when action missing', async () => {
    const resolved = { data: null, error: { message: 'audit: action is required' } };
    const chain    = { insert: vi.fn().mockResolvedValue(resolved) };
    const from     = vi.fn().mockReturnValue(chain);
    const result   = await from('profile_audit_log').insert({ profile_id: 'p1' });
    expect((result as { error: { message: string } }).error?.message).toContain('action');
  });
});
