import { supabase } from '@acmvp/database';
import type { CrisisEvent } from '@acmvp/types';

const TABLE = 'crisis_events_1777090008';

export async function listCrisisEvents(params?: { resolved?: boolean; carecentreId?: string }) {
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (params?.resolved === false) query = query.is('resolved_at', null);
  if (params?.resolved === true) query = query.not('resolved_at', 'is', null);
  return query;
}

export async function createCrisisEvent(event: Partial<CrisisEvent>) {
  return supabase.from(TABLE).insert(event).select().maybeSingle();
}

export async function resolveCrisisEvent(id: string) {
  return supabase.from(TABLE).update({ resolved_at: new Date().toISOString() }).eq('id', id);
}

export async function assignCrisisEvent(id: string, assignedTo: string) {
  return supabase.from(TABLE).update({ assigned_to: assignedTo }).eq('id', id);
}
