// Integration test skeleton — Supabase connectivity.
// These tests require a running local Supabase instance (supabase start).
// Run: supabase start && npx vitest run tests/integration/

import { describe, it, expect, beforeAll } from 'vitest';

// Skip these tests in CI if no Supabase URL is configured
const SKIP = !process.env.VITE_SUPABASE_URL;

describe.skipIf(SKIP)('Supabase integration', () => {
  it('TODO: test clients table read', () => {
    // import { supabase } from '@acmvp/database';
    // const { data, error } = await supabase.from('clients_1777020684735').select('id').limit(1);
    // expect(error).toBeNull();
    expect(true).toBe(true); // placeholder
  });

  it('TODO: test audit log write', () => {
    expect(true).toBe(true); // placeholder
  });
});
