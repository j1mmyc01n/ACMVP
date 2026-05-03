// OTP generation and verification for the MVP staff login flow.
// TODO: Replace with Supabase Auth magic link once auth package is fully integrated.

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function verifyOTP(input: string, expected: string): boolean {
  return input.trim() === expected.trim();
}
