import React, { useState, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { Card, Field, Input, Button, Select, Badge } from '../../components/UI';
import { supabase } from '../../supabase/supabase';
import { safeErrMsg } from '../../lib/utils';
import { 
  checkLocationHealth, 
  checkAlertRules, 
  runAutonomousMonitoring 
} from '../../lib/locationRolloutUtils';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const { 
  FiGithub, FiGlobe, FiDatabase, FiPlay, FiCheck, FiAlertTriangle, FiCopy, 
  FiTerminal, FiDollarSign, FiActivity, FiCreditCard, FiTrendingUp, FiEye,
  FiKey, FiServer, FiZap, FiShield, FiBell, FiAlertCircle, FiCheckCircle,
  FiPlus, FiSettings, FiDownload, FiRefreshCw, FiClock, FiUsers, FiBarChart2,
  FiSave, FiUploadCloud, FiTrash2
} = FiIcons;

const SAVED_CREDS_KEY = 'acmvp_provision_creds';
const DEFAULT_REGION = 'ap-southeast-2';

const DB_PASS_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
// Excludes visually ambiguous characters: I, L, O (upper) and l, o (lower), 1, 0
// to reduce transcription errors if the password is ever displayed to a user.
// Unbiased password generation via rejection sampling
const generateDbPassword = (length = 18) => {
  const maxUsable = 256 - (256 % DB_PASS_CHARS.length);
  const result = [];
  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array((length - result.length) * 2));
    for (const b of bytes) {
      if (b < maxUsable) {
        result.push(DB_PASS_CHARS[b % DB_PASS_CHARS.length]);
        if (result.length === length) break;
      }
    }
  }
  return result.join('');
};

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
  { id: 'database', label: 'Database', icon: FiDatabase },
  { id: 'netlify', label: 'Create Netlify Site', icon: FiGlobe },
  { id: 'secrets', label: 'Set Secrets', icon: FiCheck },
  { id: 'deploy', label: 'Trigger Deploy', icon: FiPlay },
];

