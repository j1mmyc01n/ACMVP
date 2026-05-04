// OTP generation and verification for the MVP staff login flow.
// TODO: Replace with Supabase Auth magic link once auth package is fully integrated.
export function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
export function verifyOTP(input, expected) {
    return input.trim() === expected.trim();
}
//# sourceMappingURL=otp.js.map