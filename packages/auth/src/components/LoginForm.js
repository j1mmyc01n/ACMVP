import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// LoginForm — extracted from App.jsx LoginModal.
// This is the self-contained login UI for staff/admin users.
// TODO: Wire into Supabase Auth (magic link) once the OTP flow is replaced.
import { useState, useEffect } from 'react';
import { supabase } from '@acmvp/database';
import { VALID_STAFF } from '@acmvp/config';
import { generateOTP } from '../otp';
function resolveRole(email) {
    const r = VALID_STAFF[email.toLowerCase().trim()];
    if (r)
        return r;
    return email.includes('sys') ? 'sysadmin' : 'admin';
}
export function LoginForm({ type = 'admin', onLogin, onCancel }) {
    const [mode, setMode] = useState('password');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [otpStep, setOtpStep] = useState('request');
    const [otpInput, setOtpInput] = useState('');
    const [generatedOTP, setGeneratedOTP] = useState('');
    const [otpId, setOtpId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    useEffect(() => {
        if (countdown <= 0)
            return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);
    const handlePasswordLogin = async () => {
        setError('');
        if (!email)
            return setError('Please enter your email.');
        if (!password)
            return setError('Please enter your password.');
        setLoading(true);
        try {
            const { data } = await supabase
                .from('admin_users_1777025000000')
                .select('*')
                .ilike('email', email.trim())
                .eq('status', 'active')
                .single();
            const isKnownStaff = email.trim().toLowerCase() in VALID_STAFF;
            if (!data && !isKnownStaff)
                return setError('No active account found for this email.');
            if (password !== 'password')
                return setError('Incorrect password.');
            onLogin(resolveRole(email), email.trim().toLowerCase());
        }
        catch {
            setError('Login failed. Please check your connection and try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSendOTP = async () => {
        setError('');
        if (!email)
            return setError('Please enter your staff email address.');
        setLoading(true);
        try {
            const { data: staff } = await supabase
                .from('admin_users_1777025000000')
                .select('*')
                .ilike('email', email.trim())
                .eq('status', 'active')
                .single();
            const isKnownStaff = email.trim().toLowerCase() in VALID_STAFF;
            if (!staff && !isKnownStaff)
                return setError('No active staff account found.');
            const code = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
            const { data: otpData, error: otpErr } = await supabase
                .from('login_otp_codes_1777090007')
                .insert([{ email: email.trim().toLowerCase(), code, expires_at: expiresAt }])
                .select()
                .single();
            if (otpErr)
                return setError('Failed to generate OTP. Please try again.');
            setGeneratedOTP(code);
            setOtpId(otpData.id);
            setOtpStep('sent');
            setCountdown(60);
        }
        catch {
            setError('Failed to send code. Please check your connection and try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleVerifyOTP = async () => {
        setError('');
        if (otpInput.length !== 6)
            return setError('Please enter the full 6-digit code.');
        setLoading(true);
        try {
            const { data: otpRecord } = await supabase
                .from('login_otp_codes_1777090007')
                .select('*')
                .eq('id', otpId)
                .eq('code', otpInput.trim())
                .eq('used', false)
                .single();
            if (!otpRecord)
                return setError('Invalid or expired code.');
            if (new Date(otpRecord.expires_at) < new Date())
                return setError('This code has expired.');
            await supabase.from('login_otp_codes_1777090007').update({ used: true }).eq('id', otpId);
            onLogin(resolveRole(email), email.trim().toLowerCase());
        }
        catch {
            setError('Verification failed. Please check your connection and try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleResend = () => {
        setOtpStep('request');
        setOtpInput('');
        setGeneratedOTP('');
        setError('');
    };
    return (_jsxs("div", { "data-testid": "login-form", children: [_jsx("h2", { children: type === 'sysadmin' ? 'SysAdmin Access' : 'Staff Portal Login' }), _jsx("p", { children: "Authorized Personnel Only" }), _jsx("div", { children: ['password', 'otp'].map((m) => (_jsx("button", { onClick: () => {
                        setMode(m);
                        setError('');
                        setOtpStep('request');
                        setOtpInput('');
                    }, style: { fontWeight: mode === m ? 700 : 400 }, children: m === 'password' ? 'Password' : 'Email OTP' }, m))) }), error && _jsx("div", { role: "alert", children: error }), mode === 'password' && (_jsxs("div", { children: [_jsxs("label", { children: ["Staff Email", _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "staff@acuteconnect.health" })] }), _jsxs("label", { children: ["Password", _jsx("input", { type: showPw ? 'text' : 'password', value: password, onChange: (e) => setPassword(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handlePasswordLogin(), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("button", { type: "button", onClick: () => setShowPw(!showPw), children: showPw ? 'Hide' : 'Show' })] }), _jsx("button", { onClick: handlePasswordLogin, disabled: loading, children: loading ? 'Verifying...' : 'Access Portal' })] })), mode === 'otp' && otpStep === 'request' && (_jsxs("div", { children: [_jsxs("label", { children: ["Staff Email", _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "staff@acuteconnect.health" })] }), _jsx("button", { onClick: handleSendOTP, disabled: loading, children: loading ? 'Sending...' : 'Send One-Time Code' })] })), mode === 'otp' && otpStep === 'sent' && (_jsxs("div", { children: [_jsxs("div", { children: ["Code sent to ", _jsx("strong", { children: email }), _jsx("div", { children: generatedOTP })] }), _jsxs("label", { children: ["Enter 6-Digit Code", _jsx("input", { type: "text", inputMode: "numeric", maxLength: 6, value: otpInput, onChange: (e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)), onKeyDown: (e) => e.key === 'Enter' && handleVerifyOTP(), placeholder: "000000" })] }), _jsx("button", { onClick: handleVerifyOTP, disabled: loading || otpInput.length < 6, children: loading ? 'Verifying...' : 'Verify & Login' }), _jsx("div", { children: countdown > 0 ? (`Resend available in ${countdown}s`) : (_jsx("button", { onClick: handleResend, children: "Request a new code" })) })] })), _jsx("button", { onClick: onCancel, children: "Cancel" })] }));
}
//# sourceMappingURL=LoginForm.js.map