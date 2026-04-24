import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('ac-dark');
    else root.classList.remove('ac-dark');
  }, [dark]);
  return [dark, setDark];
};

export const cx = (...c) => c.filter(Boolean).join(" ");

export const badgeToneFor = (b) => {
  if (!b) return "gray";
  const map = {
    New: "blue",
    Active: "green",
    Updated: "violet",
    Main: "green",
    Access: "amber",
    Permissions: "amber",
    PDF: "blue",
    QA: "amber",
    "Coming Soon": "amber",
    "Beta": "gray",
    "active": "green",
    "error": "red",
    "inactive": "gray",
    "pending": "amber",
    "confirmed": "green",
    "overdue": "red",
    "scheduled": "blue",
    "completed": "gray"
  };
  return map[b] || "gray";
};

export const generateCode = (prefix, now = new Date()) => {
  const y = now.getFullYear(), m = now.getMonth()+1, d = now.getDate();
  const hh = String(now.getHours()).padStart(2,"0"), mm = String(now.getMinutes()).padStart(2,"0");
  const leap = (y%4===0&&y%100!==0)||y%400===0;
  const dim = [31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  let doy = d; for(let i=0;i<m-1;i++) doy+=dim[i];
  const C = Math.floor(y/100)-19, YY = String(y%100).padStart(2,"0"), DDD = String(doy).padStart(3,"0");
  const sfx = Math.floor(Math.random()*1296).toString(36).padStart(2,"0").toUpperCase();
  return `${prefix.toUpperCase()}-${C}${YY}${DDD}-${hh}${mm}-${sfx}`;
};

export const callClaudeAI = async (patient, isMock = true) => {
  if (isMock) {
    await new Promise(r => setTimeout(r, 1200));
    return {
      priority: patient.mood <= 3 ? "HIGH" : patient.mood <= 6 ? "MODERATE" : "LOW",
      mood_score: patient.mood,
      alert_flags: patient.mood <= 3 ? ["low_mood","sleep_disruption"] : patient.mood <= 5 ? ["mild_anxiety"] : [],
      recommended_action: patient.mood <= 3 ? "Prioritise contact within 2 hours. Review safety plan." : patient.mood <= 6 ? "Standard follow-up within scheduled window." : "Routine check-in. Patient reports stable.",
      confidence: 0.87,
      summary: patient.mood <= 3 ? "Patient reports significant distress. Immediate clinician review recommended." : "Patient engagement positive. Continue standard care pathway."
    };
  }
  return null;
};