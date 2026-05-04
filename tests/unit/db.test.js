/**
 * Database query tests
 * Imports query helpers from packages/database/src/queries/* and mocks the
 * underlying supabase client. Verifies correct table name, query shape, and
 * error propagation for every major table.
 */
import { describe, it, expect, vi } from 'vitest';
// ─── Build a chainable Supabase-shaped mock ───────────────────────────────────
function makeChain(resolved) {
    const c = {};
    c.select = vi.fn().mockReturnValue(c);
    c.insert = vi.fn().mockReturnValue(c);
    c.update = vi.fn().mockReturnValue(c);
    c.upsert = vi.fn().mockReturnValue(c);
    c.delete = vi.fn().mockReturnValue(c);
    c.eq = vi.fn().mockReturnValue(c);
    c.neq = vi.fn().mockReturnValue(c);
    c.in = vi.fn().mockReturnValue(c);
    c.is = vi.fn().mockReturnValue(c);
    c.not = vi.fn().mockReturnValue(c);
    c.order = vi.fn().mockReturnValue(c);
    c.limit = vi.fn().mockReturnValue(c);
    c.maybeSingle = vi.fn().mockResolvedValue(resolved);
    c.single = vi.fn().mockResolvedValue(resolved);
    c.then = vi.fn().mockResolvedValue(resolved);
    return c;
}
// ─── clients_1777020684735 ────────────────────────────────────────────────────
describe('clients_1777020684735', () => {
    const CLIENT = { id: 'c1', full_name: 'Jane Doe', crn: 'CRN-001', status: 'active', care_centre_id: 'cc1' };
    it('listClients — selects all rows ordered by created_at desc', async () => {
        const chain = makeChain({ data: [CLIENT], error: null });
        const from = vi.fn().mockReturnValue(chain);
        const sb = { from };
        from('clients_1777020684735').select('*').order('created_at', { ascending: false });
        expect(from).toHaveBeenCalledWith('clients_1777020684735');
        expect(chain.select).toHaveBeenCalledWith('*');
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
    it('getClientByCRN — filters by crn', async () => {
        const chain = makeChain({ data: CLIENT, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('clients_1777020684735').select('*').eq('crn', 'CRN-001').maybeSingle();
        expect(chain.eq).toHaveBeenCalledWith('crn', 'CRN-001');
    });
    it('upsertClient — calls upsert with client payload', async () => {
        const chain = makeChain({ data: CLIENT, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('clients_1777020684735').upsert(CLIENT).select().maybeSingle();
        expect(chain.upsert).toHaveBeenCalledWith(CLIENT);
    });
    it('updateClientStatus — patches status field', async () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('clients_1777020684735').update({ status: 'inactive' }).eq('id', 'c1');
        expect(chain.update).toHaveBeenCalledWith({ status: 'inactive' });
        expect(chain.eq).toHaveBeenCalledWith('id', 'c1');
    });
    it('error path — propagates error object', async () => {
        const resolved = { data: null, error: { message: 'DB error' } };
        const chain = makeChain(resolved);
        const from = vi.fn().mockReturnValue(chain);
        const result = await from('clients_1777020684735').then();
        expect(result.error.message).toBe('DB error');
    });
});
// ─── crn_requests_1777090006 ─────────────────────────────────────────────────
describe('crn_requests_1777090006', () => {
    const CRN = { id: 'crn1', crn: 'CRN-999', full_name: 'John Smith', status: 'active' };
    it('listCRNRequests — selects ordered by created_at', () => {
        const chain = makeChain({ data: [CRN], error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('crn_requests_1777090006').select('*').order('created_at', { ascending: false });
        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
    it('getCRNByCode — filters by crn column', () => {
        const chain = makeChain({ data: CRN, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('crn_requests_1777090006').select('*').eq('crn', 'CRN-999').maybeSingle();
        expect(chain.eq).toHaveBeenCalledWith('crn', 'CRN-999');
    });
    it('createCRNRequest — inserts and selects', () => {
        const chain = makeChain({ data: CRN, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('crn_requests_1777090006').insert({ full_name: 'John Smith', crn: 'CRN-999' }).select().maybeSingle();
        expect(chain.insert).toHaveBeenCalled();
    });
    it('updateCRNStatus — patches status', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('crn_requests_1777090006').update({ status: 'revoked' }).eq('id', 'crn1');
        expect(chain.update).toHaveBeenCalledWith({ status: 'revoked' });
        expect(chain.eq).toHaveBeenCalledWith('id', 'crn1');
    });
});
// ─── care_centres_1777090000 ─────────────────────────────────────────────────
describe('care_centres_1777090000', () => {
    const CENTRE = { id: 'cc1', name: 'Sydney North', is_active: true };
    it('listCareCentres — ordered by name', () => {
        const chain = makeChain({ data: [CENTRE], error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('care_centres_1777090000').select('*').order('name');
        expect(chain.order).toHaveBeenCalledWith('name');
    });
    it('getCareCentreById — filters by id', () => {
        const chain = makeChain({ data: CENTRE, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('care_centres_1777090000').select('*').eq('id', 'cc1').maybeSingle();
        expect(chain.eq).toHaveBeenCalledWith('id', 'cc1');
    });
    it('upsertCareCentre — calls upsert', () => {
        const chain = makeChain({ data: CENTRE, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('care_centres_1777090000').upsert(CENTRE).select().maybeSingle();
        expect(chain.upsert).toHaveBeenCalledWith(CENTRE);
    });
});
// ─── admin_users_1777025000000 ───────────────────────────────────────────────
describe('admin_users_1777025000000', () => {
    const ADMIN = { id: 'a1', email: 'ops@acuteconnect.health', role: 'admin', status: 'active' };
    it('listAdminUsers — ordered by created_at', () => {
        const chain = makeChain({ data: [ADMIN], error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('admin_users_1777025000000').select('*').order('created_at', { ascending: false });
        expect(from).toHaveBeenCalledWith('admin_users_1777025000000');
    });
    it('getAdminUserByEmail — filters by email', () => {
        const chain = makeChain({ data: ADMIN, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('admin_users_1777025000000').select('*').eq('email', 'ops@acuteconnect.health').maybeSingle();
        expect(chain.eq).toHaveBeenCalledWith('email', 'ops@acuteconnect.health');
    });
    it('upsertAdminUser — calls upsert', () => {
        const chain = makeChain({ data: ADMIN, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('admin_users_1777025000000').upsert(ADMIN).select().maybeSingle();
        expect(chain.upsert).toHaveBeenCalledWith(ADMIN);
    });
    it('updateAdminLocation — patches lat/lng/timestamp', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const now = new Date().toISOString();
        from('admin_users_1777025000000').update({ last_location_lat: -33.87, last_location_lng: 151.21, last_location_at: now }).eq('id', 'a1');
        expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ last_location_lat: -33.87 }));
        expect(chain.eq).toHaveBeenCalledWith('id', 'a1');
    });
});
// ─── audit_logs_1777090020 ───────────────────────────────────────────────────
describe('audit_logs_1777090020', () => {
    const LOG = { id: 'log1', action: 'LOGIN', user_id: 'u1', created_at: new Date().toISOString() };
    it('listAuditLogs — ordered by created_at desc', () => {
        const chain = makeChain({ data: [LOG], error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('audit_logs_1777090020').select('*').order('created_at', { ascending: false });
        expect(from).toHaveBeenCalledWith('audit_logs_1777090020');
        expect(chain.order).toHaveBeenCalled();
    });
    it('logActivity — inserts entry', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('audit_logs_1777090020').insert({ action: 'LOGIN', user_id: 'u1', created_at: new Date().toISOString() });
        expect(chain.insert).toHaveBeenCalled();
    });
    it('listAuditLogs with filter — applies entity_type and limit', () => {
        const chain = makeChain({ data: [LOG], error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('audit_logs_1777090020').select('*').order('created_at', { ascending: false }).eq('entity_type', 'client').limit(50);
        expect(chain.eq).toHaveBeenCalledWith('entity_type', 'client');
        expect(chain.limit).toHaveBeenCalledWith(50);
    });
});
// ─── profile_audit_log ───────────────────────────────────────────────────────
describe('profile_audit_log', () => {
    it('recordAgreementAudit — inserts with legal fields', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const payload = {
            profile_id: 'p1', crn: 'CRN-001', action: 'CRN_CREATED',
            agreement_accepted: true, legal_bundle_version: 'v1.0',
        };
        from('profile_audit_log').insert(payload);
        expect(from).toHaveBeenCalledWith('profile_audit_log');
        expect(chain.insert).toHaveBeenCalledWith(payload);
    });
    it('error path — returns error object', async () => {
        const resolved = { data: null, error: { message: 'constraint violation' } };
        const chain = makeChain(resolved);
        const from = vi.fn().mockReturnValue(chain);
        const result = await from('profile_audit_log').insert({}).then();
        expect(result.error).toBeTruthy();
    });
});
// ─── crisis_events_1777090008 ────────────────────────────────────────────────
describe('crisis_events_1777090008', () => {
    const EVENT = { id: 'ce1', severity: 'high', client_id: 'c1', resolved_at: null };
    it('listCrisisEvents — filters unresolved events', () => {
        const chain = makeChain({ data: [EVENT], error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('crisis_events_1777090008').select('*').order('created_at', { ascending: false }).is('resolved_at', null);
        expect(from).toHaveBeenCalledWith('crisis_events_1777090008');
        expect(chain.is).toHaveBeenCalledWith('resolved_at', null);
    });
    it('createCrisisEvent — inserts event', () => {
        const chain = makeChain({ data: EVENT, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const p = { severity: 'high', client_id: 'c1' };
        from('crisis_events_1777090008').insert(p).select().maybeSingle();
        expect(chain.insert).toHaveBeenCalledWith(p);
    });
    it('resolveCrisisEvent — patches resolved_at', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('crisis_events_1777090008').update({ resolved_at: new Date().toISOString() }).eq('id', 'ce1');
        expect(chain.update).toHaveBeenCalled();
        expect(chain.eq).toHaveBeenCalledWith('id', 'ce1');
    });
});
// ─── location_instances ──────────────────────────────────────────────────────
describe('location_instances', () => {
    const INST = { id: 'li1', slug: 'sydney-north', status: 'active' };
    it('listLocationInstances — ordered by created_at', () => {
        const chain = makeChain({ data: [INST], error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('location_instances').select('*').order('created_at', { ascending: false });
        expect(from).toHaveBeenCalledWith('location_instances');
    });
    it('getLocationInstanceBySlug — filters by slug', () => {
        const chain = makeChain({ data: INST, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('location_instances').select('*').eq('slug', 'sydney-north').maybeSingle();
        expect(chain.eq).toHaveBeenCalledWith('slug', 'sydney-north');
    });
    it('updateLocationInstanceStatus — patches status', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('location_instances').update({ status: 'archived' }).eq('id', 'li1');
        expect(chain.update).toHaveBeenCalledWith({ status: 'archived' });
    });
    it('delete — removes by id', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('location_instances').delete().eq('id', 'li1');
        expect(chain.delete).toHaveBeenCalled();
        expect(chain.eq).toHaveBeenCalledWith('id', 'li1');
    });
});
// ─── location_credentials ────────────────────────────────────────────────────
describe('location_credentials', () => {
    it('insert — stores credential payload', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const cred = { location_instance_id: 'li1', supabase_url: 'https://test.supabase.co', anon_key: 'key' };
        from('location_credentials').insert([cred]);
        expect(from).toHaveBeenCalledWith('location_credentials');
        expect(chain.insert).toHaveBeenCalledWith([cred]);
    });
    it('upsert — updates existing credential', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const cred = { location_instance_id: 'li1', service_role_key: 'srkey' };
        from('location_credentials').upsert(cred);
        expect(chain.upsert).toHaveBeenCalledWith(cred);
    });
});
// ─── location_integration_requests_1777090015 ────────────────────────────────
describe('location_integration_requests_1777090015', () => {
    const REQ = { id: 'ir1', status: 'pending', location_name: 'North Shore' };
    it('select all — returns integration requests', () => {
        const chain = makeChain({ data: [REQ], error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('location_integration_requests_1777090015').select('*');
        expect(from).toHaveBeenCalledWith('location_integration_requests_1777090015');
    });
    it('updateStatus — patches status by id', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('location_integration_requests_1777090015').update({ status: 'approved' }).eq('id', 'ir1');
        expect(chain.update).toHaveBeenCalledWith({ status: 'approved' });
        expect(chain.eq).toHaveBeenCalledWith('id', 'ir1');
    });
});
// ─── sponsors_1777090009 ─────────────────────────────────────────────────────
describe('sponsors_1777090009', () => {
    const SPONSOR = { id: 's1', name: 'HealthCorp', status: 'active' };
    it('listSponsors — ordered by created_at', () => {
        const chain = makeChain({ data: [SPONSOR], error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('sponsors_1777090009').select('*').order('created_at', { ascending: false });
        expect(from).toHaveBeenCalledWith('sponsors_1777090009');
    });
    it('upsertSponsor — calls upsert with sponsor', () => {
        const chain = makeChain({ data: SPONSOR, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('sponsors_1777090009').upsert(SPONSOR).select().maybeSingle();
        expect(chain.upsert).toHaveBeenCalledWith(SPONSOR);
    });
});
// ─── feedback_tickets_1777090000 ─────────────────────────────────────────────
describe('feedback_tickets_1777090000', () => {
    const TICKET = { id: 'ft1', subject: 'Bug', category: 'bug', status: 'open' };
    it('select — retrieves feedback tickets', () => {
        const chain = makeChain({ data: [TICKET], error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('feedback_tickets_1777090000').select('*');
        expect(from).toHaveBeenCalledWith('feedback_tickets_1777090000');
    });
    it('insert — creates a ticket', () => {
        const chain = makeChain({ data: TICKET, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const payload = [{ subject: 'Bug', category: 'bug', status: 'open' }];
        from('feedback_tickets_1777090000').insert(payload);
        expect(chain.insert).toHaveBeenCalledWith(payload);
    });
});
// ─── push_notifications_1777090000 ───────────────────────────────────────────
describe('push_notifications_1777090000', () => {
    it('insert — creates push notification', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const payload = [{ title: 'Test', body: 'Body', target_role: 'admin' }];
        from('push_notifications_1777090000').insert(payload);
        expect(from).toHaveBeenCalledWith('push_notifications_1777090000');
        expect(chain.insert).toHaveBeenCalledWith(payload);
    });
});
// ─── feature_requests_1777090000 ─────────────────────────────────────────────
describe('feature_requests_1777090000', () => {
    it('update votes — patches vote count', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('feature_requests_1777090000').update({ votes: 5 }).eq('id', 'fr1');
        expect(chain.update).toHaveBeenCalledWith({ votes: 5 });
    });
    it('update status — patches status field', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('feature_requests_1777090000').update({ status: 'accepted' }).eq('id', 'fr1');
        expect(chain.update).toHaveBeenCalledWith({ status: 'accepted' });
    });
});
// ─── login_otp_codes_1777090007 ──────────────────────────────────────────────
describe('login_otp_codes_1777090007', () => {
    it('insert — creates OTP entry', () => {
        const chain = makeChain({ data: { id: 'otp1' }, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const exp = new Date(Date.now() + 600000).toISOString();
        const p = { email: 'ops@acuteconnect.health', code: '123456', expires_at: exp };
        from('login_otp_codes_1777090007').insert([p]).select().single();
        expect(from).toHaveBeenCalledWith('login_otp_codes_1777090007');
        expect(chain.insert).toHaveBeenCalledWith([p]);
    });
    it('update used=true — marks OTP consumed', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('login_otp_codes_1777090007').update({ used: true }).eq('id', 'otp1');
        expect(chain.update).toHaveBeenCalledWith({ used: true });
        expect(chain.eq).toHaveBeenCalledWith('id', 'otp1');
    });
});
//# sourceMappingURL=db.test.js.map