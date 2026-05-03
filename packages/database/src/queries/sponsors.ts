import { supabase } from '../client';
import type { Sponsor } from '@acmvp/types';

const SPONSORS_TABLE = 'sponsors_1777090009';
const LEDGER_TABLE = 'sponsor_ledger_1777090009';

export async function listSponsors() {
  return supabase.from(SPONSORS_TABLE).select('*').order('created_at', { ascending: false });
}

export async function getSponsorById(id: string) {
  return supabase.from(SPONSORS_TABLE).select('*').eq('id', id).maybeSingle();
}

export async function upsertSponsor(sponsor: Partial<Sponsor>) {
  return supabase.from(SPONSORS_TABLE).upsert(sponsor).select().maybeSingle();
}

export async function listLedgerEntries(sponsorId?: string) {
  let query = supabase.from(LEDGER_TABLE).select('*').order('created_at', { ascending: false });
  if (sponsorId) query = query.eq('sponsor_id', sponsorId);
  return query;
}
