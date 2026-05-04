/**
 * PromoHero — animated landing-page hero for AcuteConnect.
 *
 * Drop in anywhere:
 *   import PromoHero from '../components/PromoHero';
 *   <PromoHero onCTA={() => navigate('/login')} />
 *
 * Requires framer-motion (already in deps).
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

// ─── Design tokens (matches the platform palette) ─────────────────────────────
const T = {
  purple: '#7C3AED',
  blue:   '#0284C7',
  red:    '#DC2626',
  green:  '#059669',
  amber:  '#D97706',
  dark:   '#0F172A',
  surface:'#1E293B',
  border: '#334155',
  muted:  '#94A3B8',
  white:  '#F8FAFC',
};

// ─── Rotating feature highlight cards ────────────────────────────────────────
const FEATURES = [
  {
    icon: '📋',
    color: T.purple,
    title: 'Real-time Triage',
    desc: 'Live queue management across all care centres with mood-based priority scoring.',
    stats: [{ v: '42', l: 'Active check-ins' }, { v: '7', l: 'High priority' }],
  },
  {
    icon: '🚨',
    color: T.red,
    title: 'Crisis Management',
    desc: 'One-click police and ambulance dispatch with geographic heatmap and event timeline.',
    stats: [{ v: '4.2min', l: 'Avg response' }, { v: '99.8%', l: 'Uptime' }],
  },
  {
    icon: '🚀',
    color: T.blue,
    title: 'Location Rollout',
    desc: '5-step guided wizard deploys a new care centre with credentials in under a minute.',
    stats: [{ v: '50+', l: 'Locations live' }, { v: '<60s', l: 'Deploy time' }],
  },
  {
    icon: '🤖',
    color: '#9333EA',
    title: 'Jax AI',
    desc: 'Natural language co-pilot for navigation, risk scoring, and clinical note drafting.',
    stats: [{ v: '98%', l: 'Accuracy' }, { v: '0.8s', l: 'Response time' }],
  },
  {
    icon: '🏥',
    color: T.green,
    title: 'Field Agents',
    desc: 'GPS-tracked agent assignments with mobile check-ins and real-time case sync.',
    stats: [{ v: '200+', l: 'Field agents' }, { v: 'Live', l: 'GPS sync' }],
  },
];

// ─── Small helpers ─────────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial:   { opacity: 0, y: 24 },
  animate:   { opacity: 1, y: 0  },
  transition:{ delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
});

const FeatureCard = ({ feature, isActive }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.92, y: 20 }}
    animate={{ opacity: isActive ? 1 : 0.45, scale: isActive ? 1 : 0.95, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    style={{
      background: isActive ? T.surface : 'transparent',
      border: `1.5px solid ${isActive ? feature.color + '66' : T.border + '55'}`,
      borderRadius: 16, padding: isActive ? '20px 22px' : '14px 18px',
      cursor: 'pointer', transition: 'all 0.3s', userSelect: 'none',
      boxShadow: isActive ? `0 8px 40px ${feature.color}22` : 'none',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isActive ? 10 : 0 }}>
      <span style={{ fontSize: 20 }}>{feature.icon}</span>
      <span style={{ fontWeight: 700, fontSize: 15, color: isActive ? T.white : T.muted }}>{feature.title}</span>
    </div>
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p style={{ fontSize: 13, color: T.muted, margin: '0 0 12px', lineHeight: 1.6 }}>{feature.desc}</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {feature.stats.map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 22, fontWeight: 900, color: feature.color }}>{s.v}</div>
                <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// ─── Floating metric badges ───────────────────────────────────────────────────
const FloatingBadge = ({ emoji, label, value, style }) => (
  <motion.div
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: style.animDelay || 0 }}
    style={{
      position: 'absolute', background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: '10px 16px', backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 10, zIndex: 10,
      ...style,
    }}
  >
    <span style={{ fontSize: 20 }}>{emoji}</span>
    <div>
      <div style={{ fontWeight: 900, fontSize: 18, color: T.white, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  </motion.div>
);

// ─── Live status row (scrolling ticker) ──────────────────────────────────────
const TICKER_ITEMS = [
  '✅ Alex M. checked in · mood 7/10',
  '🚨 Crisis event raised · Newtown',
  '🤖 Jax AI: "3 clients at risk today"',
  '🚀 New location deployed · Parramatta',
  '📋 42 active check-ins',
  '✅ Jordan P. mood improving · 6 → 8',
];

const Ticker = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TICKER_ITEMS.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      background: `${T.green}15`, border: `1px solid ${T.green}44`,
      borderRadius: 100, padding: '6px 16px', overflow: 'hidden', maxWidth: 480,
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          style={{ fontSize: 13, color: T.green, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {TICKER_ITEMS[idx]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function PromoHero({ onCTA, onWatchDemo }) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Auto-cycle features
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(i => (i + 1) % FEATURES.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        background: `linear-gradient(160deg, ${T.dark} 0%, #0a0f1e 60%, #0d0528 100%)`,
        minHeight: '100vh', overflow: 'hidden', position: 'relative',
        fontFamily: "'Inter', -apple-system, sans-serif",
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: -200, left: -200, width: 800, height: 800, borderRadius: '50%', background: `radial-gradient(circle, ${T.purple}18 0%, transparent 65%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${T.blue}14 0%, transparent 65%)`, pointerEvents: 'none' }} />

      {/* Nav bar */}
      <motion.nav
        {...fadeUp(0)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 48px', borderBottom: `1px solid ${T.border}33`,
          backdropFilter: 'blur(10px)', position: 'relative', zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.purple}, ${T.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#fff' }}>AC</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: T.white }}>AcuteConnect</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCTA}
            style={{ padding: '10px 24px', borderRadius: 100, background: `linear-gradient(135deg, ${T.purple}, ${T.blue})`, border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            Sign in
          </button>
        </div>
      </motion.nav>

      {/* Main content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 0, alignItems: 'center', padding: isMobile ? '32px 20px' : '60px 48px', maxWidth: 1400, margin: '0 auto', width: '100%', position: 'relative', boxSizing: 'border-box' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {inView && (
            <>
              <motion.div {...fadeUp(0.1)}>
                <Ticker />
              </motion.div>

              <motion.div {...fadeUp(0.2)}>
                <h1 style={{
                  margin: 0, fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: 900,
                  lineHeight: 1.08, letterSpacing: -2,
                  background: `linear-gradient(135deg, ${T.white} 0%, ${T.muted} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Acute care,<br />
                  <span style={{
                    background: `linear-gradient(135deg, ${T.purple}, ${T.blue})`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>reimagined.</span>
                </h1>
              </motion.div>

              <motion.p {...fadeUp(0.3)} style={{ margin: 0, fontSize: 18, color: T.muted, lineHeight: 1.7, maxWidth: 480 }}>
                The all-in-one platform for frontline mental health teams — real-time triage, AI-powered risk scoring, crisis dispatch, and location management in one place.
              </motion.p>

              <motion.div {...fadeUp(0.4)} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <motion.button
                  onClick={onCTA}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '14px 36px', borderRadius: 100, fontSize: 16, fontWeight: 800, color: '#fff', border: 'none',
                    background: `linear-gradient(135deg, ${T.purple}, ${T.blue})`,
                    boxShadow: `0 8px 40px ${T.purple}55`, cursor: 'pointer',
                  }}
                >
                  Get started free →
                </motion.button>
                <motion.button
                  onClick={onWatchDemo}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '14px 28px', borderRadius: 100, fontSize: 16, fontWeight: 600, color: T.muted,
                    background: 'transparent', border: `1px solid ${T.border}`, cursor: onWatchDemo ? 'pointer' : 'default',
                    opacity: onWatchDemo ? 1 : 0.5,
                  }}
                >
                  Watch demo
                </motion.button>
              </motion.div>

              <motion.div {...fadeUp(0.5)} style={{ display: 'flex', gap: 24, paddingTop: 8 }}>
                {[['10k+', 'Client check-ins'], ['50+', 'Care centres'], ['99.9%', 'Uptime']].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: T.white }}>{v}</div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
                  </div>
                ))}
              </motion.div>
            </>
          )}
        </div>

        {/* Right column — feature rotator + floating badges */}
        {inView && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, padding: '0 0 0 40px' }}
          >
            {/* Floating badges */}
            <FloatingBadge emoji="🟢" label="Live check-ins" value="42" style={{ top: -30, right: 20, animDelay: 0 }} />
            <FloatingBadge emoji="🚨" label="Active incidents" value="3"  style={{ bottom: 40, left: -10, animDelay: 1.5 }} />
            <FloatingBadge emoji="🤖" label="AI confidence"  value="98%" style={{ top: '40%', right: -10, animDelay: 0.8 }} />

            {/* Feature cards */}
            {FEATURES.map((f, i) => (
              <button
                key={f.title}
                onClick={() => setActiveFeature(i)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setActiveFeature(i)}
                aria-pressed={activeFeature === i}
                aria-label={`Show ${f.title} feature`}
                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', width: '100%' }}
              >
                <FeatureCard feature={f} isActive={activeFeature === i} />
              </button>
            ))}

            {/* Dots */}
            <div role="tablist" aria-label="Feature highlights" style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
              {FEATURES.map((f, i) => (
                <motion.button
                  key={i}
                  role="tab"
                  aria-selected={activeFeature === i}
                  aria-label={`Go to ${f.title}`}
                  onClick={() => setActiveFeature(i)}
                  animate={{ width: activeFeature === i ? 20 : 8, background: activeFeature === i ? T.purple : T.border }}
                  transition={{ duration: 0.3 }}
                  style={{ height: 8, borderRadius: 100, cursor: 'pointer', border: 'none', padding: 0 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom trust bar */}
      {inView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{
            borderTop: `1px solid ${T.border}33`, padding: '20px 48px',
            display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap',
          }}
        >
          {['FHIR Compliant', 'SOC 2 Ready', 'HIPAA-aligned', 'Australian Hosted', '24/7 Support'].map(label => (
            <div key={label} style={{ fontSize: 12, color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: T.green }}>✓</span> {label}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
