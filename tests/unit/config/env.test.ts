import { describe, it, expect } from 'vitest';
import { isSupabaseHost, SUPABASE_URL } from '../../../packages/config/src/env';

describe('config/env', () => {
  describe('isSupabaseHost', () => {
    it('returns true for .supabase.co URLs', () => {
      expect(isSupabaseHost('https://abcd.supabase.co')).toBe(true);
    });

    it('returns true for .supabase.in URLs', () => {
      expect(isSupabaseHost('https://abcd.supabase.in')).toBe(true);
    });

    it('returns false for Netlify URLs', () => {
      expect(isSupabaseHost('https://mysite.netlify.app')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isSupabaseHost(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isSupabaseHost('')).toBe(false);
    });

    it('returns false for non-URL strings', () => {
      expect(isSupabaseHost('not-a-url')).toBe(false);
    });
  });

  it('SUPABASE_URL is a non-empty string', () => {
    expect(typeof SUPABASE_URL).toBe('string');
    expect(SUPABASE_URL.length).toBeGreaterThan(0);
  });
});
