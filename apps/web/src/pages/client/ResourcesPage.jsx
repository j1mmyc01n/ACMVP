import React from 'react';
import { Tabs, Card } from '../../components/UI';

const RESOURCES = [
  { name: "Camperdown Mental Health Center", desc: "Primary mental health facility", addr: "96 Carillon Ave, Newtown NSW 2042", phone: "(02) 9515 9000", dist: "0.2 km" },
  { name: "RPA Hospital Emergency", desc: "24/7 emergency mental health services", addr: "Missenden Rd, Camperdown NSW 2050", phone: "(02) 9515 6111", dist: "0.5 km" },
  { name: "Headspace Camperdown", desc: "Youth mental health 12–25", addr: "Level 2, Brain and Mind Centre, 94 Mallett St", phone: "(02) 9114 4100", dist: "0.3 km" },
];

export const LocationInfoView = () => (
  <Card title="Camperdown Acute Care Service" subtitle="Information and contact details">
    <div className="ac-stack" style={{ gap: 12 }}>
      <div><div style={{ fontWeight: 600 }}>Address:</div><div style={{ fontSize: 14 }}>100 Mallett St, Camperdown NSW 2050</div></div>
      <div><div style={{ fontWeight: 600 }}>Operating Hours:</div><div style={{ fontSize: 14 }}>Monday to Friday: 8am – 5pm</div></div>
      <div><div style={{ fontWeight: 600 }}>Contact Number:</div><div style={{ color: "#007AFF" }}>02 9555 1234</div></div>
    </div>
  </Card>
);

export const ResourcesView = () => (
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
    <Tabs active="resources" onChange={(id) => id !== "resources" && goto("checkin")} tabs={[{ id: "checkin", label: "Check-In" }, { id: "resources", label: "Resources" }]} />
    <ResourcesView />
  </div>
);

export default ResourcesPage;
