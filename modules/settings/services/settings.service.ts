import { supabase } from '@acmvp/database';

const FEEDBACK_TABLE = 'feedback_tickets_1777090000';

export async function submitFeedback(params: {
  subject: string;
  category: string;
  priority: string;
  message: string;
  submittedBy?: string;
}) {
  return supabase.from(FEEDBACK_TABLE).insert({
    subject: params.subject,
    category: params.category,
    priority: params.priority,
    message: params.message,
    submitted_by: params.submittedBy,
    status: 'open',
  });
}

export async function listFeedback(params?: { status?: string }) {
  let query = supabase.from(FEEDBACK_TABLE).select('*').order('created_at', { ascending: false });
  if (params?.status) query = query.eq('status', params.status);
  return query;
}

export async function updateFeedbackStatus(id: string, status: string) {
  return supabase.from(FEEDBACK_TABLE).update({ status }).eq('id', id);
}
