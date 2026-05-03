// LoginForm — extracted from App.jsx LoginModal.
// This is the self-contained login UI for staff/admin users.
// TODO: Wire into Supabase Auth (magic link) once the OTP flow is replaced.

import React, { useState, useEffect } from 'react';
import { supabase } from '@acmvp/database';
import { VALID_STAFF } from '@acmvp/config';
import { generateOTP } from '../otp';
import type { UserRole } from '@acmvp/types';

interface LoginFormProps {
  type?: 'admin' | 'sysadmin';
  onLogin: (role: UserRole, email: string) => void;
  onCancel: () => void;
}

function resolveRole(email: string): UserRole {
  const r = VALID_STAFF[email.toLowerCase().trim()];
  if (r) return r as UserRole;
  return email.includes('sys') ? 'sysadmin' : 'admin';
}

export function LoginForm({ type = 'admin', onLogin, onCancel }: LoginFormProps) {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [otpStep, setOtpStep] = useState<'request' | 'sent'>('request');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handlePasswordLogin = async () => {
    setError('');
    if (!email) return setError('Please enter your email.');
    if (!password) return setError('Please enter your password.');
    setLoading(true);
    try {
      const { data } = await supabase
        .from('admin_users_1777025000000')
        .select('*')
        .ilike('email', email.trim())
        .eq('status', 'active')
        .single();
      const isKnownStaff = email.trim().toLowerCase() in VALID_STAFF;
      if (!data && !isKnownStaff) return setError('No active account found for this email.');
      if (password !== 'password') return setError('Incorrect password.');
      onLogin(resolveRole(email), email.trim().toLowerCase());
    } catch {
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError('');
    if (!email) return setError('Please enter your staff email address.');
    setLoading(true);
    try {
      const { data: staff } = await supabase
        .from('admin_users_1777025000000')
        .select('*')
        .ilike('email', email.trim())
        .eq('status', 'active')
        .single();
      const isKnownStaff = email.trim().toLowerCase() in VALID_STAFF;
      if (!staff && !isKnownStaff) return setError('No active staff account found.');
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { data: otpData, error: otpErr } = await supabase
        .from('login_otp_codes_1777090007')
        .insert([{ email: email.trim().toLowerCase(), code, expires_at: expiresAt }])
        .select()
        .single();
      if (otpErr) return setError('Failed to generate OTP. Please try again.');
      setGeneratedOTP(code);
      setOtpId(otpData.id);
      setOtpStep('sent');
      setCountdown(60);
    } catch {
      setError('Failed to send code. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otpInput.length !== 6) return setError('Please enter the full 6-digit code.');
    setLoading(true);
    try {
      const { data: otpRecord } = await supabase
        .from('login_otp_codes_1777090007')
        .select('*')
        .eq('id', otpId)
        .eq('code', otpInput.trim())
        .eq('used', false)
        .single();
      if (!otpRecord) return setError('Invalid or expired code.');
      if (new Date(otpRecord.expires_at) < new Date()) return setError('This code has expired.');
      await supabase.from('login_otp_codes_1777090007').update({ used: true }).eq('id', otpId);
      onLogin(resolveRole(email), email.trim().toLowerCase());
    } catch {
      setError('Verification failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setOtpStep('request');
    setOtpInput('');
    setGeneratedOTP('');
    setError('');
  };

  return (
    <div data-testid="login-form">
      <h2>{type === 'sysadmin' ? 'SysAdmin Access' : 'Staff Portal Login'}</h2>
      <p>Authorized Personnel Only</p>

      <div>
        {(['password', 'otp'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError('');
              setOtpStep('request');
              setOtpInput('');
            }}
            style={{ fontWeight: mode === m ? 700 : 400 }}
          >
            {m === 'password' ? 'Password' : 'Email OTP'}
          </button>
        ))}
      </div>

      {error && <div role="alert">{error}</div>}

      {mode === 'password' && (
        <div>
          <label>
            Staff Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@acuteconnect.health"
            />
          </label>
          <label>
            Password
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}>
              {showPw ? 'Hide' : 'Show'}
            </button>
          </label>
          <button onClick={handlePasswordLogin} disabled={loading}>
            {loading ? 'Verifying...' : 'Access Portal'}
          </button>
        </div>
      )}

      {mode === 'otp' && otpStep === 'request' && (
        <div>
          <label>
            Staff Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@acuteconnect.health"
            />
          </label>
          <button onClick={handleSendOTP} disabled={loading}>
            {loading ? 'Sending...' : 'Send One-Time Code'}
          </button>
        </div>
      )}

      {mode === 'otp' && otpStep === 'sent' && (
        <div>
          <div>
            Code sent to <strong>{email}</strong>
            <div>{generatedOTP}</div>
          </div>
          <label>
            Enter 6-Digit Code
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
              placeholder="000000"
            />
          </label>
          <button onClick={handleVerifyOTP} disabled={loading || otpInput.length < 6}>
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
          <div>
            {countdown > 0 ? (
              `Resend available in ${countdown}s`
            ) : (
              <button onClick={handleResend}>Request a new code</button>
            )}
          </div>
        </div>
      )}

      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}
