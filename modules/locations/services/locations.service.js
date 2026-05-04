import { supabase } from '@acmvp/database';
const LOCATION_INSTANCES_TABLE = 'location_instances';
const CARE_CENTRES_TABLE = 'care_centres_1777090000';
const FEATURE_FLAGS_TABLE = 'location_feature_flags_1777100020';
export async function listLocations() {
    return supabase.from(LOCATION_INSTANCES_TABLE).select('*').order('created_at', { ascending: false });
}
export async function getLocationBySlug(slug) {
    return supabase.from(LOCATION_INSTANCES_TABLE).select('*').eq('slug', slug).maybeSingle();
}
export async function listCareCentres() {
    return supabase.from(CARE_CENTRES_TABLE).select('*').order('name');
}
export async function getFeatureFlags(locationId) {
    return supabase.from(FEATURE_FLAGS_TABLE).select('*').eq('location_id', locationId).maybeSingle();
}
export async function updateFeatureFlags(locationId, flags) {
    return supabase
        .from(FEATURE_FLAGS_TABLE)
        .upsert({ location_id: locationId, ...flags })
        .select()
        .maybeSingle();
}
//# sourceMappingURL=locations.service.js.map