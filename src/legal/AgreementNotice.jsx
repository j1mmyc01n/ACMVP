import React from 'react';
import { AGREEMENT_NOTICE_LEADS, AGREEMENT_NOTICE_TAIL } from '../lib/audit';

// Inline implied-consent notice. Sits directly under an action button so the
// user sees what they are agreeing to AT the point of action — no separate
// checkbox, no "Agree & Proceed" gate. Pressing the button above the notice
// is itself the agreement, and the audit log captures it.
//
//   action — which lead-in to show (see AGREEMENT_NOTICE_LEADS).
//            Defaults to "continue".
//   align  — "center" (default) or "left".
export default function AgreementNotice({ action = 'continue', align = 'center', style }) {
  const lead = AGREEMENT_NOTICE_LEADS[action] || AGREEMENT_NOTICE_LEADS.continue;
  return (
    <p
      style={{
        marginTop: 10,
        marginBottom: 0,
        textAlign: align,
        fontSize: 11,
        lineHeight: 1.55,
        color: 'var(--ac-muted)',
        ...style,
      }}
    >
      {lead}
      {AGREEMENT_NOTICE_TAIL}
    </p>
  );
}
