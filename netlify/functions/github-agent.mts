import type { Context } from "@netlify/functions";

const GITHUB_API = 'https://api.github.com';

const ghHeaders = (pat: string) => ({
  'Authorization': `Bearer ${pat}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'AcuteConnect-GitHubAgent/1.0',
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });

export default async (req: Request, _context: Context) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const {
    action,
    pat,
    repo,
    branch = 'main',
    openai_key,
    openai_model = 'gpt-4',
    ...params
  } = body as {
    action: string;
    pat: string;
    repo: string;
    branch?: string;
    openai_key?: string;
    openai_model?: string;
    [key: string]: unknown;
  };

  if (!pat) {
    return json({ error: 'GitHub PAT is required' }, 400);
  }

  const gh = ghHeaders(pat);

  try {
    switch (action) {

      case 'verify_token': {
        const res = await fetch(`${GITHUB_API}/user`, { headers: gh });
        const user = await res.json() as Record<string, unknown>;
        if (!res.ok) return json({ error: (user.message as string) || 'Authentication failed' }, res.status);
        return json({
          user: {
            login: user.login,
            name: user.name,
            avatar_url: user.avatar_url,
            public_repos: user.public_repos,
            private_repos: (user.total_private_repos as number) || 0,
          },
        });
      }

      case 'repo_info': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const res = await fetch(`${GITHUB_API}/repos/${repo}`, { headers: gh });
        const r = await res.json() as Record<string, unknown>;
        if (!res.ok) return json({ error: (r.message as string) }, res.status);
        return json({
          name: r.full_name,
          description: r.description,
          default_branch: r.default_branch,
          stars: r.stargazers_count,
          forks: r.forks_count,
          open_issues: r.open_issues_count,
          url: r.html_url,
          private: r.private,
          updated_at: r.updated_at,
        });
      }

      case 'list_repos': {
        const res = await fetch(`${GITHUB_API}/user/repos?sort=updated&per_page=30&type=all`, { headers: gh });
        const repos = await res.json() as Record<string, unknown>[];
        if (!res.ok) return json({ error: (repos as unknown as Record<string, unknown>).message }, res.status);
        return json({
          repos: repos.map(r => ({
            name: r.full_name,
            default_branch: r.default_branch,
            private: r.private,
            updated_at: r.updated_at,
          })),
        });
      }

      case 'list_branches': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const res = await fetch(`${GITHUB_API}/repos/${repo}/branches?per_page=50`, { headers: gh });
        const branches = await res.json() as Record<string, unknown>[];
        if (!res.ok) return json({ error: (branches as unknown as Record<string, unknown>).message }, res.status);
        return json({ branches: branches.map(b => b.name) });
      }

      case 'create_branch': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const { new_branch, from_branch } = params as { new_branch: string; from_branch?: string };
        if (!new_branch) return json({ error: 'new_branch is required' }, 400);
        const refRes = await fetch(
          `${GITHUB_API}/repos/${repo}/git/ref/heads/${from_branch || branch}`,
          { headers: gh }
        );
        const refData = await refRes.json() as Record<string, unknown>;
        if (!refRes.ok) return json({ error: (refData.message as string) }, refRes.status);
        const sha = (refData.object as Record<string, unknown>).sha as string;
        const createRes = await fetch(`${GITHUB_API}/repos/${repo}/git/refs`, {
          method: 'POST',
          headers: gh,
          body: JSON.stringify({ ref: `refs/heads/${new_branch}`, sha }),
        });
        const result = await createRes.json() as Record<string, unknown>;
        if (!createRes.ok) return json({ error: (result.message as string) }, createRes.status);
        return json({ branch: new_branch, sha: (result.object as Record<string, unknown>).sha });
      }

      case 'list_prs': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const state = (params.state as string) || 'open';
        const res = await fetch(`${GITHUB_API}/repos/${repo}/pulls?state=${state}&per_page=20`, { headers: gh });
        const prs = await res.json() as Record<string, unknown>[];
        if (!res.ok) return json({ error: (prs as unknown as Record<string, unknown>).message }, res.status);
        return json({
          prs: prs.map(pr => ({
            number: pr.number,
            title: pr.title,
            url: pr.html_url,
            state: pr.state,
            head: (pr.head as Record<string, unknown>)?.ref,
            base: (pr.base as Record<string, unknown>)?.ref,
            created_at: pr.created_at,
          })),
        });
      }

      case 'create_pr': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const { title, body: prBody, head, base } = params as {
          title: string; body?: string; head: string; base?: string;
        };
        if (!title || !head) return json({ error: 'title and head branch are required' }, 400);
        const res = await fetch(`${GITHUB_API}/repos/${repo}/pulls`, {
          method: 'POST',
          headers: gh,
          body: JSON.stringify({ title, body: prBody || '', head, base: base || branch }),
        });
        const pr = await res.json() as Record<string, unknown>;
        if (!res.ok) {
          const errors = pr.errors as Array<Record<string, unknown>> | undefined;
          return json({ error: (pr.message as string) || errors?.[0]?.message }, res.status);
        }
        return json({ pr: { number: pr.number, url: pr.html_url, title: pr.title } });
      }

      case 'merge_pr': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const { pr_number, merge_method = 'squash' } = params as { pr_number: number; merge_method?: string };
        if (!pr_number) return json({ error: 'pr_number is required' }, 400);
        const res = await fetch(`${GITHUB_API}/repos/${repo}/pulls/${pr_number}/merge`, {
          method: 'PUT',
          headers: gh,
          body: JSON.stringify({ merge_method }),
        });
        const result = await res.json() as Record<string, unknown>;
        if (!res.ok) return json({ error: (result.message as string) }, res.status);
        return json({ merged: true, sha: result.sha, message: result.message });
      }

      case 'get_latest_commit': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const res = await fetch(`${GITHUB_API}/repos/${repo}/commits/${branch}`, { headers: gh });
        const commit = await res.json() as Record<string, unknown>;
        if (!res.ok) return json({ error: (commit.message as string) }, res.status);
        const commitData = commit.commit as Record<string, unknown>;
        const authorData = commitData.author as Record<string, unknown>;
        return json({
          sha: commit.sha,
          message: commitData.message,
          author: authorData.name,
          date: authorData.date,
          url: commit.html_url,
        });
      }

      case 'list_files': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const { path = '' } = params as { path?: string };
        const res = await fetch(
          `${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`,
          { headers: gh }
        );
        const files = await res.json() as Record<string, unknown>[];
        if (!res.ok) return json({ error: (files as unknown as Record<string, unknown>).message }, res.status);
        const arr = Array.isArray(files) ? files : [files];
        return json({
          files: arr.map(f => ({
            name: f.name,
            path: f.path,
            type: f.type,
            size: f.size,
          })),
        });
      }

      case 'get_file': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const { path } = params as { path: string };
        if (!path) return json({ error: 'path is required' }, 400);
        const res = await fetch(
          `${GITHUB_API}/repos/${repo}/contents/${path}?ref=${branch}`,
          { headers: gh }
        );
        const file = await res.json() as Record<string, unknown>;
        if (!res.ok) return json({ error: (file.message as string) }, res.status);
        const content = Buffer.from(file.content as string, 'base64').toString('utf-8');
        return json({ content, sha: file.sha, path: file.path, size: file.size });
      }

      case 'commit_file': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const { path, content, message: commitMsg, sha } = params as {
          path: string; content: string; message: string; sha?: string;
        };
        if (!path || !content || !commitMsg) {
          return json({ error: 'path, content and message are required' }, 400);
        }
        const encoded = Buffer.from(content).toString('base64');
        const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${path}`, {
          method: 'PUT',
          headers: gh,
          body: JSON.stringify({
            message: commitMsg,
            content: encoded,
            branch,
            ...(sha ? { sha } : {}),
          }),
        });
        const result = await res.json() as Record<string, unknown>;
        if (!res.ok) return json({ error: (result.message as string) }, res.status);
        const commitResult = result.commit as Record<string, unknown>;
        return json({
          commit: {
            sha: commitResult.sha,
            url: commitResult.html_url,
            message: (commitResult.message as string)?.split('\n')[0],
          },
        });
      }

      case 'trigger_deploy': {
        if (!repo) return json({ error: 'repo is required' }, 400);
        const res = await fetch(`${GITHUB_API}/repos/${repo}/dispatches`, {
          method: 'POST',
          headers: gh,
          body: JSON.stringify({ event_type: 'deploy', client_payload: {} }),
        });
        if (res.status === 204) return json({ success: true, message: 'Deploy event dispatched' });
        const error = await res.json() as Record<string, unknown>;
        return json({ error: (error.message as string) || 'Failed to trigger deploy' }, res.status);
      }

      case 'chat': {
        const { message } = params as { message: string };
        if (!message) return json({ error: 'message is required' }, 400);

        if (!openai_key) {
          return json({
            reply: `I can understand these commands directly (no AI key needed):\n\n• "list prs" — show open pull requests\n• "list branches" — show all branches\n• "latest commit" — show the last commit\n• "repo info" — show repository stats\n• "list files" — browse root files\n\nFor full natural language support, go to Settings → Integrations → AI Engine and connect an OpenAI key.`,
          });
        }

        const systemPrompt = `You are a GitHub AI Agent for the Acute Connect platform.
Current repo: ${repo || 'not configured'}
Current branch: ${branch || 'main'}

Respond ONLY with a valid JSON object:
{
  "action": "<one of: list_prs|list_branches|create_branch|create_pr|merge_pr|get_file|list_files|get_latest_commit|repo_info|commit_file|trigger_deploy|explain>",
  "params": { <action-specific params> },
  "message": "<concise explanation of what you're doing>"
}

Rules:
- list_prs: params can include { state: "open"|"closed" }
- create_branch: params MUST include { new_branch: "name", from_branch?: "source" }
- create_pr: params MUST include { title, head, base?, body? }
- merge_pr: params MUST include { pr_number: <number> }
- get_file: params MUST include { path: "file/path" }
- list_files: params can include { path: "dir/" or "" for root }
- commit_file: params MUST include { path, content, message }
- explain: use for questions, no GitHub action needed
- trigger_deploy: no extra params needed`;

        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${openai_key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: openai_model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 600,
            temperature: 0.1,
          }),
        });

        const aiData = await aiRes.json() as Record<string, unknown>;
        if (!aiRes.ok) {
          const aiError = aiData.error as Record<string, unknown>;
          return json({ error: (aiError?.message as string) || 'OpenAI request failed' }, aiRes.status);
        }

        const choices = aiData.choices as Array<Record<string, unknown>>;
        const aiContent = (choices[0].message as Record<string, unknown>).content as string;
        try {
          const aiReply = JSON.parse(aiContent);
          return json({ ai_action: aiReply });
        } catch {
          return json({ reply: aiContent });
        }
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: unknown) {
    const error = err as Error;
    return json({ error: error.message || 'Internal server error' }, 500);
  }
};
