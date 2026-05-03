import { supabase } from '../client';
import type { CareCenter, LocationInstance } from '@acmvp/types';

const CARE_CENTRES_TABLE = 'care_centres_1777090000';
const LOCATION_INSTANCES_TABLE = 'location_instances';

// ─── Care Centres ─────────────────────────────────────────────────────────────

export async function listCareCentres() {
  return supabase.from(CARE_CENTRES_TABLE).select('*').order('name');
}

export async function getCareCentreById(id: string) {
  return supabase.from(CARE_CENTRES_TABLE).select('*').eq('id', id).maybeSingle();
}

export async function upsertCareCentre(centre: Partial<CareCenter>) {
  return supabase.from(CARE_CENTRES_TABLE).upsert(centre).select().maybeSingle();
}

// ─── Location Instances ───────────────────────────────────────────────────────

export async function listLocationInstances() {
  return supabase.from(LOCATION_INSTANCES_TABLE).select('*').order('created_at', { ascending: false });
}

export async function getLocationInstanceBySlug(slug: string) {
  return supabase.from(LOCATION_INSTANCES_TABLE).select('*').eq('slug', slug).maybeSingle();
}

export async function upsertLocationInstance(instance: Partial<LocationInstance>) {
  return supabase.from(LOCATION_INSTANCES_TABLE).upsert(instance).select().maybeSingle();
}

export async function updateLocationInstanceStatus(id: string, status: LocationInstance['status']) {
  return supabase.from(LOCATION_INSTANCES_TABLE).update({ status }).eq('id', id);
}
