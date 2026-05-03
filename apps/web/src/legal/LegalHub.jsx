import React, { useMemo, useState } from 'react';
import { LEGAL_DOCS } from './documents';
import { LEGAL_VERSIONS } from '../lib/audit';

const TAG_STYLE = {
  Required: { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  Critical: { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  B2B:      { color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
};

function DocCard({ doc, isOpen, onToggle }) {
  const tag = TAG_STYLE[doc.tag] || TAG_STYLE.Required;
  return (
    <article
      style={{
        background: 'var(--ac-surface)',
        border: '1px solid var(--ac-border)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ac-text)' }}>{doc.label}</h3>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: tag.color,
                background: tag.bg,
                border: `1px solid ${tag.border}`,
                padding: '2px 8px',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {doc.tag}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ac-muted)', lineHeight: 1.5 }}>{doc.summary}</p>
        </div>
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            fontSize: 18,
            color: 'var(--ac-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        >
          ⌃
        </span>
      </button>
      {isOpen && (
        <div style={{ borderTop: '1px solid var(--ac-border)', padding: '16px 18px 20px' }}>
          {doc.sections.map((s, i) => (
            <section key={i} style={{ marginBottom: 18 }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: 'var(--ac-text)' }}>{s.title}</h4>
              {s.body && (
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--ac-text)' }}>{s.body}</p>
              )}
              {s.list && (
                <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                  {s.list.map((item, j) => (
                    <li key={j} style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ac-text)', marginBottom: 3 }}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </article>
  );
}

export default function LegalHub({ initialDocId }) {
  const initial = useMemo(
    () => (initialDocId && LEGAL_DOCS.some((d) => d.id === initialDocId) ? initialDocId : null),
    [initialDocId],
  );
  const [openId, setOpenId] = useState(initial);

  const versions = `Bundle ${LEGAL_VERSIONS.legal_bundle} · Privacy ${LEGAL_VERSIONS.privacy} · Terms ${LEGAL_VERSIONS.terms} · Medical ${LEGAL_VERSIONS.medical_disclaimer} · AI ${LEGAL_VERSIONS.ai_disclosure} · Crisis ${LEGAL_VERSIONS.crisis_notice} · Cookies ${LEGAL_VERSIONS.cookie_policy}`;

  return (
    <div className="ac-stack" style={{ paddingBottom: 60 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--ac-muted)' }}>Legal Hub</div>
          <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: 'var(--ac-text)' }}>Acute Connect Legal & Policy Documents</h1>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{versions}</div>
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          type="button"
          onClick={() => setOpenId('all')}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid var(--ac-border)',
            background: 'var(--ac-surface)',
            color: 'var(--ac-text)',
            cursor: 'pointer',
          }}
        >
          Expand all
        </button>
        <button
          type="button"
          onClick={() => setOpenId(null)}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid var(--ac-border)',
            background: 'var(--ac-surface)',
            color: 'var(--ac-text)',
            cursor: 'pointer',
          }}
        >
          Collapse all
        </button>
      </div>

      <div className="ac-stack" style={{ gap: 10 }}>
        {LEGAL_DOCS.map((d) => (
          <DocCard
            key={d.id}
            doc={d}
            isOpen={openId === 'all' || openId === d.id}
            onToggle={() => setOpenId((cur) => (cur === d.id ? null : d.id))}
          />
        ))}
      </div>
    </div>
  );
}
