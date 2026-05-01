import React, { useMemo, useState } from 'react';
import { LEGAL_DOCS, LEGAL_HUB_HEADER } from './documents';
import { LEGAL_VERSIONS } from '../lib/audit';

const TAG_COLOR = { Required: '#2563EB', Critical: '#DC2626', B2B: '#D97706' };
const TAG_BG = { Required: '#EFF6FF', Critical: '#FEF2F2', B2B: '#FFFBEB' };

function DocBody({ doc }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: 'var(--ac-text)' }}>{doc.label}</h2>
      <p style={{ fontSize: 13, color: 'var(--ac-muted)', marginBottom: 18 }}>{doc.summary}</p>
      {doc.sections.map((s, i) => (
        <section key={i} style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--ac-text)', borderBottom: '1px solid var(--ac-border)', paddingBottom: 6 }}>{s.title}</h3>
          {s.body && <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ac-text)', marginBottom: 8 }}>{s.body}</p>}
          {s.list && (
            <ul style={{ paddingLeft: 22, margin: 0 }}>
              {s.list.map((item, j) => (
                <li key={j} style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ac-text)', marginBottom: 4 }}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export default function LegalHub({ initialDocId }) {
  const [activeId, setActiveId] = useState(initialDocId || LEGAL_DOCS[0].id);
  const active = useMemo(
    () => LEGAL_DOCS.find((d) => d.id === activeId) || LEGAL_DOCS[0],
    [activeId],
  );

  return (
    <div className="ac-stack" style={{ paddingBottom: 60 }}>
      <div style={{ background: 'var(--ac-primary)', color: '#fff', borderRadius: 16, padding: '20px 22px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85 }}>Legal Hub</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>Acute Connect Legal & Policy Documents</div>
        <p style={{ fontSize: 13, lineHeight: 1.6, marginTop: 10, opacity: 0.95 }}>{LEGAL_HUB_HEADER}</p>
        <div style={{ marginTop: 12, fontSize: 11, opacity: 0.8 }}>
          Bundle <strong>{LEGAL_VERSIONS.legal_bundle}</strong> · Privacy {LEGAL_VERSIONS.privacy} · Terms {LEGAL_VERSIONS.terms} · Medical {LEGAL_VERSIONS.medical_disclaimer} · AI {LEGAL_VERSIONS.ai_disclosure} · Crisis {LEGAL_VERSIONS.crisis_notice} · Cookies {LEGAL_VERSIONS.cookie_policy}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) 1fr', gap: 18 }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {LEGAL_DOCS.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 4,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--ac-border)',
                background: activeId === d.id ? 'var(--ac-primary-soft)' : 'var(--ac-surface)',
                color: activeId === d.id ? 'var(--ac-primary)' : 'var(--ac-text)',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: activeId === d.id ? 700 : 500,
                fontSize: 13,
              }}
            >
              <span>{d.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: TAG_COLOR[d.tag], background: TAG_BG[d.tag], padding: '2px 6px', borderRadius: 6 }}>{d.tag}</span>
            </button>
          ))}
        </aside>

        <div style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 12, padding: '20px 22px', minHeight: 400 }}>
          <DocBody doc={active} />
        </div>
      </div>
    </div>
  );
}
