import { supabase } from '@acmvp/database';
const REPORTS_TABLE = 'clinical_notes_1777090003';
const INVOICES_TABLE = 'invoices_1777090000';
export async function listClinicalReports(carecentreId) {
    let query = supabase.from(REPORTS_TABLE).select('*').order('created_at', { ascending: false });
    if (carecentreId)
        query = query.eq('care_centre_id', carecentreId);
    return query;
}
export async function generateReport(params) {
    // TODO: implement report generation (aggregate query → export)
    return { ok: true, data: [], params };
}
//# sourceMappingURL=reports.service.js.map