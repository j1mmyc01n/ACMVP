import React, { useState } from 'react';
import { AGREEMENT_COPY } from '../lib/audit';

// Reusable agreement gate. The user must tick the box before the
// "Agree & Proceed" button enables. Used at the top of every flow that
// records a profile-audit-log entry (CRN creation, check-in, profile
// update, call-window change, mood/concern submission, AI triage).
//
// Usage:
//   <AgreementGate onAccepted={() => setAccepted(true)} />
//
// Or controlled:
//   <AgreementGate accepted={accepted} onChange={setAccepted}
//                  onAccepted={() => proceed()} />
export default function AgreementGate({
  accepted: acceptedProp,
  onChange,
  onAccepted,
  buttonLabel = 'Agree & Proceed',
  compact = false,
}) {
  const [internal, setInternal] = useState(false);
  const isControlled = typeof acceptedProp === 'boolean';
  const agreementAccepted = isControlled ? acceptedProp : internal;
  const setAgreementAccepted = (v) => {
    if (!isControlled) setInternal(v);
    if (onChange) onChange(v);
  };

  return (
    <div
      style={{
        background: 'var(--ac-bg)',
        border: '1px solid var(--ac-border)',
        borderRadius: 12,
        padding: compact ? '12px 14px' : '16px 18px',
        marginBottom: 12,
      }}
    >
      <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--ac-muted)', marginBottom: 12 }}>
        {AGREEMENT_COPY}
      </p>
      <label className="flex gap-3 items-start text-sm" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--ac-text)' }}>
        <input
          type="checkbox"
          checked={agreementAccepted}
          onChange={(e) => setAgreementAccepted(e.target.checked)}
          required
          style={{ marginTop: 3, flexShrink: 0 }}
        />
        <span>
          I have read and agree to the Acute Connect legal documents and consent to proceed.
        </span>
      </label>
      {onAccepted && (
        <button
          type="button"
          disabled={!agreementAccepted}
          onClick={() => agreementAccepted && onAccepted()}
          style={{
            marginTop: 12,
            padding: '10px 16px',
            borderRadius: 10,
            border: 'none',
            background: agreementAccepted ? 'var(--ac-primary)' : 'var(--ac-border)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: agreementAccepted ? 'pointer' : 'not-allowed',
            opacity: agreementAccepted ? 1 : 0.7,
          }}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
