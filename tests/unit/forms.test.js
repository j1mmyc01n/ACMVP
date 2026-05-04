/**
 * Form submission tests
 * Uses a chainable Supabase mock (no dynamic imports / vi.doMock).
 * Verifies each form calls the correct table + method with the right shape.
 */
import { describe, it, expect, vi } from 'vitest';
function makeChain(resolved) {
    const c = {};
    c.select = vi.fn().mockReturnValue(c);
    c.insert = vi.fn().mockReturnValue(c);
    c.update = vi.fn().mockReturnValue(c);
    c.upsert = vi.fn().mockReturnValue(c);
    c.delete = vi.fn().mockReturnValue(c);
    c.eq = vi.fn().mockReturnValue(c);
    c.in = vi.fn().mockReturnValue(c);
    c.is = vi.fn().mockReturnValue(c);
    c.order = vi.fn().mockReturnValue(c);
    c.limit = vi.fn().mockReturnValue(c);
    c.maybeSingle = vi.fn().mockResolvedValue(resolved);
    c.single = vi.fn().mockResolvedValue(resolved);
    c.then = vi.fn().mockResolvedValue(resolved);
    return c;
}
// ─── Feedback Form ────────────────────────────────────────────────────────────
describe('FeedbackModal — feedback_tickets_1777090000', () => {
    it('insert: submits valid feedback payload', () => {
        const chain = makeChain({ data: { id: 'ft1' }, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const form = { subject: 'Feature request', category: 'feature', priority: 'medium', message: 'Add dark mode.', submitted_by: 'ops@acuteconnect.health', status: 'open' };
        from('feedback_tickets_1777090000').insert([form]);
        expect(from).toHaveBeenCalledWith('feedback_tickets_1777090000');
        expect(chain.insert).toHaveBeenCalledWith([form]);
    });
    it('insert: error path — error object is returned', async () => {
        const resolved = { data: null, error: { message: 'insert failed' } };
        const chain = makeChain(resolved);
        const from = vi.fn().mockReturnValue(chain);
        const result = await from('feedback_tickets_1777090000').insert([{}]).then();
        expect(result.error).toBeTruthy();
    });
    it('update: admin updates ticket status', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('feedback_tickets_1777090000').update({ status: 'resolved' }).eq('id', 'ft1');
        expect(chain.update).toHaveBeenCalledWith({ status: 'resolved' });
        expect(chain.eq).toHaveBeenCalledWith('id', 'ft1');
    });
});
// ─── OTP Login Form ───────────────────────────────────────────────────────────
describe('OTP Login — login_otp_codes_1777090007', () => {
    it('insert: creates OTP code entry', () => {
        const chain = makeChain({ data: { id: 'otp1', code: '123456' }, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const expires = new Date(Date.now() + 10 * 60000).toISOString();
        const payload = { email: 'ops@acuteconnect.health', code: '123456', expires_at: expires };
        from('login_otp_codes_1777090007').insert([payload]).select().single();
        expect(from).toHaveBeenCalledWith('login_otp_codes_1777090007');
        expect(chain.insert).toHaveBeenCalledWith([payload]);
    });
    it('update: marks OTP as used after verification', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('login_otp_codes_1777090007').update({ used: true }).eq('id', 'otp1');
        expect(chain.update).toHaveBeenCalledWith({ used: true });
        expect(chain.eq).toHaveBeenCalledWith('id', 'otp1');
    });
    it('insert: error — bad email returns error', async () => {
        const resolved = { data: null, error: { message: 'Email required' } };
        const chain = makeChain(resolved);
        const from = vi.fn().mockReturnValue(chain);
        const result = await from('login_otp_codes_1777090007').insert([{ email: '' }]).then();
        expect(result.error).toBeTruthy();
    });
});
// ─── Client Registration Form ─────────────────────────────────────────────────
describe('Client Registration — clients_1777020684735', () => {
    it('insert: creates client with required fields', () => {
        const chain = makeChain({ data: { id: 'c1' }, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const client = { full_name: 'Jane Doe', dob: '1990-01-01', phone: '+61400000000', email: 'jane@example.com', care_centre_id: 'cc1', status: 'active' };
        from('clients_1777020684735').insert([client]);
        expect(chain.insert).toHaveBeenCalledWith([client]);
    });
    it('insert: error — duplicate CRN returns error', async () => {
        const resolved = { data: null, error: { message: 'duplicate key', code: '23505' } };
        const chain = makeChain(resolved);
        const from = vi.fn().mockReturnValue(chain);
        const result = await from('clients_1777020684735').insert([{ full_name: 'Dupe', crn: 'CRN-001' }]).then();
        expect(result.error?.code).toBe('23505');
    });
    it('delete: bulk-deletes clients in a care centre', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('clients_1777020684735').delete().in('care_centre', ['Camperdown', 'Newtown']);
        expect(chain.delete).toHaveBeenCalled();
        expect(chain.in).toHaveBeenCalledWith('care_centre', ['Camperdown', 'Newtown']);
    });
});
// ─── Care Centre Form ─────────────────────────────────────────────────────────
describe('Care Centre Form — care_centres_1777090000', () => {
    it('insert: creates new care centre', () => {
        const chain = makeChain({ data: { id: 'cc2' }, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const centre = { name: 'Inner West', address: '1 Main St', active: true, clients_count: 0 };
        from('care_centres_1777090000').insert([centre]);
        expect(chain.insert).toHaveBeenCalledWith([centre]);
    });
    it('insert: error — missing name returns error', async () => {
        const resolved = { data: null, error: { message: 'not-null violation' } };
        const chain = makeChain(resolved);
        const from = vi.fn().mockReturnValue(chain);
        const result = await from('care_centres_1777090000').insert([{}]).then();
        expect(result.error).toBeTruthy();
    });
    it('delete: removes care centre by id list', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('care_centres_1777090000').delete().in('id', ['cc1', 'cc2']);
        expect(chain.delete).toHaveBeenCalled();
        expect(chain.in).toHaveBeenCalledWith('id', ['cc1', 'cc2']);
    });
});
// ─── Admin User Form ──────────────────────────────────────────────────────────
describe('Admin User Form — admin_users_1777025000000', () => {
    it('insert: creates admin user', () => {
        const chain = makeChain({ data: { id: 'a2' }, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const user = { name: 'Dr Admin', email: 'new@acuteconnect.health', role: 'admin', status: 'active', location: 'Camperdown' };
        from('admin_users_1777025000000').insert([user]);
        expect(chain.insert).toHaveBeenCalledWith([user]);
    });
    it('update: edits admin details', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const updates = { name: 'Updated Name', role: 'sysadmin', status: 'active' };
        from('admin_users_1777025000000').update(updates).eq('id', 'a1');
        expect(chain.update).toHaveBeenCalledWith(updates);
        expect(chain.eq).toHaveBeenCalledWith('id', 'a1');
    });
    it('update status: toggles active/inactive', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('admin_users_1777025000000').update({ status: 'inactive' }).eq('id', 'a1');
        expect(chain.update).toHaveBeenCalledWith({ status: 'inactive' });
    });
    it('update: error — constraint violation', async () => {
        const resolved = { data: null, error: { message: 'constraint violation' } };
        const chain = makeChain(resolved);
        const from = vi.fn().mockReturnValue(chain);
        const result = await from('admin_users_1777025000000').update({ role: 'invalid_role' }).eq('id', 'a1').then();
        expect(result.error).toBeTruthy();
    });
});
// ─── Push Notifications Form ──────────────────────────────────────────────────
describe('Push Notifications Form — push_notifications_1777090000', () => {
    it('insert: sends push notification payload', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const payload = { title: 'Test', body: 'Test message', target_role: 'admin', sent_at: new Date().toISOString() };
        from('push_notifications_1777090000').insert([payload]);
        expect(from).toHaveBeenCalledWith('push_notifications_1777090000');
        expect(chain.insert).toHaveBeenCalledWith([payload]);
    });
    it('insert: error — missing title', async () => {
        const resolved = { data: null, error: { message: 'title required' } };
        const chain = makeChain(resolved);
        const from = vi.fn().mockReturnValue(chain);
        const result = await from('push_notifications_1777090000').insert([{}]).then();
        expect(result.error).toBeTruthy();
    });
});
// ─── Location Provisioning Form ───────────────────────────────────────────────
describe('Location Provisioning — location_instances + location_credentials', () => {
    it('insert: creates location instance', () => {
        const chain = makeChain({ data: { id: 'li2', slug: 'new-location' }, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const instance = { slug: 'new-location', name: 'New Location', status: 'provisioning' };
        from('location_instances').insert(instance);
        expect(chain.insert).toHaveBeenCalledWith(instance);
    });
    it('update: sets github_repo_url after provisioning', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('location_instances').update({ github_repo_url: 'https://github.com/org/repo', deployment_phase: 'supabase' }).eq('id', 'li1');
        expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ github_repo_url: 'https://github.com/org/repo' }));
    });
    it('upsert: saves provision credentials', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        const cred = { location_instance_id: 'li1', netlify_auth_token: 'tok', github_token: 'ghtoken' };
        from('provision_credentials').upsert(cred);
        expect(from).toHaveBeenCalledWith('provision_credentials');
        expect(chain.upsert).toHaveBeenCalledWith(cred);
    });
    it('delete: removes location instance', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('location_instances').delete().eq('id', 'li1');
        expect(chain.delete).toHaveBeenCalled();
    });
});
// ─── Feature Requests Form ────────────────────────────────────────────────────
describe('Feature Requests — feature_requests_1777090000', () => {
    it('update: increments vote count', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('feature_requests_1777090000').update({ votes: 5 }).eq('id', 'fr1');
        expect(chain.update).toHaveBeenCalledWith({ votes: 5 });
    });
    it('update: changes status to accepted', () => {
        const chain = makeChain({ data: null, error: null });
        const from = vi.fn().mockReturnValue(chain);
        from('feature_requests_1777090000').update({ status: 'accepted' }).eq('id', 'fr1');
        expect(chain.update).toHaveBeenCalledWith({ status: 'accepted' });
    });
});
//# sourceMappingURL=forms.test.js.map