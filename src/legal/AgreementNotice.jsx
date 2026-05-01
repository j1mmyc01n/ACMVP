import React from 'react';
import {
  AGREEMENT_NOTICE_LEADS,
  AGREEMENT_NOTICE_TAIL_PREFIX,
  AGREEMENT_NOTICE_DOCS_LABEL,
  AGREEMENT_NOTICE_TAIL_SUFFIX,
} from '../lib/audit';

// Inline implied-consent notice. Sits directly under an action button so the
// user sees what they are agreeing to AT the point of action — no separate
// checkbox, no "Agree & Proceed" gate. Pressing the button above the notice
// is itself the agreement, and the audit log captures it.
//
//   action — which lead-in to show (see AGREEMENT_NOTICE_LEADS).
//            Defaults to "continue".
//   align  — "center" (default) or "left".
//   goto   — page-navigation function. When provided the document list is
//            rendered as a clickable link that opens the Legal Hub. When
//            omitted, the link falls back to the in-page anchor `#legal-hub`
//            so the embedded Legal Hub at the base of the check-in flow can
//            still be reached.
export default function AgreementNotice({ action = 'continue', align = 'center', style, goto }) {
  const lead = AGREEMENT_NOTICE_LEADS[action] || AGREEMENT_NOTICE_LEADS.continue;

  const linkStyle = {
    color: 'var(--ac-primary)',
    textDecoration: 'underline',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const docsLink = goto ? (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        goto('legal');
      }}
      style={{
        ...linkStyle,
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
      }}
    >
      {AGREEMENT_NOTICE_DOCS_LABEL}
    </button>
  ) : (
    <a
      href="#legal-hub"
      onClick={(e) => {
        const el = typeof document !== 'undefined' && document.getElementById('legal-hub');
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
      style={linkStyle}
    >
      {AGREEMENT_NOTICE_DOCS_LABEL}
    </a>
  );

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
      {AGREEMENT_NOTICE_TAIL_PREFIX}
      {docsLink}
      {AGREEMENT_NOTICE_TAIL_SUFFIX}
    </p>
  );
}