export default function LocationRollout() {
  // View state
  const [activeView, setActiveView] = useState('overview'); // overview | quick | provision | monitor | billing

  // Saved credentials (persisted in localStorage + Supabase)
  const [savedCreds, setSavedCreds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_CREDS_KEY)) || null; } catch (e) { console.warn('Failed to parse saved credentials:', e); return null; }
  });
  const [credsSaved, setCredsSaved] = useState(false);
  const [credsSaveError, setCredsSaveError] = useState('');

  // Quick rollout state
  const [quickForm, setQuickForm] = useState({ namePrefix: '', adminEmail: '', careType: 'mental_health', parentLocation: '' });
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState(null);
  const [quickError, setQuickError] = useState('');
  const [mainLocations, setMainLocations] = useState([]);
  const [quickProvisionInfra, setQuickProvisionInfra] = useState(false);
  const [quickInfraLog, setQuickInfraLog] = useState([]);
  const [quickInfraStep, setQuickInfraStep] = useState(0);
  
  // Form state
  const [form, setForm] = useState({
    locationName: '',
    careType: 'mental_health',
    githubToken: '',
    githubOrg: '',
    templateRepo: '',
    netlifyToken: '',
    supabaseToken: '',
    supabaseOrgId: '',
    dbMode: 'supabase',
    manualDbUrl: '',
    manualDbAnonKey: '',
    region: DEFAULT_REGION,
    monthlyCredits: '10000',
    planType: 'pro',
    contactEmail: '',
    contactPhone: '',
  });
  
  // Provisioning state
  const [phase, setPhase] = useState(null); // null | 'running' | 'done' | 'error'
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState({});
  const [error, setError] = useState('');
  const [showTokens, setShowTokens] = useState(false);
  const [orgLookup, setOrgLookup] = useState({ loading: false, error: '', orgs: [] });
  const [manualOrgEntry, setManualOrgEntry] = useState(false);
  
  // Data state
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [usageData, setUsageData] = useState([]);
  const [billingData, setBillingData] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Auto-monitoring interval
  useEffect(() => {
    // Run autonomous monitoring every 5 minutes
    const monitoringInterval = setInterval(() => {
      if (monitoringActive) {
        runAutonomousMonitoring().then(result => {
          if (result.success) {
            console.log('Autonomous monitoring completed:', result);
            loadLocations(); // Refresh data
          }
        });
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(monitoringInterval);
  }, [monitoringActive]);

  // Load credentials from Supabase on mount; merge into localStorage cache
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('provision_credentials')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();
        if (error) { console.warn('Could not load provision_credentials from Supabase:', error.message); return; }
        if (!data) return;
        const creds = {
          githubOrg: data.github_org || '',
          templateRepo: data.template_repo || '',
          githubToken: data.github_token || '',
          netlifyToken: data.netlify_token || '',
          supabaseToken: data.supabase_token || '',
          supabaseOrgId: data.supabase_org_id || '',
          dbMode: data.db_mode || 'supabase',
          manualDbUrl: data.manual_db_url || '',
          manualDbAnonKey: data.manual_db_anon_key || '',
          region: data.region || DEFAULT_REGION,
        };
        // Only update if at least one credential field is non-empty (row exists with real data)
        const hasData = Object.entries(creds).some(([k, v]) => k !== 'region' && v !== '');
        if (hasData) {
          localStorage.setItem(SAVED_CREDS_KEY, JSON.stringify(creds));
          setSavedCreds(creds);
          setForm(f => ({ ...f, ...creds }));
        }
      } catch (e) {
        console.warn('Unexpected error loading provision_credentials:', e);
      }
    })();
  }, []);

  // Load locations data
  useEffect(() => {
    loadLocations();
    loadMainLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const [{ data: instances, error }, { data: centres }] = await Promise.all([
        supabase.from('location_instances').select('*').order('created_at', { ascending: false }),
        supabase.from('care_centres_1777090000').select('id, name, suffix, active').order('name'),
      ]);

      if (error) throw error;

      // Add care centres that don't already have a location_instance record
      const instanceNames = new Set((instances || []).map(i => i.location_name?.toLowerCase()));
      const fromCentres = (centres || [])
        .filter(c => !instanceNames.has(c.name?.toLowerCase()))
        .map(c => ({
          id: c.id,
          location_name: c.name,
          slug: c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          status: c.active ? 'active' : 'inactive',
          plan_type: 'quick',
          credits_used: 0,
          monthly_credit_limit: 0,
          netlify_url: null,
          care_type: null,
          created_at: null,
        }));

      setLocations([...(instances || []), ...fromCentres]);
    } catch (err) {
      console.error('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMainLocations = async () => {
    try {
      const { data } = await supabase
        .from('care_centres_1777090000')
        .select('id, name, suffix')
        .eq('active', true)
        .order('name');
      setMainLocations(data || []);
    } catch (err) {
      console.error('Error loading main locations:', err);
    }
  };

  const runQuickRollout = async () => {
    if (!quickForm.namePrefix.trim() || !quickForm.adminEmail.trim()) {
      setQuickError('Location name prefix and admin email are required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(quickForm.adminEmail)) {
      setQuickError('Please enter a valid admin email address.');
      return;
    }
    if (quickProvisionInfra && !savedCreds) {
      setQuickError('No saved credentials found. Save your API credentials in the Full Provision tab first.');
      return;
    }
    if (quickProvisionInfra && savedCreds && !savedCreds.templateRepo) {
      setQuickError('Template Repo is required in your saved credentials (e.g. owner/repo).');
      return;
    }
    setQuickError('');
    setQuickLoading(true);
    setQuickSuccess(null);
    setQuickInfraLog([]);
    setQuickInfraStep(0);
    try {
      const rawSuffix = quickForm.namePrefix.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
      const suffix = rawSuffix.length > 0 ? rawSuffix : 'LOC';
      const { data: centre, error: centreErr } = await supabase
        .from('care_centres_1777090000')
        .insert([{
          name: quickForm.namePrefix.trim(),
          suffix,
          active: true,
          capacity: 20,
        }])
        .select()
        .single();
      if (centreErr) throw centreErr;
      // Create admin user for this location
      const { error: adminErr } = await supabase.from('admin_users_1777025000000').insert([{
        name: `${quickForm.namePrefix.trim()} Admin`,
        email: quickForm.adminEmail.trim(),
        role: 'admin',
        status: 'active',
        location: quickForm.namePrefix.trim(),
        location_id: centre.id,
      }]);
      if (adminErr) {
        console.error('Failed to create admin user:', adminErr);
      }

      let infraResults = null;
      let locationInstanceId = null;

      if (quickProvisionInfra && savedCreds) {
        // Create a location_instance record to track provisioning
        const qslug = quickForm.namePrefix.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const { data: locInst, error: locInstErr } = await supabase.from('location_instances').insert({
          location_name: quickForm.namePrefix.trim(),
          slug: qslug,
          care_type: quickForm.careType,
          status: 'provisioning',
          deployment_phase: 'github',
          plan_type: 'pro',
          monthly_credit_limit: 10000,
          primary_contact_email: quickForm.adminEmail.trim(),
        }).select().single();
        if (locInstErr) throw locInstErr;
        locationInstanceId = locInst?.id || null;

        infraResults = await runQuickInfra(quickForm.namePrefix.trim(), locationInstanceId);
        loadLocations();
      }

      setQuickSuccess({ centre, adminEmail: quickForm.adminEmail, infraResults });
      setQuickForm({ namePrefix: '', adminEmail: '', careType: 'mental_health', parentLocation: '' });
      loadMainLocations();
      loadLocations();
      // Write a sysadmin audit log entry for this rollout
      supabase.from('audit_logs_1777090020').insert([{
        source_type: 'sysadmin',
        actor_name: 'SysAdmin',
        actor_role: 'sysadmin',
        action: 'create',
        resource: `Location: ${centre.name} (${suffix})`,
        detail: `Quick Rollout created care centre with admin ${quickForm.adminEmail}`,
        level: 'info',
      }]).then(({ error: auditErr }) => {
        if (auditErr) console.error('Failed to write audit log:', auditErr);
      });
    } catch (err) {
      setQuickError(friendlyProvisioningErrMsg(err));
    } finally {
      setQuickLoading(false);
      setQuickInfraStep(0);
    }
  };

  const loadLocationUsage = async (locationId) => {
    try {
      const { data, error } = await supabase
        .from('location_daily_usage')
        .select('*')
        .eq('location_id', locationId)
        .order('date', { ascending: true })
        .limit(30);
      
      if (error) throw error;
      setUsageData(data || []);
    } catch (err) {
      console.error('Error loading usage:', err);
    }
  };

  const loadLocationBilling = async (locationId) => {
    try {
      const { data, error } = await supabase
        .from('location_billing')
        .select('*')
        .eq('location_id', locationId)
        .order('billing_period_start', { ascending: false });
      
      if (error) throw error;
      setBillingData(data || []);
    } catch (err) {
      console.error('Error loading billing:', err);
    }
  };

  const loadLocationHealth = async (locationId) => {
    try {
      const { data, error } = await supabase
        .from('location_health_checks')
        .select('*')
        .eq('location_id', locationId)
        .order('checked_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      setHealthData(data || []);
    } catch (err) {
      console.error('Error loading health:', err);
    }
  };

  const loadLocationCredentials = async (locationId) => {
    try {
      const { data, error } = await supabase
        .from('location_credentials')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading credentials:', err);
      return [];
    }
  };

  const loadLocationAlerts = async (locationId) => {
    try {
      const alertResult = await checkAlertRules(locationId);
      if (alertResult.success) {
        setAlerts(alertResult.triggeredRules || []);
      }
    } catch (err) {
      console.error('Error checking alerts:', err);
    }
  };

  const runHealthCheck = async (locationId) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;

    setLoading(true);
    try {
      const result = await checkLocationHealth(locationId, location);
      if (result.success) {
        await loadLocationHealth(locationId);
        await loadLocationAlerts(locationId);
      }
    } catch (err) {
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const log = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { msg, type, time }]);
  };

  const friendlyProvisioningErrMsg = (err) => {
    const raw = err?.message || String(err) || 'Unknown error';
    const lower = raw.toLowerCase();

    // Duplicate slug / unique constraint violation
    if (
      err?.code === '23505' ||
      lower.includes('duplicate key') ||
      (lower.includes('unique') && lower.includes('slug'))
    ) {
      return `A location with that slug already exists in the database (likely a failed previous attempt). ` +
        `Go to the Monitor tab, find the stale entry for this location, and use the "Delete Location" button to remove it. Then retry provisioning.`;
    }

    // Network / fetch failure (CORS, offline, blocked request, or Netlify function timeout)
    if (
      lower.includes('network error during') ||
      lower.includes('load failed') ||
      lower.includes('failed to fetch') ||
      lower.includes('networkerror') ||
      lower.includes('timed out') ||
      lower.includes('non-json response') ||
      lower === 'typeerror: load failed' ||
      lower === 'typeerror: failed to fetch'
    ) {
      // Extract which action failed when available (e.g. 'network error during "create_supabase_project"')
      const actionMatch = raw.match(/during "([^"]+)"/i);
      const where = actionMatch ? ` while running "${actionMatch[1]}"` : '';
      return `Network request failed${where}. Common causes: ` +
        `(1) your API token for this step is invalid or expired — re-enter it in Credentials above; ` +
        `(2) the Netlify provisioner function timed out — check app.netlify.com → Functions → provision-location for server logs; ` +
        `(3) if running locally, use "netlify dev" instead of "npm run dev". ` +
        `Open browser DevTools (F12 → Network tab) for the raw response.`;
    }

    // Supabase Row-Level Security
    if (lower.includes('row-level security') || lower.includes('violates row-level security policy')) {
      const tableMatch = raw.match(/table "([^"]+)"/);
      const table = tableMatch?.[1] || 'location_instances';
      return `Permission denied: your account cannot write to '${table}'. ` +
        `In your Supabase dashboard → Table Editor → ${table} → Policies, ` +
        `add an INSERT policy for the 'anon' role (target roles: anon) with USING (true) and WITH CHECK (true). ` +
        `Then click Retry.`;
    }

    // GitHub errors
    if (lower.startsWith('github:')) {
      if (lower.includes('bad credentials') || lower.includes('401') || lower.includes('requires authentication')) {
        return 'GitHub token is invalid or expired. Update it in the Credentials section above, save, then retry.';
      }
      if (lower.includes('not found') || lower.includes('404')) {
        return 'GitHub template repository not found. Check the GitHub Org and Template Repo fields in Credentials, then retry.';
      }
      if (lower.includes('already exists') || lower.includes('name already exists')) {
        return `A GitHub repository with that name already exists in your org. ` +
          `Delete it first or choose a different Location Name, then retry.`;
      }
      if (lower.includes('403') || lower.includes('forbidden')) {
        return 'GitHub token lacks the required permissions. Make sure it has "repo" and "workflow" scopes, then retry.';
      }
      return `GitHub error: ${raw.replace(/^github:\s*/i, '')} — check your GitHub token and org settings.`;
    }

    // Supabase Management API errors
    if (lower.startsWith('supabase:')) {
      if (lower.includes('invalid api key') || lower.includes('401') || lower.includes('unauthorized')) {
        return 'Supabase Management API token is invalid or expired. Update it in the Credentials section above, save, then retry.';
      }
      if (lower.includes('jwt') || lower.includes('could not be decoded')) {
        return 'Your Supabase Management API token is malformed — Supabase could not parse it as a valid JWT. ' +
          'Go to app.supabase.com → click your avatar (top-right) → Access Tokens, ' +
          'generate a new personal access token, paste it into the Supabase Management Token field ' +
          'in Credentials above, click Save Credentials, then retry.';
      }
      if (lower.includes('not found') || lower.includes('404')) {
        return 'Supabase returned "Not Found" — this usually means the Organization ID is wrong. ' +
          'The Organization ID is NOT the project ref (e.g. "amfikpnctfgesifwdkkd") — it is the slug shown at ' +
          'app.supabase.com → select your org → Settings → General (e.g. "acme-health-xyz123"). ' +
          'Update it in the Credentials section above, save, then retry.';
      }
      if (lower.includes('organization') || lower.includes('org')) {
        return 'Invalid Supabase Organization ID. Find it at app.supabase.com → select your org → Settings → General, update it in Credentials, then retry.';
      }
      return `Supabase error: ${raw.replace(/^supabase:\s*/i, '')} — check your Supabase token and Organization ID.`;
    }

    // Netlify errors
    if (lower.startsWith('netlify:')) {
      if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('invalid token')) {
        return 'Netlify token is invalid or expired. Update it in the Credentials section above, save, then retry.';
      }
      if (lower.includes('already exists') || lower.includes('name already taken')) {
        return `A Netlify site with that name already exists. Delete it in your Netlify dashboard or choose a different Location Name, then retry.`;
      }
      if (lower.includes('site using') || lower.includes('starter') || lower.includes('plan') || lower.includes('limit')) {
        return `Netlify rejected the request due to a plan or site restriction: "${raw.replace(/^netlify:\s*/i, '')}". ` +
          `Check your Netlify plan limits (e.g. env-var count, site count) at app.netlify.com → Team settings, then retry.`;
      }
      return `Netlify error: ${raw.replace(/^netlify:\s*/i, '')} — check your Netlify token and try again.`;
    }

    // Generic Supabase/Postgres codes
    if (lower.includes('jwt') || lower.includes('permission denied') || lower.includes('insufficient_privilege')) {
      return `Database permission denied: ${raw} — check that your Supabase role has the required INSERT/UPDATE privileges and retry.`;
    }

    return safeErrMsg(err, 'Provisioning failed. Check the terminal log above for details.');
  };

  const slug = form.locationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const lookupOrgId = async () => {
    if (!form.supabaseToken) return;
    setOrgLookup(s => ({ ...s, loading: true, error: '' }));
    try {
      const res = await fetch('/.netlify/functions/provision-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_supabase_orgs', supabaseToken: form.supabaseToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrgLookup({ loading: false, error: data.error || `Lookup failed (${res.status})`, orgs: [] });
        return;
      }
      const orgs = Array.isArray(data.orgs) ? data.orgs : [];
      if (orgs.length === 0) {
        setOrgLookup({ loading: false, error: 'No organisations found for this token.', orgs: [] });
        return;
      }
      // Keep orgs loaded so the dropdown stays populated.
      setOrgLookup({ loading: false, error: '', orgs });
      // Auto-select if there's only one org, or if the saved id is no longer valid.
      setForm(f => {
        const stillValid = orgs.some(o => o.id === f.supabaseOrgId);
        if (orgs.length === 1) return { ...f, supabaseOrgId: orgs[0].id };
        if (!stillValid) return { ...f, supabaseOrgId: '' };
        return f;
      });
    } catch (e) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const msg = offline
        ? 'Offline — connect to the internet and tap ↻ to retry, or enter the org slug manually.'
        : `Could not reach the org-lookup service (${e.message}). Tap ↻ to retry, or enter the org slug manually.`;
      setOrgLookup({ loading: false, error: msg, orgs: [] });
    }
  };

  // Auto-fetch orgs whenever the Supabase token changes — user never has to type the org ID.
  useEffect(() => {
    if (!form.supabaseToken) {
      setOrgLookup({ loading: false, error: '', orgs: [] });
      return;
    }
    const t = setTimeout(() => { lookupOrgId(); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.supabaseToken]);

  const runProvisioning = async () => {
    if (!form.locationName || !form.githubToken || !form.netlifyToken || (form.dbMode !== 'manual' && !form.supabaseToken)) {
      setError('Please fill in all required fields before provisioning.');
      return;
    }
    if (form.dbMode === 'manual' && (!form.manualDbUrl || !form.manualDbAnonKey)) {
      setError('Please fill in the Existing DB URL and DB Anon Key in Credentials.');
      return;
    }
    if (!form.templateRepo) {
      setError('Template Repo is required (e.g. owner/repo).');
      return;
    }

    setError('');
    setPhase('running');
    setLogs([]);
    setResults({});
    setCurrentStep(0);

    let locationInstanceId = null;

    try {
      // Create location instance record
      const slug = form.locationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      log(`Provisioning slug: ${slug}`);

      // Clean up any stale failed/incomplete record for this slug so we can start fresh
      const { data: existingRecords } = await supabase
        .from('location_instances')
        .select('id, status')
        .eq('slug', slug);

      if (existingRecords && existingRecords.length > 0) {
        const stale = existingRecords[0];
        if (stale.status === 'active') {
          throw new Error(`A location with slug "${slug}" is already active. Choose a different name or delete the existing location from the Monitor tab.`);
        }
        // status is 'error', 'provisioning', etc. — purge the stale record so we can retry
        log(`⚠️ Found stale "${stale.status}" record for slug "${slug}" — removing it to allow re-provisioning...`, 'warning');
        await supabase.from('location_instances').delete().eq('id', stale.id);
      }

      const { data: locationInstance, error: insertError } = await supabase
        .from('location_instances')
        .insert({
          location_name: form.locationName,
          slug: slug,
          care_type: form.careType,
          status: 'provisioning',
          deployment_phase: 'github',
          plan_type: form.planType,
          monthly_credit_limit: parseFloat(form.monthlyCredits),
          primary_contact_email: form.contactEmail,
          primary_contact_phone: form.contactPhone,
          privacy_mode: form.privacyMode || false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      locationInstanceId = locationInstance.id;

      // All external Management API calls go through the server-side proxy
      // to avoid CORS blocks (Supabase & Netlify APIs reject browser origins).
      const provision = async (action, payload) => {
        let res;
        try {
          res = await fetch('/.netlify/functions/provision-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload }),
          });
        } catch (netErr) {
          // Network-level failure: CORS block, function unreachable, or offline
          throw new Error(`Network error during "${action}" — ${netErr.message}`);
        }

        let data;
        try {
          data = await res.json();
        } catch (parseErr) {
          // Non-JSON body: Netlify returned an HTML error page (e.g. 502/504 timeout)
          throw new Error(
            `Provisioner returned HTTP ${res.status} (${res.statusText || 'no status'}) during "${action}" — ` +
            `the function may have timed out or is not deployed correctly (${parseErr.message}).`
          );
        }

        if (data.error) throw new Error(data.error);
        return data;
      };

      // ── STEP 1: GitHub repo
      const templateBaseName = (form.templateRepo || 'aclocations').split('/').pop();
      const repoName = `${templateBaseName}-${slug}`;
      log(`Creating GitHub repo: ${repoName}...`);
      setCurrentStep(1);

      const ghData = await provision('create_github_repo', {
        githubToken: form.githubToken,
        templateRepo: form.templateRepo,
        githubOrg: form.githubOrg,
        repoName,
        description: `Acute Connect — ${form.locationName}`,
      });
      setResults(r => ({ ...r, repoUrl: ghData.html_url, repoFullName: ghData.full_name }));
      if (ghData.reused) {
        log(`✅ Repo already exists (reusing): ${ghData.html_url}`, 'success');
      } else {
        log(`✅ Repo created: ${ghData.html_url}`, 'success');
      }

      await supabase
        .from('location_instances')
        .update({ github_repo_url: ghData.html_url, github_repo_full_name: ghData.full_name, deployment_phase: 'supabase' })
        .eq('id', locationInstanceId);

      await sleep(2000);

      // ── STEP 2: Database
      setCurrentStep(2);
      let supabaseRef = null;
      let supabaseUrl = null;
      let anonKey = null;

      if (form.dbMode === 'manual') {
        supabaseUrl = form.manualDbUrl;
        anonKey = form.manualDbAnonKey;
        log('✅ Using existing DB credentials (skipping Supabase provisioning)', 'success');
        await supabase
          .from('location_instances')
          .update({ supabase_url: supabaseUrl, deployment_phase: 'netlify' })
          .eq('id', locationInstanceId);
      } else {
        log('Creating Supabase project (this takes ~60 seconds)...');

        const dbPassword = generateDbPassword();
        const sbData = await provision('create_supabase_project', {
          supabaseToken: form.supabaseToken,
          name: `${templateBaseName}-${slug}`,
          organization_id: form.supabaseOrgId,
          plan: 'pro',
          region: form.region,
          db_pass: dbPassword,
        });
        supabaseRef = sbData.id;
        supabaseUrl = `https://${sbData.id}.supabase.co`;
        setResults(r => ({ ...r, supabaseRef, supabaseUrl }));
        log(`✅ Supabase project: ${sbData.id}`, 'success');
        log('Waiting 60s for DB to provision...', 'warning');

        await supabase
          .from('location_instances')
          .update({ supabase_ref: sbData.id, supabase_url: supabaseUrl, deployment_phase: 'netlify' })
          .eq('id', locationInstanceId);

        await sleep(60000);

        const keysData = await provision('get_supabase_keys', {
          supabaseToken: form.supabaseToken,
          projectRef: sbData.id,
        });
        anonKey = keysData.anon_key;
        setResults(r => ({ ...r, supabaseAnonKey: anonKey }));

        await supabase.from('location_credentials').insert([
          { location_id: locationInstanceId, credential_type: 'supabase_anon_key', credential_key: anonKey },
        ]);
      }
      setResults(r => ({ ...r, supabaseUrl, supabaseRef, supabaseAnonKey: anonKey }));

      // ── STEP 3: Netlify site
      log('Creating Netlify site...');
      setCurrentStep(3);

      const nlData = await provision('create_netlify_site', {
        netlifyToken: form.netlifyToken,
        name: `${templateBaseName}-${slug}`,
      });
      setResults(r => ({ ...r, netlifyUrl: nlData.ssl_url, netlifySiteId: nlData.id }));
      log(`✅ Netlify site: ${nlData.ssl_url}`, 'success');

      await supabase
        .from('location_instances')
        .update({ netlify_url: nlData.ssl_url, netlify_site_id: nlData.id, deployment_phase: 'secrets' })
        .eq('id', locationInstanceId);

      await provision('configure_netlify_env', {
        netlifyToken: form.netlifyToken,
        siteId: nlData.id,
        env: {
          VITE_SUPABASE_URL: supabaseUrl || '',
          VITE_SUPABASE_ANON_KEY: anonKey || '',
          VITE_LOCATION_NAME: form.locationName,
        },
      });

      if (form.dbMode !== 'manual' && supabaseRef) {
        await provision('configure_supabase_auth', {
          supabaseToken: form.supabaseToken,
          projectRef: supabaseRef,
          site_url: nlData.ssl_url,
          additional_redirect_urls: [`${nlData.ssl_url}/**`, nlData.ssl_url],
        });
        log('✅ Auth URLs configured', 'success');
      }

      // ── STEP 4: GitHub secrets (instructions only — encryption required)
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

      await sleep(3000);
      const deployResult = await provision('trigger_github_deploy', {
        githubToken: form.githubToken,
        repoFullName: ghData.full_name,
      });

      if (deployResult.ok) {
        log('✅ Deploy triggered — check GitHub Actions tab', 'success');
      } else {
        log(`ℹ️ ${deployResult.message}`, 'warning');
      }

      // Update final status
      await supabase
        .from('location_instances')
        .update({
          status: 'active',
          deployment_phase: 'deploy',
          last_deployed_at: new Date().toISOString(),
        })
        .eq('id', locationInstanceId);

      log('', 'spacer');
      log(`🎉 ${form.locationName} is provisioned!`, 'success');
      setPhase('done');
      
      // Reload locations
      loadLocations();

    } catch (err) {
      const friendly = friendlyProvisioningErrMsg(err);
      const lower = (err?.message || '').toLowerCase();

      log(`❌ Error: ${err.message}`, 'error');
      log(`💡 ${friendly}`, 'warning');

      // Emit specific fix steps based on error type
      if (lower.includes('jwt') || lower.includes('could not be decoded')) {
        log('🔧 Fix steps:', 'info');
        log('   1. Open app.supabase.com → click your avatar (top-right) → Access Tokens', 'info');
        log('   2. Click "Generate new token", give it a name, then copy it', 'info');
        log('   3. Paste it into the Supabase Management Token field in Credentials above', 'info');
        log('   4. Click Save Credentials → then Retry Provisioning', 'info');
      } else if (lower.includes('network error during') || lower.includes('load failed') || lower.includes('failed to fetch') || lower.includes('timed out') || lower.includes('non-json response')) {
        log('🔧 Diagnostic checklist:', 'info');
        log('   1. Open browser DevTools (F12) → Network tab → find the failed provision-location request', 'info');
        log('   2. Check app.netlify.com → Functions → provision-location for server-side logs', 'info');
        log('   3. Verify all API tokens in Credentials are current and have required permissions', 'info');
        log('   4. If running locally, use "netlify dev" instead of "npm run dev"', 'info');
      } else if (lower.startsWith('netlify:') && (lower.includes('site using') || lower.includes('starter') || lower.includes('plan') || lower.includes('limit'))) {
        log('🔧 Fix: check app.netlify.com → Team settings → plan limits (site count, env-var count)', 'info');
        log('   You may need to upgrade your Netlify plan or delete unused sites first', 'info');
      } else if (lower.startsWith('supabase:') && (lower.includes('invalid api key') || lower.includes('unauthorized'))) {
        log('🔧 Fix: app.supabase.com → Account → Access Tokens → generate a new token → Save Credentials → Retry', 'info');
      } else if (lower.startsWith('github:') && lower.includes('already exists')) {
        log('🔧 Fix: go to github.com and delete the existing repo, or choose a different Location Name, then retry', 'info');
      } else if (lower.startsWith('supabase:') && (lower.includes('organization') || lower.includes('org'))) {
        log('🔧 Fix: find your Org ID at supabase.com/dashboard/org → Settings → General → Organisation ID', 'info');
      }

      setError(friendly);
      setPhase('error');
      
      // Update status to error
      if (locationInstanceId) {
        await supabase
          .from('location_instances')
          .update({ status: 'error' })
          .eq('id', locationInstanceId);
      }
    }
  };

  const copyResult = (text) => { 
    navigator.clipboard.writeText(text);
  };

  const deleteLocation = async (id) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }
    try {
      setLoading(true);
      await supabase.from('location_instances').delete().eq('id', id);
      if (selectedLocation?.id === id) setSelectedLocation(null);
      setDeleteConfirmId(null);
      loadLocations();
    } catch (e) {
      console.warn('Delete location failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const CRED_KEYS = ['githubToken', 'githubOrg', 'templateRepo', 'netlifyToken', 'supabaseToken', 'supabaseOrgId', 'dbMode', 'manualDbUrl', 'manualDbAnonKey', 'region'];

  const saveCredentials = async () => {
    const creds = Object.fromEntries(CRED_KEYS.map(k => [k, form[k]]));
    // Persist to localStorage immediately
    localStorage.setItem(SAVED_CREDS_KEY, JSON.stringify(creds));
    setSavedCreds(creds);
    setCredsSaveError('');
    // Upsert to Supabase so credentials survive across devices/sessions
    try {
      const { error } = await supabase.from('provision_credentials').upsert({
        id: 'default',
        github_org: creds.githubOrg || '',
        template_repo: creds.templateRepo || '',
        github_token: creds.githubToken || '',
        netlify_token: creds.netlifyToken || '',
        supabase_token: creds.supabaseToken || '',
        supabase_org_id: creds.supabaseOrgId || '',
        db_mode: creds.dbMode || 'supabase',
        manual_db_url: creds.manualDbUrl || '',
        manual_db_anon_key: creds.manualDbAnonKey || '',
        region: creds.region || DEFAULT_REGION,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase credential save failed:', error.message);
        setCredsSaveError(`Saved locally only — Supabase error: ${error.message}`);
      }
    } catch (e) {
      console.warn('Unexpected error saving credentials to Supabase:', e);
      setCredsSaveError('Saved locally only — could not reach Supabase.');
    }
    setCredsSaved(true);
    setTimeout(() => setCredsSaved(false), 2500);
  };

  const loadCredentials = () => {
    if (!savedCreds) return;
    setForm(f => ({ ...f, ...savedCreds }));
  };

  const qlog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setQuickInfraLog(prev => [...prev, { msg, type, time }]);
  };

  const runQuickInfra = async (locationName, locationInstanceId) => {
    const creds = savedCreds;
    const s = locationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const infraResults = {};

    // Proxy helper — all Management API calls go server-side to avoid CORS blocks
    const provision = async (action, payload) => {
      const res = await fetch('/.netlify/functions/provision-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    };

    // Step 1: GitHub
    const qTemplateName = (creds.templateRepo || 'aclocations').split('/').pop();
    const qRepoName = `${qTemplateName}-${s}`;
    qlog(`Creating GitHub repo: ${qRepoName}...`);
    setQuickInfraStep(1);
    const ghData = await provision('create_github_repo', {
      githubToken: creds.githubToken,
      templateRepo: creds.templateRepo,
      githubOrg: creds.githubOrg,
      repoName: qRepoName,
      description: `Acute Connect — ${locationName}`,
    });
    infraResults.repoUrl = ghData.html_url;
    infraResults.repoFullName = ghData.full_name;
    if (ghData.reused) {
      qlog(`✅ Repo already exists (reusing): ${ghData.html_url}`, 'success');
    } else {
      qlog(`✅ Repo created: ${ghData.html_url}`, 'success');
    }
    if (locationInstanceId) {
      await supabase.from('location_instances').update({ github_repo_url: ghData.html_url, github_repo_full_name: ghData.full_name }).eq('id', locationInstanceId);
    }
    await sleep(2000);

    // Step 2: Database
    setQuickInfraStep(2);
    let supabaseRef = null;
    let supabaseUrl = null;
    let anonKey = null;

    if (creds.dbMode === 'manual') {
      supabaseUrl = creds.manualDbUrl;
      anonKey = creds.manualDbAnonKey;
      qlog('✅ Using existing DB credentials (skipping Supabase provisioning)', 'success');
      if (locationInstanceId) {
        await supabase.from('location_instances').update({ supabase_url: supabaseUrl }).eq('id', locationInstanceId);
      }
    } else {
      qlog('Creating Supabase project (this takes ~60 seconds)...');
      const dbPassword = generateDbPassword();
      const sbData = await provision('create_supabase_project', {
        supabaseToken: creds.supabaseToken,
        name: `${qTemplateName}-${s}`,
        organization_id: creds.supabaseOrgId,
        plan: 'pro',
        region: creds.region || 'ap-southeast-2',
        db_pass: dbPassword,
      });
      supabaseRef = sbData.id;
      supabaseUrl = `https://${sbData.id}.supabase.co`;
      qlog(`✅ Supabase project: ${sbData.id}`, 'success');
      qlog('Waiting 60s for DB to provision...', 'warning');
      if (locationInstanceId) {
        await supabase.from('location_instances').update({ supabase_ref: sbData.id, supabase_url: supabaseUrl }).eq('id', locationInstanceId);
      }
      await sleep(60000);

      const keysData = await provision('get_supabase_keys', {
        supabaseToken: creds.supabaseToken,
        projectRef: sbData.id,
      });
      anonKey = keysData.anon_key;
    }
    infraResults.supabaseRef = supabaseRef;
    infraResults.supabaseUrl = supabaseUrl;
    infraResults.supabaseAnonKey = anonKey;

    // Step 3: Netlify
    qlog('Creating Netlify site...');
    setQuickInfraStep(3);
    const nlData = await provision('create_netlify_site', {
      netlifyToken: creds.netlifyToken,
      name: `${qTemplateName}-${s}`,
    });
    infraResults.netlifyUrl = nlData.ssl_url;
    infraResults.netlifySiteId = nlData.id;
    qlog(`✅ Netlify site: ${nlData.ssl_url}`, 'success');
    if (locationInstanceId) {
      await supabase.from('location_instances').update({ netlify_url: nlData.ssl_url, netlify_site_id: nlData.id, status: 'active', last_deployed_at: new Date().toISOString() }).eq('id', locationInstanceId);
    }

    await provision('configure_netlify_env', {
      netlifyToken: creds.netlifyToken,
      siteId: nlData.id,
      env: { VITE_SUPABASE_URL: infraResults.supabaseUrl || '', VITE_SUPABASE_ANON_KEY: anonKey || '', VITE_LOCATION_NAME: locationName },
    });
    if (creds.dbMode !== 'manual' && supabaseRef) {
      await provision('configure_supabase_auth', {
        supabaseToken: creds.supabaseToken,
        projectRef: supabaseRef,
        site_url: nlData.ssl_url,
        additional_redirect_urls: [`${nlData.ssl_url}/**`, nlData.ssl_url],
      });
    }
    qlog('✅ Environment variables configured', 'success');
    setQuickInfraStep(4);
    qlog('🎉 Infrastructure ready!', 'success');
    return infraResults;
  };

  // Calculate aggregate stats
  const totalLocations = locations.length;
  const activeLocations = locations.filter(l => l.status === 'active').length;
  const totalCreditsUsed = locations.reduce((sum, l) => sum + (l.credits_used || 0), 0);
  const totalMonthlyRevenue = locations.reduce((sum, l) => sum + ((l.credits_used || 0) * 0.01), 0);

  // Helper component for metrics cards
  const MetricCard = ({ icon, label, value, change, trend, color = 'primary', onClick }) => (
    <div 
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, var(--ac-surface) 0%, var(--ac-bg) 100%)',
        border: `1px solid ${color === 'success' ? '#34C759' : color === 'warning' ? '#FF9500' : color === 'danger' ? '#FF3B30' : 'var(--ac-primary)'}`,
        borderRadius: 16,
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: color === 'success' ? '#E8FAF0' : color === 'warning' ? '#FEF9E7' : color === 'danger' ? '#FDEDEC' : 'var(--ac-primary-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <SafeIcon icon={icon} size={20} style={{ color: color === 'success' ? '#34C759' : color === 'warning' ? '#FF9500' : color === 'danger' ? '#FF3B30' : 'var(--ac-primary)' }} />
        </div>
        {change && (
          <div style={{ 
            fontSize: 11, 
            color: trend === 'up' ? '#34C759' : '#FF3B30',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            {change}
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>{value}</div>
    </div>
  );

  return (
    <div className="ac-stack">
      {/* Header with navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Location Rollout & Monitoring</div>
          <p style={{ fontSize: 13, color: 'var(--ac-muted)', marginTop: 4 }}>
            Deploy, monitor, and manage location instances with autonomous provisioning
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            onClick={() => {
              setMonitoringActive(!monitoringActive);
              if (!monitoringActive) {
                // Run immediately when enabled
                runAutonomousMonitoring();
              }
            }}
            icon={monitoringActive ? FiCheckCircle : FiActivity}
            style={{ 
              background: monitoringActive ? '#34C759' : 'var(--ac-border)', 
              color: monitoringActive ? '#fff' : 'var(--ac-text)', 
              border: 'none' 
            }}
          >
            {monitoringActive ? 'Monitoring Active' : 'Start Monitoring'}
          </Button>
          <Button
            onClick={() => setActiveView('quick')}
            icon={FiZap}
            style={{ background: '#10B981', color: '#fff', border: 'none' }}
          >
            Quick Rollout
          </Button>
          <Button
            onClick={() => setActiveView('provision')}
            icon={FiPlus}
            style={{ background: 'var(--ac-primary)', color: '#fff', border: 'none' }}
          >
            Full Provision
          </Button>
        </div>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--ac-border)', marginBottom: 16 }}>
        {[
          { id: 'overview', label: 'Overview', icon: FiBarChart2 },
          { id: 'quick', label: 'Quick Rollout', icon: FiZap },
          { id: 'provision', label: 'Full Provision', icon: FiPlus },
          { id: 'monitor', label: 'Monitor', icon: FiActivity },
          { id: 'billing', label: 'Billing', icon: FiDollarSign },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: activeView === tab.id ? 700 : 500,
              color: activeView === tab.id ? 'var(--ac-primary)' : 'var(--ac-muted)',
              borderBottom: activeView === tab.id ? '2px solid var(--ac-primary)' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <SafeIcon icon={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ OVERVIEW VIEW ═══════════ */}
      {activeView === 'overview' && (
        <div className="ac-stack">
          {/* Metrics Grid */}
          <div className="ac-grid-4">
            <MetricCard
              icon={FiServer}
              label="Total Locations"
              value={totalLocations}
              change="+2 this month"
              trend="up"
              color="primary"
            />
            <MetricCard
              icon={FiCheckCircle}
              label="Active Locations"
              value={activeLocations}
              change={`${Math.round((activeLocations/totalLocations)*100)}% uptime`}
              trend="up"
              color="success"
            />
            <MetricCard
              icon={FiZap}
              label="Total Credits Used"
              value={totalCreditsUsed.toLocaleString()}
              change="+7.8%"
              trend="up"
              color="warning"
            />
            <MetricCard
              icon={FiDollarSign}
              label="Monthly Revenue"
              value={`$${totalMonthlyRevenue.toFixed(2)}`}
              change="+42.5%"
              trend="up"
              color="success"
            />
          </div>

          {/* Locations Table */}
          <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafeIcon icon={FiServer} size={16} />
            <span>All Locations</span>
            <Badge color="gray">{locations.length}</Badge>
          </div>}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>
                <SafeIcon icon={FiRefreshCw} size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ marginTop: 8 }}>Loading locations...</div>
              </div>
            ) : locations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>
                <SafeIcon icon={FiServer} size={32} style={{ opacity: 0.3 }} />
                <div style={{ marginTop: 8, fontSize: 14 }}>No locations yet</div>
                <Button 
                  onClick={() => setActiveView('provision')}
                  icon={FiPlus}
                  style={{ marginTop: 16 }}
                >
                  Provision First Location
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--ac-border)' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Location</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Plan</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Credits Used</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>URL</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map(loc => (
                      <tr key={loc.id} style={{ borderBottom: '1px solid var(--ac-border)' }}>
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{loc.location_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--ac-muted)', fontFamily: 'monospace' }}>{loc.slug}</div>
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          <Badge color={
                            loc.status === 'active' ? 'green' : 
                            loc.status === 'provisioning' ? 'blue' : 
                            loc.status === 'suspended' ? 'amber' : 'red'
                          }>
                            {loc.status}
                          </Badge>
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: 13, textTransform: 'capitalize' }}>{loc.plan_type}</td>
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{(loc.credits_used || 0).toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>/ {(loc.monthly_credit_limit || 0).toLocaleString()}</div>
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          {loc.netlify_url ? (
                            <a href={loc.netlify_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--ac-primary)', textDecoration: 'none' }}>
                              {loc.netlify_url.replace('https://', '')}
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--ac-muted)' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                setSelectedLocation(loc);
                                setDeleteConfirmId(null);
                                loadLocationUsage(loc.id);
                                loadLocationBilling(loc.id);
                                loadLocationHealth(loc.id);
                                loadLocationAlerts(loc.id);
                                setActiveView('monitor');
                              }}
                              style={{
                                background: 'var(--ac-primary-soft)',
                                border: '1px solid var(--ac-primary)',
                                borderRadius: 6,
                                padding: '6px 12px',
                                fontSize: 12,
                                color: 'var(--ac-primary)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <SafeIcon icon={FiEye} size={12} />
                              View
                            </button>
                            {loc.plan_type !== 'quick' && (
                              <>
                                <button
                                  onClick={() => deleteLocation(loc.id)}
                                  disabled={loading}
                                  style={{
                                    background: deleteConfirmId === loc.id ? '#FF3B30' : 'transparent',
                                    border: '1.5px solid #FF3B30',
                                    borderRadius: 6,
                                    padding: '6px 12px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: deleteConfirmId === loc.id ? '#fff' : '#FF3B30',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <SafeIcon icon={FiTrash2} size={12} />
                                  {deleteConfirmId === loc.id ? 'Confirm' : 'Delete'}
                                </button>
                                {deleteConfirmId === loc.id && (
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    style={{ background: 'none', border: '1px solid var(--ac-border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--ac-muted)' }}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Setup Instructions for new environments */}
          <Card title="📋 New Environment Setup Guide" subtitle="Follow these steps to configure a new Acute Care location deployment">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[
                { step: '1', icon: FiGithub, color: '#24292e', title: 'Fork / Template Repo', body: 'Create a new private GitHub repository from the acute-connect template. Grant the deployment bot write access.' },
                { step: '2', icon: FiDatabase, color: '#3ECF8E', title: 'Create Supabase Project', body: 'Provision a new Supabase project in the target region. Copy the project ref and anon key — you\'ll need them for env vars.' },
                { step: '3', icon: FiGlobe, color: '#00AD9F', title: 'Create Netlify Site', body: 'Create a Netlify site linked to the GitHub repo. Set build command: `npm run build` and publish directory: `dist`.' },
                { step: '4', icon: FiKey, color: '#F59E0B', title: 'Set Environment Variables', body: 'Add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_LOCATION_NAME to the Netlify site settings.' },
                { step: '5', icon: FiShield, color: '#7c3aed', title: 'GitHub Secrets', body: 'Add NETLIFY_TOKEN and NETLIFY_SITE_ID as repo secrets so CI/CD can trigger deployments automatically.' },
                { step: '6', icon: FiZap, color: '#10B981', title: 'Trigger Deploy & Register', body: 'Push to main or trigger workflow manually. Then use the Provision tab above to register the location in this dashboard.' },
              ].map(s => (
                <div key={s.step} style={{ background: 'var(--ac-bg)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--ac-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <SafeIcon icon={s.icon} size={18} style={{ color: s.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Step {s.step}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ac-text)' }}>{s.title}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ac-muted)', lineHeight: 1.6 }}>{s.body}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--ac-bg)', borderRadius: 12, border: '1px solid var(--ac-border)', fontSize: 12, color: 'var(--ac-muted)' }}>
              💡 <strong>Automated provisioning:</strong> Use the <button onClick={() => setActiveView('provision')} style={{ background: 'none', border: 'none', color: 'var(--ac-primary)', cursor: 'pointer', fontWeight: 700, fontSize: 12, padding: 0 }}>Provision tab</button> to automate all steps above by supplying your GitHub, Supabase, and Netlify API tokens.
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════ QUICK ROLLOUT VIEW ═══════════ */}
      {activeView === 'quick' && (
        <div className="ac-stack">
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafeIcon icon={FiZap} size={18} style={{ color: '#10B981' }} />
              <span>Quick Care Centre Rollout</span>
            </div>
          } subtitle="Add a care centre location in seconds — no API credentials required">
            <div className="ac-stack">
              <div style={{ padding: '12px 16px', background: '#E8FAF0', border: '1px solid #34C759', borderRadius: 12, fontSize: 13, color: '#065F46', lineHeight: 1.6 }}>
                <strong>⚡ Quick Rollout</strong> creates a care centre location and its admin user immediately in the database.
                Use <button onClick={() => setActiveView('provision')} style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: 0, textDecoration: 'underline' }}>Full Provision</button> to also deploy GitHub, Supabase, and Netlify infrastructure.
              </div>

              {quickError && (
                <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 10, padding: '10px 14px', color: '#c62828', fontSize: 13, display: 'flex', gap: 8 }}>
                  <SafeIcon icon={FiAlertTriangle} size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  {quickError}
                </div>
              )}

              {quickSuccess && (
                <div style={{ background: '#E8FAF0', border: '2px solid #34C759', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <SafeIcon icon={FiCheckCircle} size={20} style={{ color: '#34C759' }} />
                    <span style={{ fontWeight: 800, fontSize: 15, color: '#065F46' }}>Care Centre Created!</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.8 }}>
                    <div><strong>Centre:</strong> {quickSuccess.centre.name} <span style={{ fontFamily: 'monospace', background: '#d1fae5', padding: '2px 6px', borderRadius: 4 }}>{quickSuccess.centre.suffix}</span></div>
                    <div><strong>Admin:</strong> {quickSuccess.adminEmail}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>The admin account has been created and can log in with their email.</div>
                  </div>
                  {quickSuccess.infraResults && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #6EE7B7' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#065F46', marginBottom: 10 }}>🚀 Infrastructure Provisioned</div>
                      <div className="ac-stack" style={{ gap: 6 }}>
                        {[
                          { label: 'GitHub Repo', value: quickSuccess.infraResults.repoUrl },
                          { label: 'Netlify Site', value: quickSuccess.infraResults.netlifyUrl },
                          { label: 'DB URL', value: quickSuccess.infraResults.supabaseUrl },
                          { label: 'Supabase Ref', value: quickSuccess.infraResults.supabaseRef ? `https://supabase.com/dashboard/project/${quickSuccess.infraResults.supabaseRef}` : null },
                        ].filter(r => r.value).map((r, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#d1fae5', borderRadius: 8, padding: '8px 12px' }}>
                            <div>
                              <div style={{ fontSize: 10, color: '#065F46', fontWeight: 700, textTransform: 'uppercase' }}>{r.label}</div>
                              <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#065F46', wordBreak: 'break-all' }}>{r.value}</div>
                            </div>
                            <button onClick={() => copyResult(r.value)} style={{ marginLeft: 8, background: 'none', border: '1px solid #34C759', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: '#065F46', flexShrink: 0 }}>
                              <SafeIcon icon={FiCopy} size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => setQuickSuccess(null)} style={{ marginTop: 12, background: 'none', border: '1px solid #34C759', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#065F46', fontWeight: 600 }}>
                    Add Another
                  </button>
                </div>
              )}

              <div className="ac-grid-2">
                <Field label="Location Name Prefix *" hint="This becomes the care centre name">
                  <Input
                    value={quickForm.namePrefix}
                    onChange={e => setQuickForm(f => ({ ...f, namePrefix: e.target.value }))}
                    placeholder="e.g. Bondi Beach Clinic"
                  />
                </Field>
                <Field label="Admin Email *" hint="Admin user will be created with this email">
                  <Input
                    type="email"
                    value={quickForm.adminEmail}
                    onChange={e => setQuickForm(f => ({ ...f, adminEmail: e.target.value }))}
                    placeholder="admin@location.com.au"
                  />
                </Field>
              </div>
              <div className="ac-grid-2">
                <Field label="Care Type">
                  <Select
                    value={quickForm.careType}
                    onChange={e => setQuickForm(f => ({ ...f, careType: e.target.value }))}
                    options={CARE_TYPES}
                  />
                </Field>
                <Field label="Parent Location (optional)" hint="Select if this is a sub-centre under a main location">
                  <Select
                    value={quickForm.parentLocation}
                    onChange={e => setQuickForm(f => ({ ...f, parentLocation: e.target.value }))}
                    options={[
                      { value: '', label: '— Main location (no parent) —' },
                      ...mainLocations.map(l => ({ value: l.id, label: l.name })),
                    ]}
                  />
                </Field>
              </div>

              {quickForm.namePrefix && (
                <div style={{ fontSize: 12, color: 'var(--ac-muted)', background: 'var(--ac-bg)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--ac-border)' }}>
                  <SafeIcon icon={FiServer} size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Will create care centre: <strong style={{ color: 'var(--ac-primary)' }}>{quickForm.namePrefix}</strong>
                  {' '}with suffix code <strong style={{ fontFamily: 'monospace', color: 'var(--ac-primary)' }}>{(quickForm.namePrefix.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()) || 'LOC'}</strong>
                  {quickForm.parentLocation && mainLocations.find(l => l.id === quickForm.parentLocation) && (
                    <> under <strong style={{ color: 'var(--ac-primary)' }}>{mainLocations.find(l => l.id === quickForm.parentLocation).name}</strong></>
                  )}
                </div>
              )}

              {/* Infra provisioning toggle */}
              <div style={{ padding: '14px 16px', background: savedCreds ? '#EFF6FF' : 'var(--ac-bg)', border: `1px solid ${savedCreds ? '#3B82F6' : 'var(--ac-border)'}`, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="quick_provision_infra"
                    checked={quickProvisionInfra}
                    onChange={e => setQuickProvisionInfra(e.target.checked)}
                    disabled={!savedCreds}
                    style={{ width: 16, height: 16, cursor: savedCreds ? 'pointer' : 'not-allowed', marginTop: 2 }}
                  />
                  <label htmlFor="quick_provision_infra" style={{ fontSize: 13, cursor: savedCreds ? 'pointer' : 'default', flex: 1 }}>
                    <strong>🚀 Also provision GitHub repo, Supabase project &amp; Netlify site</strong>
                    {savedCreds ? (
                      <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 3 }}>
                        Uses saved credentials — org: <strong>{savedCreds.githubOrg}</strong> · region: <strong>{savedCreds.region || 'ap-southeast-2'}</strong>
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 3 }}>
                        Save your API credentials in the <button onClick={() => setActiveView('provision')} style={{ background: 'none', border: 'none', color: 'var(--ac-primary)', cursor: 'pointer', fontWeight: 700, fontSize: 11, padding: 0 }}>Full Provision tab</button> first to enable this option.
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Live infra step progress during loading */}
              {quickLoading && quickProvisionInfra && (
                <div>
                  <div style={{ display: 'flex', gap: 0, overflowX: 'auto', marginBottom: 12 }}>
                    {[
                      { step: 1, icon: FiGithub, label: 'GitHub' },
                      { step: 2, icon: FiDatabase, label: 'Supabase' },
                      { step: 3, icon: FiGlobe, label: 'Netlify' },
                      { step: 4, icon: FiCheck, label: 'Config' },
                    ].map((p, i) => {
                      const done = quickInfraStep > p.step;
                      const active = quickInfraStep === p.step;
                      return (
                        <div key={p.step} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', margin: '0 auto 4px', background: done ? '#34C759' : active ? 'var(--ac-primary)' : 'var(--ac-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                            <SafeIcon icon={p.icon} size={13} style={{ color: done || active ? '#fff' : 'var(--ac-muted)' }} />
                          </div>
                          <div style={{ fontSize: 10, color: active ? 'var(--ac-primary)' : done ? '#34C759' : 'var(--ac-muted)', fontWeight: active ? 700 : 400 }}>{p.label}</div>
                          {i < 3 && <div style={{ position: 'absolute', top: 14, left: '50%', right: '-50%', height: 2, background: done ? '#34C759' : 'var(--ac-border)', zIndex: -1 }} />}
                        </div>
                      );
                    })}
                  </div>
                  {quickInfraLog.length > 0 && (
                    <div style={{ background: '#0F172A', borderRadius: 10, padding: '10px 14px', fontFamily: 'monospace', maxHeight: 160, overflowY: 'auto' }}>
                      {quickInfraLog.map((l, i) => (
                        <div key={i} style={{ fontSize: 11, marginBottom: 2, color: l.type === 'error' ? '#F87171' : l.type === 'success' ? '#4ADE80' : l.type === 'warning' ? '#FCD34D' : '#94A3B8', lineHeight: 1.6 }}>
                          <span style={{ color: '#475569', marginRight: 8 }}>[{l.time}]</span>{l.msg}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={runQuickRollout}
                disabled={quickLoading || !quickForm.namePrefix.trim() || !quickForm.adminEmail.trim()}
                icon={quickLoading ? FiRefreshCw : FiZap}
                style={{ width: '100%', background: '#10B981', border: 'none', color: '#fff', fontSize: 15, padding: '14px 0' }}
              >
                {quickLoading
                  ? (quickProvisionInfra ? (quickInfraStep === 0 ? 'Creating centre…' : quickInfraStep === 1 ? 'Creating GitHub repo…' : quickInfraStep === 2 ? 'Provisioning Supabase (~60s)…' : quickInfraStep === 3 ? 'Creating Netlify site…' : 'Configuring…') : 'Creating…')
                  : quickProvisionInfra ? '⚡ Quick Rollout — Create Centre + Infrastructure' : '⚡ Quick Rollout — Create Care Centre'}
              </Button>
            </div>
          </Card>

          {/* Existing care centres */}
          <Card title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafeIcon icon={FiUsers} size={16} />
              <span>Existing Care Centres</span>
              <Badge color="gray">{mainLocations.length}</Badge>
            </div>
          }>
            {mainLocations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--ac-muted)', fontSize: 13 }}>
                No care centres yet. Use Quick Rollout above to add the first one.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--ac-border)' }}>
                      {['Centre Name', 'Suffix', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mainLocations.map(loc => (
                      <tr key={loc.id} style={{ borderBottom: '1px solid var(--ac-border)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600, fontSize: 13 }}>{loc.name}</td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: 13 }}>{loc.suffix}</td>
                        <td style={{ padding: '12px 8px' }}><Badge color="green">Active</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ═══════════ PROVISION VIEW ═══════════ */}
      {activeView === 'provision' && (
        <div className="ac-stack">
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
              <div className="ac-grid-2">
                <Field label="Plan Type">
                  <Select value={form.planType} onChange={e => setForm(f => ({ ...f, planType: e.target.value }))}
                    options={[
                      { value: 'starter', label: 'Starter - $299/mo' },
                      { value: 'pro', label: 'Professional - $699/mo' },
                      { value: 'enterprise', label: 'Enterprise - Custom' },
                    ]} />
                </Field>
                <Field label="Monthly Credit Limit">
                  <Input 
                    type="number" 
                    value={form.monthlyCredits} 
                    onChange={e => setForm(f => ({ ...f, monthlyCredits: e.target.value }))}
                    placeholder="10000" 
                  />
                </Field>
              </div>
              <div className="ac-grid-2">
                <Field label="Primary Contact Email">
                  <Input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                    placeholder="admin@location.com" type="email" />
                </Field>
                <Field label="Primary Contact Phone">
                  <Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                    placeholder="+61 4XX XXX XXX" type="tel" />
                </Field>
              </div>
              {form.locationName && (
                <div style={{ fontSize: 12, color: 'var(--ac-muted)', background: 'var(--ac-bg)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--ac-border)' }}>
                  <SafeIcon icon={FiServer} size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Will create: <strong style={{ fontFamily: 'monospace', color: 'var(--ac-primary)' }}>{(form.templateRepo ? form.templateRepo.split('/').pop() : 'aclocations')}-{slug}</strong> (repo, site, DB)
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid var(--ac-border)', marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="privacy_mode"
                  checked={form.privacyMode || false}
                  onChange={e => setForm(f => ({ ...f, privacyMode: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="privacy_mode" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  🔒 Privacy Mode — prevent SysAdmin from viewing this location's data
                </label>
              </div>
            </div>
          </Card>

      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <span>API Credentials</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {savedCreds && (
              <button
                onClick={loadCredentials}
                title="Repopulate form from saved credentials"
                style={{ background: '#EFF6FF', border: '1px solid #3B82F6', borderRadius: 8, cursor: 'pointer', color: '#1D4ED8', fontSize: 12, fontWeight: 600, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <SafeIcon icon={FiUploadCloud} size={13} />
                Load Saved
              </button>
            )}
            <button
              onClick={saveCredentials}
              title="Save these credentials so you can repopulate them later"
              style={{ background: credsSaved ? '#E8FAF0' : 'var(--ac-bg)', border: `1px solid ${credsSaved ? '#34C759' : 'var(--ac-border)'}`, borderRadius: 8, cursor: 'pointer', color: credsSaved ? '#065F46' : 'var(--ac-text)', fontSize: 12, fontWeight: 600, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s' }}
            >
              <SafeIcon icon={credsSaved ? FiCheckCircle : FiSave} size={13} />
              {credsSaved ? 'Saved!' : 'Save Credentials'}
            </button>
            <button onClick={() => setShowTokens(t => !t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac-primary)', fontSize: 12 }}>
              {showTokens ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      }>
        <div className="ac-stack">
          <div className="ac-grid-2">
            <Field label="GitHub Org / Username">
              <Input value={form.githubOrg} onChange={e => setForm(f => ({ ...f, githubOrg: e.target.value }))} placeholder="your-org" />
            </Field>
            <Field label="Template Repo">
              <Input value={form.templateRepo} onChange={e => setForm(f => ({ ...f, templateRepo: e.target.value }))} placeholder="owner/repo" />
            </Field>
          </div>
          {[
            { key: 'githubToken', label: 'GitHub PAT (repo + workflow + admin:repo_hook)', placeholder: 'ghp_...' },
            { key: 'netlifyToken', label: 'Netlify Personal Access Token', placeholder: 'nfp_...' },
          ].map(f => (
            <Field key={f.key} label={f.label} hint={f.hint}>
              <Input
                type={showTokens ? 'text' : 'password'}
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </Field>
          ))}

          {/* Database mode toggle */}
          <Field label="Database" hint="Choose whether to auto-provision a new Supabase project or supply existing credentials.">
            <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--ac-border)', width: 'fit-content' }}>
              {[
                { value: 'supabase', label: '🆕 Auto-provision Supabase' },
                { value: 'manual', label: '🗄️ Use existing DB' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, dbMode: opt.value }))}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: form.dbMode === opt.value ? 'var(--ac-primary)' : 'var(--ac-bg)',
                    color: form.dbMode === opt.value ? '#fff' : 'var(--ac-muted)',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {form.dbMode === 'supabase' ? (
            <>
              {[
                { key: 'supabaseToken', label: 'Supabase Management API Token', placeholder: 'sbp_...' },
                { key: 'supabaseOrgId', label: 'Supabase Organization', placeholder: '', hint: 'Loaded automatically from your Supabase token — pick from the dropdown.' },
              ].map(f => (
                <Field key={f.key} label={f.label} hint={f.key === 'supabaseOrgId' ? null : f.hint}>
                  {f.key === 'supabaseOrgId' ? (
                    <div>
                      {manualOrgEntry || (orgLookup.error && orgLookup.orgs.length === 0) ? (
                        <div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Input
                              value={form.supabaseOrgId}
                              onChange={e => setForm(prev => ({ ...prev, supabaseOrgId: e.target.value }))}
                              placeholder="org-slug-from-supabase-settings"
                              style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                            />
                            <button
                              type="button"
                              onClick={() => { setManualOrgEntry(false); lookupOrgId(); }}
                              disabled={!form.supabaseToken || orgLookup.loading}
                              title="Try the dropdown lookup again"
                              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: form.supabaseToken ? 'var(--ac-primary)' : 'var(--ac-border)', color: form.supabaseToken ? '#fff' : 'var(--ac-muted)', fontSize: 12, fontWeight: 600, cursor: form.supabaseToken && !orgLookup.loading ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                            >
                              {orgLookup.loading ? '…' : '↻'}
                            </button>
                          </div>
                          {orgLookup.error && (
                            <div style={{ marginTop: 4, fontSize: 11, color: '#c62828' }}>
                              {orgLookup.error} — enter the org slug manually below, or tap ↻ to retry the lookup.
                            </div>
                          )}
                          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ac-muted)' }}>
                            Find it at app.supabase.com → your org → Settings → General → Organization slug.
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select
                              value={form.supabaseOrgId}
                              onChange={e => setForm(prev => ({ ...prev, supabaseOrgId: e.target.value }))}
                              disabled={!form.supabaseToken || orgLookup.loading || orgLookup.orgs.length === 0}
                              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: 'var(--ac-bg)', color: 'var(--ac-text)', fontSize: 13, fontFamily: 'inherit' }}
                            >
                              {!form.supabaseToken && <option value="">Enter your Supabase token first…</option>}
                              {form.supabaseToken && orgLookup.loading && <option value="">Loading organizations…</option>}
                              {form.supabaseToken && !orgLookup.loading && orgLookup.orgs.length === 0 && !orgLookup.error && (
                                <option value="">No organizations available</option>
                              )}
                              {orgLookup.orgs.length > 0 && <option value="">— Select an organization —</option>}
                              {orgLookup.orgs.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={lookupOrgId}
                              disabled={!form.supabaseToken || orgLookup.loading}
                              title="Refresh organization list"
                              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--ac-border)', background: form.supabaseToken ? 'var(--ac-primary)' : 'var(--ac-border)', color: form.supabaseToken ? '#fff' : 'var(--ac-muted)', fontSize: 12, fontWeight: 600, cursor: form.supabaseToken && !orgLookup.loading ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                            >
                              {orgLookup.loading ? '…' : '↻'}
                            </button>
                          </div>
                          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>
                              {form.supabaseOrgId
                                ? <span style={{ fontFamily: 'monospace' }}>id: {form.supabaseOrgId}</span>
                                : f.hint}
                            </div>
                            <button
                              type="button"
                              onClick={() => setManualOrgEntry(true)}
                              style={{ background: 'none', border: 'none', color: 'var(--ac-primary)', fontSize: 11, cursor: 'pointer', padding: 0, fontWeight: 600 }}
                            >
                              Enter manually
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input
                      type={showTokens ? 'text' : 'password'}
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ fontFamily: 'monospace', fontSize: 12 }}
                    />
                  )}
                </Field>
              ))}
            </>
          ) : (
            <>
              <Field label="Existing DB URL" hint="e.g. https://xxxx.supabase.co or any compatible Postgres API URL">
                <Input
                  type={showTokens ? 'text' : 'password'}
                  value={form.manualDbUrl}
                  onChange={e => setForm(f => ({ ...f, manualDbUrl: e.target.value }))}
                  placeholder="https://xxxx.supabase.co"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Field>
              <Field label="DB Anon Key" hint="The public anon/API key for the database — injected as VITE_SUPABASE_ANON_KEY on Netlify">
                <Input
                  type={showTokens ? 'text' : 'password'}
                  value={form.manualDbAnonKey}
                  onChange={e => setForm(f => ({ ...f, manualDbAnonKey: e.target.value }))}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
              </Field>
            </>
          )}
        </div>
      </Card>

      {credsSaveError && (
        <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 12, padding: '10px 16px', color: '#795548', fontSize: 12, display: 'flex', gap: 8 }}>
          <SafeIcon icon={FiAlertTriangle} size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {credsSaveError}
        </div>
      )}

      {error && (
        <div style={{ background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 12, padding: '12px 16px', color: '#c62828', fontSize: 13, display: 'flex', gap: 8 }}>
          <SafeIcon icon={FiAlertTriangle} size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* Phase pipeline */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
        {PHASES.map((p, i) => {
          const skipped = form.dbMode === 'manual' && p.id === 'database';
          const done = skipped || phase === 'done' || currentStep > i + 1;
          const active = !skipped && phase === 'running' && currentStep === i + 1;
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
          disabled={!form.locationName || !form.githubToken || !form.netlifyToken || (form.dbMode !== 'manual' && !form.supabaseToken) || (form.dbMode === 'manual' && (!form.manualDbUrl || !form.manualDbAnonKey))}
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
              ...(form.dbMode !== 'manual' ? [{ label: 'Supabase Project', value: results.supabaseRef ? `https://supabase.com/dashboard/project/${results.supabaseRef}` : null }] : []),
              { label: 'DB URL', value: results.supabaseUrl },
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
        </div>
      )}

      {/* ═══════════ MONITOR VIEW ═══════════ */}
      {activeView === 'monitor' && (
        <div className="ac-stack">
          {selectedLocation ? (
            <>
              {/* Location Header */}
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{selectedLocation.location_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--ac-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                      {selectedLocation.slug}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Badge color={
                      selectedLocation.status === 'active' ? 'green' : 
                      selectedLocation.status === 'provisioning' ? 'blue' : 
                      'red'
                    }>
                      {selectedLocation.status}
                    </Badge>
                    <Badge color="violet">{selectedLocation.plan_type}</Badge>
                    <button
                      onClick={() => deleteLocation(selectedLocation.id)}
                      disabled={loading}
                      style={{
                        background: deleteConfirmId === selectedLocation.id ? 'var(--ac-danger, #FF3B30)' : 'transparent',
                        border: '1.5px solid var(--ac-danger, #FF3B30)',
                        borderRadius: 8,
                        padding: '5px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        color: deleteConfirmId === selectedLocation.id ? '#fff' : 'var(--ac-danger, #FF3B30)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <SafeIcon icon={FiTrash2} size={12} />
                      {deleteConfirmId === selectedLocation.id ? 'Confirm Delete' : 'Delete Location'}
                    </button>
                    {deleteConfirmId === selectedLocation.id && (
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        style={{ background: 'none', border: '1px solid var(--ac-border)', borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--ac-muted)' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ac-border)' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>Netlify URL</div>
                    <a href={selectedLocation.netlify_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--ac-primary)', textDecoration: 'none', fontWeight: 600 }}>
                      {selectedLocation.netlify_url?.replace('https://', '') || '—'}
                    </a>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>GitHub Repo</div>
                    <a href={selectedLocation.github_repo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--ac-primary)', textDecoration: 'none', fontWeight: 600 }}>
                      {selectedLocation.github_repo_full_name || '—'}
                    </a>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>Supabase Project</div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                      {selectedLocation.supabase_ref || '—'}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Metrics Grid */}
              <div className="ac-grid-4">
                <MetricCard
                  icon={FiActivity}
                  label="API Requests"
                  value={usageData.reduce((sum, d) => sum + (d.total_requests || 0), 0).toLocaleString()}
                  change="+12.3%"
                  trend="up"
                  color="primary"
                />
                <MetricCard
                  icon={FiZap}
                  label="Credits Used"
                  value={(selectedLocation.credits_used || 0).toLocaleString()}
                  change={`${Math.round((selectedLocation.credits_used / selectedLocation.monthly_credit_limit) * 100)}% of limit`}
                  color="warning"
                />
                <MetricCard
                  icon={FiCheckCircle}
                  label="Uptime"
                  value={healthData[0]?.uptime_percentage?.toFixed(1) + '%' || '—'}
                  change="Last 30 days"
                  color="success"
                />
                <MetricCard
                  icon={FiClock}
                  label="Avg Response"
                  value={healthData[0]?.response_time_ms?.toFixed(0) + 'ms' || '—'}
                  change="p95 latency"
                  color="primary"
                />
              </div>

              {/* Usage Chart */}
              <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeIcon icon={FiTrendingUp} size={16} />
                <span>API Usage Over Time</span>
              </div>}>
                {usageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={usageData}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--ac-primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--ac-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ac-border)" />
                      <XAxis dataKey="date" style={{ fontSize: 11 }} stroke="var(--ac-muted)" />
                      <YAxis style={{ fontSize: 11 }} stroke="var(--ac-muted)" />
                      <Tooltip 
                        contentStyle={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 8 }}
                      />
                      <Area type="monotone" dataKey="total_requests" stroke="var(--ac-primary)" fillOpacity={1} fill="url(#colorUsage)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>
                    No usage data available yet
                  </div>
                )}
              </Card>

              {/* Health Status */}
              {healthData.length > 0 && (
                <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafeIcon icon={FiShield} size={16} />
                  <span>Health Status</span>
                </div>}>
                  <div className="ac-grid-3">
                    <div style={{ padding: 16, background: 'var(--ac-bg)', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 8 }}>Netlify</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: healthData[0].netlify_status === 'up' ? '#34C759' : '#FF3B30' }} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          {healthData[0].netlify_status === 'up' ? 'Operational' : 'Down'}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--ac-bg)', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 8 }}>Supabase</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: healthData[0].supabase_status === 'up' ? '#34C759' : '#FF3B30' }} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          {healthData[0].supabase_status === 'up' ? 'Operational' : 'Down'}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: 16, background: 'var(--ac-bg)', borderRadius: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 8 }}>GitHub</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: healthData[0].github_status === 'up' ? '#34C759' : '#FF3B30' }} />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          {healthData[0].github_status === 'up' ? 'Operational' : 'Down'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Active Alerts */}
              {alerts.length > 0 && (
                <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafeIcon icon={FiBell} size={16} />
                  <span>Active Alerts</span>
                  <Badge color="red">{alerts.length}</Badge>
                </div>}>
                  <div className="ac-stack" style={{ gap: 8 }}>
                    {alerts.map((alert, idx) => (
                      <div key={idx} style={{
                        padding: 14,
                        background: '#FDEDEC',
                        border: '1px solid #FF3B30',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}>
                        <SafeIcon icon={FiAlertCircle} size={18} style={{ color: '#FF3B30', flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#C62828', marginBottom: 4 }}>
                            {alert.rule_type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div style={{ fontSize: 12, color: '#8B0000' }}>
                            {alert.message}
                          </div>
                          <div style={{ fontSize: 11, color: '#8B0000', marginTop: 6 }}>
                            Last triggered: {alert.last_triggered_at ? new Date(alert.last_triggered_at).toLocaleString() : 'Just now'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Provisioned Resource IDs (NOT the API tokens entered in Setup —
                  those live globally in the Provision tab's API Credentials card.) */}
              <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafeIcon icon={FiKey} size={16} />
                  <span>Provisioned Resource IDs</span>
                  <Badge color="gray">Per-location</Badge>
                </div>
                <Button
                  onClick={() => runHealthCheck(selectedLocation.id)}
                  icon={FiRefreshCw}
                  style={{ fontSize: 12, padding: '6px 12px' }}
                  disabled={loading}
                >
                  {loading ? 'Checking...' : 'Run Health Check'}
                </Button>
              </div>}>
                <div className="ac-stack">
                  <div style={{ padding: 12, background: '#EFF6FF', border: '1px solid #3B82F6', borderRadius: 10, fontSize: 12, color: '#1E3A8A', display: 'flex', gap: 8 }}>
                    <SafeIcon icon={FiShield} size={16} style={{ flexShrink: 0 }} />
                    <div>
                      These are the IDs of the resources created when this location was provisioned. To view or edit the API tokens used during Setup (GitHub PAT, Netlify PAT, Supabase Management Token, Supabase Organization), open the <strong>Provision</strong> tab → <strong>API Credentials</strong>.
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, padding: '12px 0' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Type</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Key</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Action</div>
                  </div>
                  {[
                    { type: 'Netlify Site ID', value: selectedLocation.netlify_site_id },
                    { type: 'Supabase Project', value: selectedLocation.supabase_ref },
                    { type: 'Supabase URL', value: selectedLocation.supabase_url },
                    { type: 'GitHub Repo', value: selectedLocation.github_repo_full_name },
                  ].filter(cred => cred.value).map((cred, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, padding: '10px 0', borderTop: '1px solid var(--ac-border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{cred.type}</div>
                      <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--ac-muted)' }}>
                        {showTokens ? cred.value : '••••••••••••••••'}
                      </div>
                      <button 
                        onClick={() => copyResult(cred.value)} 
                        style={{ 
                          background: 'none', 
                          border: '1px solid var(--ac-border)', 
                          borderRadius: 6, 
                          padding: '4px 8px', 
                          cursor: 'pointer', 
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <SafeIcon icon={FiCopy} size={12} />
                        Copy
                      </button>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, textAlign: 'right' }}>
                    <button 
                      onClick={() => setShowTokens(!showTokens)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--ac-border)',
                        borderRadius: 8,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--ac-primary)',
                      }}
                    >
                      {showTokens ? 'Hide Values' : 'Show Values'}
                    </button>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>
                <SafeIcon icon={FiEye} size={32} style={{ opacity: 0.3 }} />
                <div style={{ marginTop: 8 }}>Select a location from the Overview to view monitoring data</div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════ BILLING VIEW ═══════════ */}
      {activeView === 'billing' && (
        <div className="ac-stack">
          {selectedLocation ? (
            <>
              {/* Billing Summary */}
              <div className="ac-grid-3">
                <MetricCard
                  icon={FiDollarSign}
                  label="Current Month"
                  value={`$${((selectedLocation.credits_used || 0) * 0.01).toFixed(2)}`}
                  change="Usage charges"
                  color="primary"
                />
                <MetricCard
                  icon={FiCreditCard}
                  label="Plan Fee"
                  value={selectedLocation.plan_type === 'pro' ? '$299' : selectedLocation.plan_type === 'enterprise' ? 'Custom' : '$99'}
                  change="Monthly subscription"
                  color="success"
                />
                <MetricCard
                  icon={FiTrendingUp}
                  label="Total Due"
                  value={(() => {
                    const planFees = { starter: 99, pro: 299, enterprise: 0 };
                    const base = planFees[selectedLocation.plan_type] ?? 299;
                    const ai = selectedLocation.ai_enabled ? 150 : 0;
                    const agents = (selectedLocation.field_agent_count || 0) * 100;
                    const push = selectedLocation.push_notification_pack ? 75 : 0;
                    const usage = (selectedLocation.credits_used || 0) * 0.01;
                    return `$${(usage + base + ai + agents + push).toFixed(2)}`;
                  })()}
                  change="This billing cycle"
                  color="warning"
                />
              </div>

              {/* Add-on fee breakdown */}
              {(selectedLocation.ai_enabled || (selectedLocation.field_agent_count || 0) > 0 || selectedLocation.push_notification_pack) && (
                <Card title="Active Add-ons">
                  <div>
                    {selectedLocation.ai_enabled && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--ac-border)', fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>🤖 AI Engine</span>
                        <span style={{ fontWeight: 700 }}>$150/month</span>
                      </div>
                    )}
                    {(selectedLocation.field_agent_count || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--ac-border)', fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>🚑 Field Agents ({selectedLocation.field_agent_count} × $100)</span>
                        <span style={{ fontWeight: 700 }}>${selectedLocation.field_agent_count * 100}/month</span>
                      </div>
                    )}
                    {selectedLocation.push_notification_pack && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>🔔 Push Notification Pack (+5/month)</span>
                        <span style={{ fontWeight: 700 }}>$75/month</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Billing History */}
              <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeIcon icon={FiCreditCard} size={16} />
                <span>Billing History</span>
              </div>}>
                {billingData.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--ac-border)' }}>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Period</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Credits</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Usage</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Subscription</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Add-ons</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Total</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--ac-muted)', textTransform: 'uppercase' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingData.map(bill => (
                          <tr key={bill.id} style={{ borderBottom: '1px solid var(--ac-border)' }}>
                            <td style={{ padding: '14px 8px', fontSize: 13 }}>
                              {new Date(bill.billing_period_start).toLocaleDateString()} - {new Date(bill.billing_period_end).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '14px 8px', fontSize: 13 }}>{(bill.credits_used || 0).toLocaleString()}</td>
                            <td style={{ padding: '14px 8px', fontSize: 13, fontWeight: 600 }}>${(bill.usage_charge || 0).toFixed(2)}</td>
                            <td style={{ padding: '14px 8px', fontSize: 13 }}>${(bill.base_subscription_fee || 0).toFixed(2)}</td>
                            <td style={{ padding: '14px 8px', fontSize: 13 }}>
                              {((bill.ai_addon_fee || 0) + (bill.field_agent_addon_fee || 0) + (bill.push_notification_fee || 0)) > 0
                                ? `$${((bill.ai_addon_fee || 0) + (bill.field_agent_addon_fee || 0) + (bill.push_notification_fee || 0)).toFixed(2)}`
                                : '—'}
                            </td>
                            <td style={{ padding: '14px 8px', fontSize: 14, fontWeight: 700 }}>${(bill.total_amount || 0).toFixed(2)}</td>
                            <td style={{ padding: '14px 8px' }}>
                              <Badge color={
                                bill.status === 'paid' ? 'green' : 
                                bill.status === 'pending' ? 'blue' : 
                                'red'
                              }>
                                {bill.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>
                    No billing records yet
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--ac-muted)' }}>
                <SafeIcon icon={FiDollarSign} size={32} style={{ opacity: 0.3 }} />
                <div style={{ marginTop: 8 }}>Select a location from the Overview to view billing data</div>
              </div>
            </Card>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
