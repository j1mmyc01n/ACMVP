// ─── Client / Patient ────────────────────────────────────────────────────────

export interface Client {
  id?: string;
  user_id?: string;
  full_name: string;
  dob?: string;
  phone?: string;
  email?: string;
  role?: string;
  crn?: string;
  care_centre_id?: string;
  status?: 'active' | 'inactive' | 'pending' | 'offboarded';
  mood?: number;
  support_category?: string;
  otp_enabled?: boolean;
  event_log?: Record<string, unknown>[];
  created_at?: string;
  updated_at?: string;
}

// ─── CRN ─────────────────────────────────────────────────────────────────────

export interface CRNRequest {
  id?: string;
  crn?: string;
  user_id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  service_type?: string;
  care_centre_id?: string;
  status?: 'active' | 'inactive' | 'revoked' | 'pending';
  created_by?: string;
  created_at?: string;
}

// ─── Care Centre ─────────────────────────────────────────────────────────────

export interface CareCenter {
  id?: string;
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  email?: string;
  service_types?: string[];
  coordinates?: { lat: number; lng: number };
  is_active?: boolean;
  created_at?: string;
}

// ─── Location Instance ───────────────────────────────────────────────────────

export interface LocationInstance {
  id?: string;
  slug: string;
  name?: string;
  netlify_site_id?: string;
  netlify_url?: string;
  supabase_project_ref?: string;
  github_repo?: string;
  parent_location_id?: string;
  status?: 'provisioning' | 'active' | 'error' | 'archived';
  created_at?: string;
}

// ─── Admin User ──────────────────────────────────────────────────────────────

export interface AdminUser {
  id?: string;
  email: string;
  role: 'admin' | 'sysadmin' | 'field_agent';
  status?: 'active' | 'inactive';
  last_location_lat?: number;
  last_location_lng?: number;
  last_location_at?: string;
  created_at?: string;
}

// ─── Crisis ──────────────────────────────────────────────────────────────────

export interface CrisisEvent {
  id?: string;
  client_id?: string;
  crn?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  assigned_to?: string;
  resolved_at?: string;
  created_at?: string;
}

// ─── Sponsor ─────────────────────────────────────────────────────────────────

export interface Sponsor {
  id?: string;
  name: string;
  email?: string;
  logo_url?: string;
  logo_data?: string;
  tier?: string;
  ad_copy?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
}

// ─── Feedback Ticket ─────────────────────────────────────────────────────────

export interface FeedbackTicket {
  id?: string;
  subject: string;
  category?: 'feedback' | 'bug' | 'feature' | 'urgent';
  priority?: 'low' | 'medium' | 'high';
  message: string;
  submitted_by?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at?: string;
}
