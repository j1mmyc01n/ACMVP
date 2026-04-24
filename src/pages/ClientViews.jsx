import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { cx } from '../lib/utils';
import { 
  Tabs, Card, ProgressBar, Field, Input, 
  Textarea, Button, Select, Badge, StatusBadge 
} from '../components/UI';

const { FiMapPin, FiPhone, FiLink, FiShare2, FiChevronRight, FiFilter, FiUser, FiCreditCard } = FiIcons;

const RESOURCES = [
  { name: "Camperdown Mental Health Center", desc: "Primary mental health facility", addr: "96 Carillon Ave, Newtown NSW 2042", phone: "(02) 9515 9000", dist: "0.2 km" },
  { name: "RPA Hospital Emergency", desc: "24/7 emergency mental health services", addr: "Missenden Rd, Camperdown NSW 2050", phone: "(02) 9515 6111", dist: "0.5 km" },
  { name: "Headspace Camperdown", desc: "Youth mental health 12–25", addr: "Level 2, Brain and Mind Centre, 94 Mallett St", phone: "(02) 9114 4100", dist: "0.3 km" },
  { name: "University of Sydney Psychology Clinic", desc: "Psychological assessment and treatment services", addr: "Brain and Mind Centre, 94 Mallett St, Camperdown", phone: "(02) 9114 4343", dist: "0.4 km" },
  { name: "Black Dog Institute", desc: "Research, clinical expertise and national programs", addr: "Hospital Rd, Prince of Wales Hospital, Randwick", phone: "(02) 9382 4530", dist: "6.8 km" },
];

const PROFESSIONALS = [
  { id: 1, name: "Dr. Sarah Jenkins", qual: "Psychiatrist", sex: "Female", exp: "12 years", rating: 4.9, loc: [33, 45] },
  { id: 2, name: "Mark Thompson", qual: "Psychologist", sex: "Male", exp: "8 years", rating: 4.7, loc: [60, 20] },
  { id: 3, name: "Dr. Emily Chen", qual: "Psychiatrist", sex: "Female", exp: "15 years", rating: 5.0, loc: [45, 70] },
  { id: 4, name: "James Wilson", qual: "Social Worker", sex: "Male", exp: "10 years", rating: 4.6, loc: [20, 30] },
  { id: 5, name: "Dr. Robert Lee", qual: "Psychologist", sex: "Male", exp: "6 years", rating: 4.8, loc: [80, 50] },
];

