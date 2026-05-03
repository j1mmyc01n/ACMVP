import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { cx, badgeToneFor } from '../lib/utils';

export const DiamondLogo = ({ size = 22, color = "#1C1C1E" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M12 6L18 12L12 18L6 12L12 6Z" stroke={color} strokeWidth="1.5" fill="none"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
  </svg>
);

export const StatusBadge = ({ status }) => {
  const map = {
    active:   { bg: "#E8FAF0", color: "#1D8348", label: "active" },
    error:    { bg: "#FDEDEC", color: "#C0392B", label: "error" },
    inactive: { bg: "#F2F3F4", color: "#566573", label: "inactive" },
    pending:  { bg: "#FEF9E7", color: "#B7770D", label: "pending" },
    confirmed:{ bg: "#E8FAF0", color: "#1D8348", label: "confirmed" },
    overdue:  { bg: "#FDEDEC", color: "#C0392B", label: "overdue" },
    scheduled:{ bg: "#EAF2FB", color: "#1A5276", label: "scheduled" },
    completed:{ bg: "#F2F3F4", color: "#566573", label: "completed" },
  };
  const s = map[status] || map.inactive;
  return (
    <span style={{ 
      background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, 
      padding: "3px 10px", borderRadius: 20, letterSpacing: 0.1 
    }}>{s.label}</span>
  );
};

export const Badge = ({ children, tone = "blue" }) => {
  const tones = {
    blue: "ac-badge-blue",
    green: "ac-badge-green",
    amber: "ac-badge-amber",
    red: "ac-badge-red",
    gray: "ac-badge-gray",
    violet: "ac-badge-violet",
  };
  return <span className={cx("ac-badge", tones[tone])} style={{
    background: `var(--ac-badge-${tone}-bg)`,
    color: `var(--ac-badge-${tone}-text)`
  }}>{children}</span>;
};

export const Card = ({ title, subtitle, right, children, accent }) => (
  <section className={cx("ac-card", accent && "ac-card-accent")} style={accent ? { borderColor: '#7DD3FC' } : {}}>
    {(title || right) && (
      <header className="ac-card-head">
        <div>
          {title && <h3 className="ac-card-title">{title}</h3>}
          {subtitle && <p className="ac-card-sub">{subtitle}</p>}
        </div>
        {right}
      </header>
    )}
    <div className="ac-card-body">{children}</div>
  </section>
);

export const Button = ({ children, variant = "primary", icon: Icon, ...rest }) => (
  <button className={cx("ac-btn", `ac-btn-${variant}`)} {...rest}>
    {Icon && <SafeIcon icon={Icon} size={16} />}
    <span>{children}</span>
  </button>
);

export const Toggle = ({ on, onChange }) => (
  <div onClick={() => onChange(!on)} style={{ width: 51, height: 31, borderRadius: 999, background: on ? "#34C759" : "#E5E5EA", position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: 2, left: on ? 22 : 2, width: 27, height: 27, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.25)", transition: "left .2s" }}/>
  </div>
);

export const Tabs = ({ tabs, active, onChange }) => (
  <div className="ac-tabs" role="tablist">
    {tabs.map((t) => (
      <button
        key={t.id}
        role="tab"
        aria-selected={active === t.id}
        className={cx("ac-tab", active === t.id && "ac-tab-active")}
        onClick={() => onChange(t.id)}
      >
        {t.label}
      </button>
    ))}
  </div>
);

export const ProgressBar = ({ value }) => (
  <div className="ac-progress">
    <div className="ac-progress-bar" style={{ width: `${value}%` }} />
  </div>
);

export const Gauge = ({ val, max, label, unit, color="#3a7d7b", sz=100 }) => {
  const pct = Math.min(val/max,1), cx_pos=sz/2, cy_pos=sz*.58, r=sz*.38;
  const deg = a => { const rad=(a-90)*Math.PI/180; return [cx_pos+r*Math.cos(rad), cy_pos+r*Math.sin(rad)]; };
  const arc = (s,e) => { const [x1,y1]=deg(s), [x2,y2]=deg(e); return `M ${x1} ${y1} A ${r} ${r} 0 ${e-s>180?1:0} 1 ${x2} ${y2}`; };
  const [nx,ny] = deg(pct*180-90);
  return (
    <svg width={sz} height={sz*.72} viewBox={`0 0 ${sz} ${sz*.72}`}>
      <path d={arc(0,180)} fill="none" stroke="#374151" strokeWidth="7" strokeLinecap="round"/>
      <path d={arc(0,pct*180)} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"/>
      <line x1={cx_pos} y1={cy_pos} x2={nx} y2={ny} stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round"/>
      <circle cx={cx_pos} cy={cy_pos} r="3.5" fill="#E5E7EB"/>
      <text x={cx_pos} y={cy_pos-r-5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#E5E7EB">{Math.round(val)}{unit}</text>
      <text x={cx_pos} y={sz*.70} textAnchor="middle" fontSize="8" fill="#6B7280">{label}</text>
    </svg>
  );
};

export const Field = ({ label, hint, children }) => (
  <label className="ac-field">
    <span className="ac-field-label">{label}</span>
    {children}
    {hint && <span className="ac-field-hint">{hint}</span>}
  </label>
);

export const Input = (props) => <input className="ac-input" {...props} />;
export const Textarea = (props) => <textarea className="ac-input ac-textarea" {...props} />;
export const Select = ({ options = [], ...rest }) => (
  <div style={{ position: 'relative' }}>
    <select className="ac-input" style={{ appearance: 'none' }} {...rest}>
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93' }}>▾</span>
  </div>
);

export const StatCard = ({ label, value, sub, tone = "default", icon: Icon }) => (
  <div className={cx("ac-stat-tile", `ac-stat-${tone}`)}>
    <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '2px' }}>{value}</div>
    <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      {Icon && <SafeIcon icon={Icon} size={14} />}
      {label}
    </div>
    {sub && <div style={{ fontSize: '10px', color: 'var(--ac-muted)', lineHeight: '1.3' }}>{sub}</div>}
  </div>
);