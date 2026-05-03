import React, { useState, useEffect, useCallback } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { supabase } from '../../supabase/supabase';

const { FiRefreshCw, FiHome, FiActivity, FiServer, FiWifi } = FiIcons;

function GaugeRing({ value, max, color, size = 80, strokeWidth = 9 }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / (max || 1)));
  const dash = circ * pct;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ac-border)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={size / 2} y={size / 2} dominantBaseline="central" textAnchor="middle"
        style={{ fontSize: 13, fontWeight: 800, fill: color, fontFamily: 'inherit' }}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function UptimeDot({ active }) {
  return (
    <span style={{
      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      background: active ? '#10B981' : '#EF4444',
      boxShadow: active ? '0 0 0 3px #d1fae5' : '0 0 0 3px #fee2e2',
      marginRight: 5, flexShrink: 0,
    }} />
  );
}

export function SuperAdminPage() {
  const [locations, setLocations] = useState([]);
  const [locationInstances, setLocationInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [centreRes, instRes] = await Promise.all([
        supabase.from('care_centres_1777090000').select('*').order('name'),
        supabase.from('location_instances').select('id,location_name,slug,status,plan_type,care_type,parent_location_id,monthly_credit_limit,primary_contact_email').order('location_name'),
      ]);
      setLocations(centreRes.data || []);
      setLocationInstances(instRes.data || []);
    } catch (e) {
      console.error('SuperAdminPage load error:', e);
    }
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const topLevel = locationInstances.filter(i => !i.parent_location_id);
  const childOf = (parentId) => locationInstances.filter(i => i.parent_location_id === parentId);

  const uptimeColor = (active) => active ? '#10B981' : '#EF4444';
  const activityPct = (c) => {
    const cap = c?.capacity || 20;
    const cur = c?.clients_count || 0;
    return Math.min(100, Math.round((cur / cap) * 100));
  };
  const activityColor = (pct) =>
    pct >= 90 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#10B981';

  const totalLocations = locations.length;
  const activeLocations = locations.filter(l => l.active).length;
  const totalInstances = locationInstances.length;

  return (
    <div style={{ padding: '0 0 48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Super Admin</h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ac-text-secondary)' }}>
            All allocations, sub-locations, uptime and API usage at a glance
          </div>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid var(--ac-border)', background: 'var(--ac-surface)', color: 'var(--ac-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          <SafeIcon icon={FiRefreshCw} size={14} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Locations',    value: totalLocations,  color: 'var(--ac-primary)', icon: FiHome },
          { label: 'Active',             value: activeLocations, color: '#10B981',            icon: FiActivity },
          { label: 'Inactive',           value: totalLocations - activeLocations, color: '#EF4444', icon: FiWifi },
          { label: 'Provisioned Sites',  value: totalInstances,  color: '#7C3AED',            icon: FiServer },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--ac-text-secondary)' }}>{s.label}</span>
              <SafeIcon icon={s.icon} size={15} style={{ color: s.color, opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ac-muted)' }}>Loading locations…</div>
      ) : locations.length === 0 && locationInstances.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No locations yet</div>
          <div style={{ color: 'var(--ac-muted)', fontSize: 14 }}>Create your first location using Quick Rollout.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {locations.length > 0 && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeIcon icon={FiHome} size={16} style={{ color: 'var(--ac-primary)' }} /> Care Centre Allocations
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {locations.map(loc => {
                  const actPct = activityPct(loc);
                  const aColor = activityColor(actPct);
                  const uColor = uptimeColor(loc.active);
                  return (
                    <div key={loc.id} style={{ background: 'var(--ac-surface)', border: `2px solid ${uColor}30`, borderRadius: 16, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: uColor }} />
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <UptimeDot active={loc.active} />
                            <span style={{ fontWeight: 800, fontSize: 15 }}>{loc.name}</span>
                            {loc.suffix && (
                              <span style={{ fontSize: 10, fontFamily: 'monospace', background: 'var(--ac-bg)', padding: '1px 6px', borderRadius: 4, color: 'var(--ac-muted)', border: '1px solid var(--ac-border)' }}>
                                {loc.suffix}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginTop: 3 }}>
                            {loc.primary_service || loc.care_type || 'general'} · cap {loc.capacity || 20}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                          background: loc.active ? '#D1FAE5' : '#FEE2E2',
                          color: loc.active ? '#065F46' : '#991B1B',
                        }}>
                          {loc.active ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12 }}>
                        <div style={{ textAlign: 'center' }}>
                          <GaugeRing value={actPct} max={100} color={aColor} size={70} />
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac-muted)', marginTop: 4, textTransform: 'uppercase' }}>Activity</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <GaugeRing value={loc.active ? 99.9 : 0} max={100} color={uColor} size={70} />
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ac-muted)', marginTop: 4, textTransform: 'uppercase' }}>Uptime</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ac-text-secondary)', background: 'var(--ac-bg)', padding: '6px 10px', borderRadius: 8 }}>
                        <span>Clients: <strong>{loc.clients_count || 0} / {loc.capacity || 20}</strong></span>
                        <span style={{ color: 'var(--ac-muted)' }}>Refreshed {lastRefresh.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {topLevel.length > 0 && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafeIcon icon={FiServer} size={16} style={{ color: '#7C3AED' }} /> Provisioned Instances &amp; Sub-Locations
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topLevel.map(inst => {
                  const subs = childOf(inst.id);
                  const isActive = inst.status === 'active';
                  return (
                    <div key={inst.id} style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: subs.length > 0 ? '1px solid var(--ac-border)' : 'none' }}>
                        <UptimeDot active={isActive} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{inst.location_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>
                            {inst.plan_type || 'standard'} · {inst.care_type || 'general'} · {inst.slug}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                          <div style={{ textAlign: 'center' }}>
                            <GaugeRing value={isActive ? 99 : 0} max={100} color={isActive ? '#10B981' : '#EF4444'} size={52} strokeWidth={6} />
                            <div style={{ fontSize: 9, color: 'var(--ac-muted)', marginTop: 3 }}>UPTIME</div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                          background: isActive ? '#D1FAE5' : inst.status === 'provisioning' ? '#EFF6FF' : '#FEE2E2',
                          color: isActive ? '#065F46' : inst.status === 'provisioning' ? '#1D4ED8' : '#991B1B',
                        }}>
                          {(inst.status || 'unknown').toUpperCase()}
                        </span>
                      </div>
                      {subs.map(sub => {
                        const subActive = sub.status === 'active';
                        return (
                          <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px 11px 38px', borderBottom: '1px solid var(--ac-border)', background: 'var(--ac-bg)' }}>
                            <span style={{ fontSize: 12, color: 'var(--ac-muted)' }}>↳</span>
                            <UptimeDot active={subActive} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{sub.location_name}</div>
                              <div style={{ fontSize: 11, color: 'var(--ac-muted)' }}>{sub.slug} · sub-location</div>
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                              background: subActive ? '#D1FAE5' : '#FEE2E2',
                              color: subActive ? '#065F46' : '#991B1B',
                            }}>
                              {(sub.status || 'unknown').toUpperCase()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SuperAdminPage;