export const ProfessionalsPage = () => {
  const [filter, setFilter] = useState({ qual: "All", sex: "All" });
  const [selectedProf, setSelectedProf] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sharing, setSharing] = useState(false);

  const filtered = PROFESSIONALS.filter(p => 
    (filter.qual === "All" || p.qual === filter.qual) &&
    (filter.sex === "All" || p.sex === filter.sex)
  );

  const handleShareLocation = () => {
    setSharing(true);
    setTimeout(() => {
      setSharing(false);
      alert("Location shared with network providers.");
    }, 1500);
  };

  return (
    <div className="ac-stack">
      <div style={{ fontSize: 20, fontWeight: 700 }}>Health Professionals</div>
      
      <Card title="Hybrid Map View" subtitle="Available professionals in your area">
        <div className="ac-map-container">
          <iframe 
            title="Map Area"
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no" 
            src="https://www.openstreetmap.org/export/embed.html?bbox=151.16%2C-33.91%2C151.21%2C-33.86&amp;layer=mapnik" 
            style={{ border: 0, position: 'absolute', inset: 0, pointerEvents: 'none', filter: 'var(--ac-map-filter)' }}
          />
          
          {filtered.map((p, idx) => (
            <div 
              key={p.id}
              className="ac-map-marker"
              onClick={() => setSelectedProf(p)}
              style={{ 
                left: `${p.loc[0]}%`, 
                top: `${p.loc[1]}%`,
                backgroundColor: selectedProf?.id === p.id ? 'var(--ac-primary)' : 'var(--ac-success)',
                animationDelay: `${idx * 0.1}s`
              }}
            />
          ))}

          {selectedProf && (
            <div style={{ 
              position: 'absolute', bottom: 12, left: 12, right: 12, 
              background: 'var(--ac-surface)', padding: 12, borderRadius: 10, 
              boxShadow: 'var(--ac-shadow-lg)', border: '1px solid var(--ac-border)',
              zIndex: 10, animation: 'fadeIn 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedProf.name}</div>
                  <div className="ac-muted ac-xs">{selectedProf.qual}</div>
                </div>
                <button onClick={() => setSelectedProf(null)} style={{ background: 'none', border: 'none', color: 'var(--ac-muted)', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          )}
        </div>

        <Button 
          variant="primary" 
          style={{ width: '100%', padding: '14px', fontSize: '16px', display: 'flex', justifyContent: 'center' }}
          icon={sharing ? FiIcons.FiLoader : FiMapPin}
          onClick={handleShareLocation}
          disabled={sharing}
        >
          {sharing ? "Sharing Location..." : "Share My Location"}
        </Button>
      </Card>

      <div className="ac-grid-2">
        <div className="ac-stack">
          <Card title="Filters" icon={FiFilter}>
            <div className="ac-grid-2">
              <Field label="Qualification">
                <Select 
                  value={filter.qual} 
                  onChange={e => setFilter({...filter, qual: e.target.value})}
                  options={["All", "Psychiatrist", "Psychologist", "Social Worker"]} 
                />
              </Field>
              <Field label="Sex">
                <Select 
                  value={filter.sex} 
                  onChange={e => setFilter({...filter, sex: e.target.value})}
                  options={["All", "Male", "Female"]} 
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="ac-stack" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
          {filtered.map(p => (
            <Card key={p.id} accent={selectedProf?.id === p.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                  <div className="ac-muted ac-xs">{p.qual} · {p.sex}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>⭐ {p.rating} · {p.exp} Experience</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSelectedProf(p); setShowForm(true); }}>Book</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {showForm && selectedProf && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
          <Card 
            title={`Request Appointment: ${selectedProf.name}`} 
            subtitle="Fill in the form below to request a session."
            style={{ maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="ac-stack">
              <Field label="Full Name"><Input placeholder="Enter your name" /></Field>
              <Field label="Email Address"><Input type="email" placeholder="your@email.com" /></Field>
              <Field label="Contact Number"><Input placeholder="+61 4XX XXX XXX" /></Field>
              <div className="ac-grid-2">
                <Field label="Preferred Date"><Input type="date" /></Field>
                <Field label="Preferred Time"><Input type="time" /></Field>
              </div>
              <Field label="Reason for Appointment">
                <Textarea placeholder="Briefly describe your needs..." />
              </Field>
              <div className="ac-grid-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={() => { alert("Request Sent!"); setShowForm(false); }}>Submit Request</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export const ProviderJoinPage = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", credentials: "", bio: "" });

  return (
    <div className="ac-stack" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
        <h2 className="ac-h2">Join as a Service Provider</h2>
        <p className="ac-muted">Partner with Acute Connect and reach more patients.</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <ProgressBar value={step === 1 ? 50 : 100} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8, color: 'var(--ac-muted)' }}>
          <span>1. Credentials</span>
          <span>2. Subscription</span>
        </div>
      </div>

      {step === 1 ? (
        <Card title="Provider Details" subtitle="Tell us about your practice and qualifications.">
          <div className="ac-stack">
            <Field label="Full Professional Name"><Input placeholder="Dr. Jane Smith" /></Field>
            <Field label="Email Address"><Input type="email" placeholder="jane@example.com" /></Field>
            <Field label="Qualifications / Credentials">
              <Textarea placeholder="List your degrees, certifications, and registration numbers..." />
            </Field>
            <Field label="Short Bio">
              <Textarea placeholder="A brief description for your profile..." />
            </Field>
            <Button style={{ width: '100%' }} onClick={() => setStep(2)}>Next: Subscription</Button>
          </div>
        </Card>
      ) : (
        <Card title="Partner Subscription" subtitle="Activate your uncapped lead generation.">
          <div className="ac-stack">
            <div style={{ background: 'var(--ac-primary-soft)', padding: 16, borderRadius: 12, textAlign: 'center', border: '1px solid var(--ac-primary)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ac-primary)', textTransform: 'uppercase' }}>Monthly Plan</div>
              <div style={{ fontSize: 36, fontWeight: 800, margin: '8px 0' }}>$250<span style={{ fontSize: 16, fontWeight: 400 }}> / month</span></div>
              <div className="ac-muted ac-xs">Uncapped lead submissions · Profile listing · Priority support</div>
            </div>

            <div style={{ height: 1, background: 'var(--ac-border)', margin: '12px 0' }} />
            
            <div className="ac-stack" style={{ gap: 12 }}>
              <Field label="Cardholder Name"><Input placeholder="Name on card" /></Field>
              <Field label="Card Number">
                <div style={{ position: 'relative' }}>
                  <Input placeholder="0000 0000 0000 0000" style={{ paddingLeft: 40 }} />
                  <SafeIcon icon={FiCreditCard} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ac-muted)' }} />
                </div>
              </Field>
              <div className="ac-grid-2">
                <Field label="Expiry"><Input placeholder="MM/YY" /></Field>
                <Field label="CVC"><Input placeholder="000" /></Field>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Button>
              <Button style={{ flex: 2 }} onClick={() => alert("Subscription Activated!")}>Start Partnership</Button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ac-muted)', marginTop: 12 }}>
              By clicking "Start Partnership", you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export const CheckInPage = ({ goto, onLoginIntent }) => {
  const [tab, setTab] = useState("checkin");
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [form, setForm] = useState({ code:"", concerns:"", mood:5 });

  const days = ["Today","Tomorrow","Wed 25","Thu 26","Fri 27","Sat 28","Sun 29"];
  const windows = [{ label:"Morning", time:"9am – 12pm", icon:"☀️" },{ label:"Afternoon", time:"12pm – 5pm", icon:"🌤" },{ label:"Evening", time:"5pm – 8pm", icon:"🌙" }];

  const handleConcerns = (val) => {
    setForm(f => ({ ...f, concerns: val }));
    if (/\b(kill|hurt)\s+(myself|me)\b|\bsuicid/i.test(val)) setCrisisOpen(true);
  };

  if (confirmed) return (
    <div className="ac-stack">
      <Card>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 50, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>You’re all set</div>
          <div style={{ fontSize: 14, color: "var(--ac-muted)", lineHeight: 1.6, marginBottom: 20 }}>
            Your clinician will call on <strong>{days[selectedDay]}</strong>, during the <strong>{windows[selectedWindow]?.label}</strong> window ({windows[selectedWindow]?.time})
          </div>
          <div style={{ background: "var(--ac-bg)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, textAlign: "left" }}>
            <div style={{ fontSize: 12, color: "var(--ac-muted)", marginBottom: 3 }}>Save this number in your contacts</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#007AFF" }}>(02) 9515 9000</div>
          </div>
          <Button variant="outline" style={{ width: "100%" }} onClick={() => { setConfirmed(false); setStep(1); }}>Change time</Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="ac-stack">
      <div style={{ fontSize: 20, fontWeight: 700 }}>Client Check-In</div>
      <Tabs active={tab} onChange={setTab} tabs={[{id:"checkin", label:"Check-In"}, {id:"location", label:"Location Info"}, {id:"resources", label:"Resources"}]} />

      {tab === "checkin" && (
        <div className="ac-stack">
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Step {step} of 4</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{step * 25}%</span>
            </div>
            <ProgressBar value={step * 25} />
          </div>

          {step === 1 && (
            <Card title="Client Verification">
              <Field label="Client Reference Number (CRN)" hint="Enter your Client Reference Number or paste it from clipboard.">
                <Input value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))} placeholder="Enter your CRN" style={{ fontFamily: 'monospace' }} />
              </Field>
              <Field label="Is there anything you'd like to share right away?">
                <Textarea value={form.concerns} onChange={e => handleConcerns(e.target.value)} placeholder="Optional: Share any immediate concerns" />
              </Field>
              <Button style={{ width: "100%", marginTop: 12 }} onClick={() => setStep(2)}>Continue</Button>
            </Card>
          )}

          {step === 2 && (
            <Card title="How are you feeling today?" subtitle="There are no wrong answers.">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, marginBottom: 12 }}>
                {["😔","😟","😐","🙂","😄"].map((e,i)=><span key={i}>{e}</span>)}
              </div>
              <input type="range" min={0} max={10} value={form.mood} onChange={e => setForm(f=>({...f,mood:+e.target.value}))} style={{ width: '100%', accentColor: 'var(--ac-primary)', height: '4px', margin: '12px 0' }} />
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: form.mood<=2?"#FF3B30":form.mood<=4?"#FF9500":form.mood<=6?"#FFCC00":"#34C759" }}>{form.mood}</span>
                <span style={{ fontSize: 16, color: "var(--ac-muted)" }}> / 10</span>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Button>
                <Button style={{ flex: 2 }} onClick={() => setStep(3)}>Continue</Button>
              </div>
            </Card>
          )}

          {step === 3 && (
            <div className="ac-stack">
              <div style={{ fontSize: 17, fontWeight: 700 }}>Pick a window that works for you</div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
                {days.map((d,i) => (
                  <button key={i} onClick={() => setSelectedDay(i)} className={cx("ac-tab", selectedDay===i && "ac-tab-active")} style={{ flexShrink:0, padding:"8px 14px", border: '1px solid var(--ac-border)' }}>{d}</button>
                ))}
              </div>
              <div className="ac-stack" style={{ gap: 10 }}>
                {windows.map((w,i) => (
                  <button key={i} onClick={() => setSelectedWindow(i)} style={{ padding: "16px", borderRadius: 14, border: selectedWindow===i ? "2px solid #007AFF" : "1px solid var(--ac-border)", background: selectedWindow===i ? "#EBF5FF" : "var(--ac-surface)", textAlign: "left", cursor: "pointer", display:"flex", alignItems:"center", gap:14 }}>
                    <span style={{ fontSize: 26 }}>{w.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{w.label}</div>
                      <div style={{ fontSize: 13, color: "var(--ac-muted)" }}>{w.time}</div>
                    </div>
                    {selectedWindow===i && <span style={{ color: "#007AFF", fontSize: 20 }}>✓</span>}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Button variant="outline" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</Button>
                <Button disabled={selectedWindow===null} style={{ flex: 2 }} onClick={() => setConfirmed(true)}>Confirm Window</Button>
              </div>
            </div>
          )}

          {/* Login Links at the bottom of the checkin page */}
          <div style={{ marginTop: 40, textAlign: 'center', paddingBottom: 80 }}>
            <div style={{ borderTop: '1px solid var(--ac-border)', margin: '20px 0' }} />
            <p className="ac-muted ac-xs" style={{ marginBottom: 12 }}>Authorized Personnel Access</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button variant="outline" size="sm" onClick={() => onLoginIntent('admin')}>Admin Login</Button>
              <Button variant="outline" size="sm" onClick={() => onLoginIntent('sysadmin')}>Sys Admin Login</Button>
            </div>
          </div>
        </div>
      )}

      {tab === "location" && <LocationInfoView />}
      {tab === "resources" && <ResourcesView />}

      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--ac-surface)", borderTop: "1px solid var(--ac-border)", padding: "10px 16px 20px", textAlign: "center", fontSize: 13, color: "var(--ac-muted)", zIndex: 50 }}>
        Need help? <a href="tel:131114" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Lifeline 13 11 14</a> · <a href="tel:000" style={{ color: "#007AFF", textDecoration: "none", fontWeight: 600 }}>Emergency 000</a>
      </footer>

      {crisisOpen && <CrisisDialog onClose={() => setCrisisOpen(false)} />}
    </div>
  );
};

const CrisisDialog = ({ onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 300, padding: "0 0 20px" }}>
    <div style={{ background: "var(--ac-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px", width: "100%", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ width: 40, height: 4, background: "var(--ac-border)", borderRadius: 999, margin: "0 auto 20px" }} />
      <div style={{ fontSize: 24, textAlign: "center", marginBottom: 8 }}>💙</div>
      <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 6 }}>Support is here for you</div>
      <p style={{ fontSize: 14, color: "var(--ac-muted)", textAlign: "center", marginBottom: 20 }}>You don’t have to do this alone.</p>
      <a href="tel:131114" style={{ display: "block", background: "#007AFF", color: "#fff", padding: "14px", borderRadius: 12, textAlign: "center", textDecoration: "none", fontWeight: 700, marginBottom: 10 }}>Call Lifeline 13 11 14</a>
      <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", padding: "14px", cursor: "pointer", fontSize: 15, color: "var(--ac-muted)" }}>I’m okay for now</button>
    </div>
  </div>
);

const LocationInfoView = () => (
  <Card title="Camperdown Acute Care Service" subtitle="Information and contact details">
    <div className="ac-stack" style={{ gap: 12 }}>
      <div><div style={{ fontWeight: 600 }}>Address:</div><div style={{ fontSize: 14 }}>100 Mallett St, Camperdown NSW 2050</div></div>
      <div><div style={{ fontWeight: 600 }}>Operating Hours:</div><div style={{ fontSize: 14 }}>Monday to Friday: 8am – 5pm</div></div>
      <div><div style={{ fontWeight: 600 }}>Contact Number:</div><div style={{ color: "#007AFF" }}>02 9555 1234</div></div>
    </div>
  </Card>
);

const ResourcesView = () => (
  <div className="ac-stack">
    <div style={{ fontSize: 17, fontWeight: 700 }}>Camperdown Resources</div>
    {RESOURCES.map((r, i) => (
      <Card key={i}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontWeight: 700 }}>{r.name}</div>
          <span style={{ background: "#EBF5FF", color: "#007AFF", fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 8 }}>{r.dist}</span>
        </div>
        <p className="ac-muted ac-xs">{r.desc}</p>
        <div style={{ fontSize: 13, marginTop: 8 }}>📍 {r.addr}</div>
        <div style={{ fontSize: 13, color: "#007AFF" }}>📞 {r.phone}</div>
      </Card>
    ))}
  </div>
);

export const ResourcesPage = ({ goto }) => (
  <div className="ac-stack">
    <div style={{ fontSize: 20, fontWeight: 700 }}>Client Resources</div>
    <Tabs active="resources" onChange={(id) => id !== "resources" && goto("checkin")} tabs={[{id:"checkin", label:"Check-In"}, {id:"location", label:"Location Info"}, {id:"resources", label:"Resources"}]} />
    <ResourcesView />
  </div>
);