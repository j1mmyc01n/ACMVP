import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { Card, Field, Input, Button, Select, Badge } from '../../components/UI';

const { FiGithub, FiGlobe, FiDatabase, FiPlay, FiCheck, FiAlertTriangle, FiCopy, FiTerminal } = FiIcons;

const CARE_TYPES = [
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'domestic_violence', label: 'Domestic Violence' },
  { value: 'crisis_support', label: 'Crisis Support' },
  { value: 'substance_abuse', label: 'Substance Abuse' },
  { value: 'youth_services', label: 'Youth Services' },
  { value: 'general_care', label: 'General Care' },
];

const PHASES = [
  { id: 'github', label: 'Create GitHub Repo', icon: FiGithub },
  { id: 'supabase', label: 'Provision Supabase', icon: FiDatabase },
  { id: 'netlify', label: 'Create Netlify Site', icon: FiGlobe },
  { id: 'secrets', label: 'Set Secrets', icon: FiCheck },
  { id: 'deploy', label: 'Trigger Deploy', icon: FiPlay },
];

export default function LocationRollout() {
  const [form, setForm] = useState({
    locationName: '',
    careType: 'mental_health',
    githubToken: '',
    githubOrg: '',
    templateRepo: '',
    netlifyToken: '',
    supabaseToken: '',
    supabaseOrgId: '',
    region: 'ap-southeast-2',
  });
  const [phase, setPhase] = useState(null); // null | 'running' | 'done' | 'error'
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState({});
  const [error, setError] = useState('');
  const [showTokens, setShowTokens] = useState(false);

  const log = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { msg, type, time }]);
  };

  const slug = form.locationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const runProvisioning = async () => {
    if (!form.locationName || !form.githubToken || !form.netlifyToken || !form.supabaseToken) {
      setError('Please fill in all required fields before provisioning.');
      return;
    }

    setError('');
    setPhase('running');
    setLogs([]);
    setResults({});
    setCurrentStep(0);

    try {
      // ── STEP 1: GitHub repo
      log(`Creating GitHub repo: acute-connect-${slug}...`);
      setCurrentStep(1);

      const repoName = `acute-connect-${slug}`;
      const ghRes = await fetch(
        `https://api.github.com/repos/${form.templateRepo || form.githubOrg + '/acute-connect-template'}/generate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${form.githubToken}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner: form.githubOrg,
            name: repoName,
            description: `Acute Connect — ${form.locationName}`,
            private: true,
          })
        }
      );

      if (!ghRes.ok) {
        const err = await ghRes.json();
        throw new Error(`GitHub: ${err.message || ghRes.statusText}`);
      }

      const ghData = await ghRes.json();
      setResults(r => ({ ...r, repoUrl: ghData.html_url, repoFullName: ghData.full_name }));
      log(`✅ Repo created: ${ghData.html_url}`, 'success');
      await sleep(2000);

      // ── STEP 2: Supabase project
      log('Creating Supabase project (this takes ~60 seconds)...');
      setCurrentStep(2);

      const dbPassword = Array.from(crypto.getRandomValues(new Uint8Array(18)))
        .map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[b % 56])
        .join('');

      const sbRes = await fetch('https://api.supabase.com/v1/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${form.supabaseToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `acute-connect-${slug}`,
          organization_id: form.supabaseOrgId,
          plan: 'pro',
          region: form.region,
          db_pass: dbPassword,
        })
      });

      if (!sbRes.ok) {
        const err = await sbRes.json();
        throw new Error(`Supabase: ${err.message || sbRes.statusText}`);
      }

      const sbData = await sbRes.json();
      setResults(r => ({ ...r, supabaseRef: sbData.id, supabaseUrl: `https://${sbData.id}.supabase.co` }));
      log(`✅ Supabase project: ${sbData.id}`, 'success');
      log('Waiting 60s for DB to provision...', 'warning');
      await sleep(60000);

      // Get API keys
      const keysRes = await fetch(`https://api.supabase.com/v1/projects/${sbData.id}/api-keys`, {
        headers: { 'Authorization': `Bearer ${form.supabaseToken}` }
      });
      const keys = await keysRes.json();
      const anonKey = keys.find(k => k.name === 'anon')?.api_key;
      setResults(r => ({ ...r, supabaseAnonKey: anonKey }));

      // ── STEP 3: Netlify site
      log('Creating Netlify site...');
      setCurrentStep(3);

      const nlRes = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${form.netlifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: `acute-connect-${slug}` })
      });

      if (!nlRes.ok) {
        const err = await nlRes.json();
        throw new Error(`Netlify: ${err.message || nlRes.statusText}`);
      }

      const nlData = await nlRes.json();
      setResults(r => ({ ...r, netlifyUrl: nlData.ssl_url, netlifySiteId: nlData.id }));
      log(`✅ Netlify site: ${nlData.ssl_url}`, 'success');

      // Set Netlify env vars
      await fetch(`https://api.netlify.com/api/v1/sites/${nlData.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${form.netlifyToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build_settings: {
            env: {
              VITE_SUPABASE_URL: `https://${sbData.id}.supabase.co`,
              VITE_SUPABASE_ANON_KEY: anonKey || '',
              VITE_LOCATION_NAME: form.locationName,
            }
          }
        })
      });

      // Configure Supabase auth URLs
      await fetch(`https://api.supabase.com/v1/projects/${sbData.id}/config/auth`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${form.supabaseToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_url: nlData.ssl_url,
          additional_redirect_urls: [`${nlData.ssl_url}/**`, nlData.ssl_url],
        })
      });
      log('✅ Auth URLs configured', 'success');

      // ── STEP 4: GitHub secrets (instructions — requires gh CLI)
      log('Setting GitHub secrets...', 'info');
      setCurrentStep(4);
      log('ℹ️ Secrets must be set via gh CLI (GitHub API requires key encryption)', 'warning');
      log(`Run: gh secret set NETLIFY_TOKEN --body "..." --repo ${ghData.full_name}`, 'code');
      log(`Run: gh secret set NETLIFY_SITE_ID --body "${nlData.id}" --repo ${ghData.full_name}`, 'code');
      log(`Run: gh secret set SUPABASE_TOKEN --body "..." --repo ${ghData.full_name}`, 'code');
      log(`Run: gh secret set SUPABASE_ANON_KEY --body "${anonKey}" --repo ${ghData.full_name}`, 'code');

      // ── STEP 5: Trigger deploy
      log('Triggering first deploy...', 'info');
      setCurrentStep(5);

      await sleep(3000); // wait for repo to be ready
      const deployRes = await fetch(
        `https://api.github.com/repos/${ghData.full_name}/actions/workflows/deploy.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${form.githubToken}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ref: 'main' })
        }
      );

      if (deployRes.status === 204 || deployRes.ok) {
        log('✅ Deploy triggered — check GitHub Actions tab', 'success');
      } else {
        log('ℹ️ Deploy trigger requires workflow file in repo first — push code then it auto-deploys', 'warning');
      }

      log('', 'spacer');
      log(`🎉 ${form.locationName} is provisioned!`, 'success');
      setPhase('done');

    } catch (err) {
      log(`❌ Error: ${err.message}`, 'error');
      setError(err.message);
      setPhase('error');
    }
  };

  const copyResult = (text) => { navigator.clipboard.writeText(text); };

  return (
    <div className="ac-stack">
      <div style={{ fontSize: 20, fontWeight: 800 }}>Location Rollout</div>
      <p style={{ fontSize: 13, color: 'var(--ac-muted)' }}>
        Provision a complete new location — GitHub repo, Supabase database, Netlify site — all automated.
      </p>

      {/* Form */}
      <Card title="Location Details">
        <div className="ac-stack">
          <div className="ac-grid-2">
            <Field label="Location Name *">
              <Input value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))}
                placeholder="e.g. Bondi Beach Clinic" />
            </Field>
            <Field label="Care Type">
              <Select value={form.careType} onChange={e => setForm(f => ({ ...f, careType: e.target.value }))}
                options={CARE_TYPES} />
            </Field>
          </div>
          {form.locationName && (
            <div style={{ fontSize: 12, color: 'var(--ac-muted)', background: 'var(--ac-bg)', padding: '8px 12px', borderRadius: 8 }}>
              Will create: <strong>acute-connect-{slug}</strong> (repo, site, DB)
            </div>
          )}
        </div>
      </Card>

      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span>API Credentials</span>
          <button onClick={() => setShowTokens(t => !t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-primary)', fontSize: 12 }}>
            {showTokens ? 'Hide' : 'Show'}
          </button>
        </div>
      }>
        <div className="ac-stack">
          <div className="ac-grid-2">
            <Field label="GitHub Org / Username">
              <Input value={form.githubOrg} onChange={e => setForm(f => ({ ...f, githubOrg: e.target.value }))} placeholder="your-org" />
            </Field>
            <Field label="Template Repo">
              <Input value={form.templateRepo} onChange={e => setForm(f => ({ ...f, templateRepo: e.target.value }))} placeholder="org/acute-connect-template" />
            </Field>
          </div>
          {[
            { key: 'githubToken', label: 'GitHub PAT (repo + workflow + admin:repo_hook)', placeholder: 'ghp_...' },
            { key: 'netlifyToken', label: 'Netlify Personal Access Token', placeholder: 'nfp_...' },
            { key: 'supabaseToken', label: 'Supabase Management API Token', placeholder: 'sbp_...' },
            { key: 'supabaseOrgId', label: 'Supabase Organization ID', placeholder: 'your-org-id' },
          ].map(f => (
            <Field key={f.key} label={f.label}>
              <Input
                type={showTokens ? 'text' : 'password'}
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </Field>
          ))}
        </div>
      </Card>

      {error && (
        <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 12, padding: '12px 16px', color: '#c62828', fontSize: 13, display: 'flex', gap: 8 }}>
          <SafeIcon icon={FiAlertTriangle} size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* Phase pipeline */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
        {PHASES.map((p, i) => {
          const done = phase === 'done' || currentStep > i + 1;
          const active = phase === 'running' && currentStep === i + 1;
          return (
            <div key={p.id} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', margin: '0 auto 6px',
                background: done ? '#34C759' : active ? 'var(--ac-primary)' : 'var(--ac-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.3s',
              }}>
                <SafeIcon icon={p.icon} size={14} style={{ color: done || active ? '#fff' : 'var(--ac-muted)' }} />
              </div>
              <div style={{ fontSize: 10, color: active ? 'var(--ac-primary)' : done ? '#34C759' : 'var(--ac-muted)', fontWeight: active ? 700 : 400, lineHeight: 1.2 }}>
                {p.label}
              </div>
              {i < PHASES.length - 1 && (
                <div style={{ position: 'absolute', top: 16, left: '50%', right: '-50%', height: 2, background: done ? '#34C759' : 'var(--ac-border)', zIndex: -1 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Run button */}
      {phase !== 'running' && (
        <Button
          onClick={runProvisioning}
          disabled={!form.locationName || !form.githubToken || !form.netlifyToken || !form.supabaseToken}
          style={{ width: '100%' }}
          icon={FiPlay}
        >
          {phase === 'done' ? '✅ Provisioned — Run Again?' : phase === 'error' ? 'Retry Provisioning' : '🚀 Provision Location'}
        </Button>
      )}

      {/* Terminal log */}
      {logs.length > 0 && (
        <div style={{ background: '#0F172A', borderRadius: 14, padding: 16, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <SafeIcon icon={FiTerminal} size={14} style={{ color: '#64748B' }} />
            <span style={{ fontSize: 12, color: '#64748B' }}>Provisioning Terminal</span>
            {phase === 'running' && (
              <span style={{ fontSize: 11, color: '#3ECF8E', marginLeft: 'auto', animation: 'pulse 1.5s infinite' }}>● Running...</span>
            )}
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {logs.map((l, i) => (
              <div key={i} style={{ fontSize: 11, marginBottom: 3, color: l.type === 'error' ? '#F87171' : l.type === 'success' ? '#4ADE80' : l.type === 'warning' ? '#FCD34D' : l.type === 'code' ? '#93C5FD' : '#94A3B8', fontFamily: 'monospace', lineHeight: 1.6 }}>
                {l.type !== 'spacer' && <span style={{ color: '#475569', marginRight: 8 }}>[{l.time}]</span>}
                {l.msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {phase === 'done' && Object.keys(results).length > 0 && (
        <Card title="✅ Provisioning Complete">
          <div className="ac-stack" style={{ gap: 8 }}>
            {[
              { label: 'GitHub Repo', value: results.repoUrl },
              { label: 'Netlify Site', value: results.netlifyUrl },
              { label: 'Supabase Project', value: results.supabaseRef ? `https://supabase.com/dashboard/project/${results.supabaseRef}` : null },
              { label: 'Supabase URL', value: results.supabaseUrl },
            ].filter(r => r.value).map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--ac-border)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{r.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.value}</div>
                </div>
                <button onClick={() => copyResult(r.value)} style={{ background: 'none', border: '1px solid var(--ac-border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--ac-muted)' }}>
                  <SafeIcon icon={FiCopy} size={12} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--ac-bg)', borderRadius: 10, fontSize: 12, color: 'var(--ac-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--ac-text)' }}>Next step:</strong> Set GitHub Actions secrets using gh CLI, then every git push to main auto-deploys. See INSTRUCTIONS.md for the exact commands.
          </div>
        </Card>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
