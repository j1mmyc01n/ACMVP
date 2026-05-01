// Legal document content for the Acute Connect Legal Hub.
// Mirrors the bundle in `acute-connect-legal.pdf`. When you change any
// document, also bump the matching version in `src/lib/audit/index.js`
// so the next audit-log row reflects the new version.

const COMPANY = 'Acute Connect Pty Ltd';
const EMAIL = 'legal@acuteconnect.com.au';
const SITE = 'acuteconnect.com.au';

export const LEGAL_DOCS = [
  {
    id: 'privacy',
    label: 'Privacy Policy',
    tag: 'Required',
    summary: 'How Acute Connect collects, uses, and protects information.',
    sections: [
      {
        title: 'Important: Zero-PII by design',
        body:
          `Acute Connect is designed with a zero-PII (personally identifiable information) architecture wherever possible. We do not collect or retain your full name, date of birth, residential address, Medicare number, or health record identifiers. We collect only the minimum information required to schedule and deliver your follow-up call.`,
      },
      {
        title: '1. Who We Are',
        body:
          `${COMPANY} operates the Acute Connect platform accessible at ${SITE}. Our Privacy Officer can be contacted at ${EMAIL}.`,
      },
      {
        title: '2. What We Do NOT Collect',
        list: [
          'Your full name',
          'Your date of birth (used only as a one-time verification hash — never stored in readable form)',
          'Your phone number (used solely to deliver your access code and call-room link via SMS)',
          'Your home address or location',
          'Your Medicare or health record identifiers',
        ],
      },
      {
        title: '3. What We Do Collect',
        list: [
          'A unique anonymous session token (generated when you redeem your access code)',
          'Your Client Reference Number (CRN) — a time-stamped code containing no personal details',
          'Your acute care centre identifier (the 3-letter prefix in your CRN, e.g. "CAM" for Camperdown)',
          'Your mood rating (0–10 scale, if you choose to share it)',
          'Any concerns you voluntarily share in the free-text field',
          'Your preferred call window (day and time slot)',
          'A push notification subscription endpoint (only if you grant permission)',
          'Device and browser type, for technical compatibility purposes only',
          'Timestamps of check-in and call scheduling events',
        ],
      },
      {
        title: '4. Data Storage and Security',
        body:
          'All data is stored on Supabase infrastructure located in the ap-southeast-2 (Sydney) region. Security measures include row-level security on all tables, SHA-256 hashing of verification data with server-side pepper, TLS 1.3 in transit, AES-256 at rest, hash-chained immutable audit logs, JWT authentication with 12-hour session expiry, and HTTPS enforced via Netlify with HSTS preload.',
      },
      {
        title: '5. Retention and Deletion',
        list: [
          'Phone numbers: deleted immediately after SMS delivery',
          'DOB hash: retained for 24 hours after code expiry, then deleted',
          'Access codes: deleted 24 hours after expiry',
          'Session tokens: expire after 12 hours of inactivity',
          'Check-in records: retained for 7 years (NSW Health records legislation)',
          'Audit logs: retained for 7 years, then securely destroyed',
          'Push notification subscriptions: deleted when the call is completed or the subscription expires',
        ],
      },
      {
        title: '6. Your Rights (Privacy Act & APPs)',
        list: [
          'Request access to any personal information we hold about you (APP 12)',
          'Request correction of inaccurate personal information (APP 13)',
          'Remain anonymous — we do not collect identifying information by default',
          `Complain about a privacy breach to our Privacy Officer at ${EMAIL}`,
          'Escalate to the Office of the Australian Information Commissioner (OAIC)',
          'For NSW Health deployments, escalate to the NSW Information and Privacy Commission',
        ],
      },
    ],
  },
  {
    id: 'terms',
    label: 'Terms of Use',
    tag: 'Required',
    summary: 'The terms under which you access and use the platform.',
    sections: [
      {
        title: 'Emergency notice',
        body:
          'If you are in immediate danger or experiencing a mental health crisis, call 000 or Lifeline 13 11 14. This platform is not a crisis service and cannot respond to emergencies.',
      },
      {
        title: '1. Acceptance of Terms',
        body:
          'By accessing or using Acute Connect, you agree to these Terms of Use. These terms are governed by the laws of New South Wales, Australia.',
      },
      {
        title: '2. Description of Service',
        body:
          'Acute Connect is a care coordination and scheduling platform. It enables recently discharged patients to schedule welfare check-in calls, self-report mood and concerns to their care team, lets clinicians manage call scheduling, and lets health districts monitor post-discharge engagement.',
      },
      {
        title: '3. What Acute Connect Is NOT',
        list: [
          'A crisis service or emergency service',
          'A substitute for clinical care, diagnosis, or treatment',
          'A telehealth or therapy platform',
          'A substitute for calling 000 in an emergency',
          "A replacement for your treating clinician's professional judgement",
        ],
      },
      {
        title: '4. Your Obligations',
        list: [
          'Use the Platform only for its intended purpose — care coordination and check-in scheduling',
          'Provide accurate information when requested for verification purposes',
          "Not attempt to access another user's data or sessions",
          'Not use the Platform to transmit harmful, threatening, or illegal content',
          'Not attempt to reverse-engineer, decompile, or interfere with the Platform',
          'Notify your care team or call 000 if you are in immediate danger',
        ],
      },
      {
        title: '5. Limitation of Liability',
        body:
          `To the maximum extent permitted by Australian Consumer Law, ${COMPANY} excludes liability for clinical outcomes, third-party service failures (Twilio, Google Calendar, Microsoft Outlook, Supabase), AI-generated triage suggestions, service interruption or data loss, missed push notifications or SMS messages, and decisions made by clinicians based on information presented through the Platform. Where liability cannot be excluded under Australian Consumer Law, our liability is limited to resupplying the service.`,
      },
      {
        title: '6. AI-Generated Content',
        body:
          'The Platform includes an AI triage feature powered by Claude (Anthropic). It is advisory only, may contain errors, and does not constitute clinical advice or a diagnosis. All clinically significant decisions must be made by a qualified health professional.',
      },
      {
        title: '7. Governing Law',
        body:
          'These Terms are governed by the laws of New South Wales, Australia. The parties submit to the exclusive jurisdiction of NSW courts.',
      },
    ],
  },
  {
    id: 'medical',
    label: 'Medical & Clinical Disclaimer',
    tag: 'Critical',
    summary: 'Important notice about the clinical use of this platform.',
    sections: [
      {
        title: 'Emergency notice',
        body:
          'If you or someone else is in immediate danger, call 000. For mental health crisis support, call Lifeline 13 11 14.',
      },
      {
        title: '1. Not a Medical Service',
        body:
          'Acute Connect is a care scheduling and self-reporting coordination tool. It is not a clinical decision support system, telehealth service, or replacement for medical care. Using the platform does not create a clinician-patient relationship between you and Acute Connect.',
      },
      {
        title: '2. Not for Emergencies',
        list: [
          'Do not use this platform if you are in immediate danger',
          'Do not use this platform if you are at risk of harming yourself or others',
          'Do not use this platform if you require immediate medical attention',
          'In an emergency, call 000 immediately',
        ],
      },
      {
        title: '3. AI Triage — Advisory Only',
        list: [
          'Powered by a third-party large language model (Claude by Anthropic)',
          'Has not been validated as a clinical decision support tool or medical device',
          'Has not been registered with the TGA as a Software-as-a-Medical-Device',
          'May produce incorrect, incomplete, or misleading assessments',
          'Must not be used as the sole basis for any clinical decision',
          'Does not replace the professional judgement of a qualified clinician',
        ],
      },
      {
        title: '4. Mood Self-Reporting',
        body:
          'The mood scale (0–10) is a general self-report measure for care coordination. It is not a validated clinical assessment tool (e.g. PHQ-9, K10), nor a suicide or self-harm risk screening instrument. If your clinician needs validated tools, those should be administered through standard clinical channels.',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI & Automated Processing Disclosure',
    tag: 'Required',
    summary: 'How AI is used on the platform and your rights.',
    sections: [
      {
        title: '1. AI Features Used',
        list: [
          'AI Triage (powered by Claude, Anthropic Inc.) — analyses patient check-in data and produces an advisory triage suggestion for clinicians',
          'On-device crisis keyword detection — a deterministic pattern-matching system, not AI',
          'OpenAI Moderation API — screens free-text content for harmful content categories',
        ],
      },
      {
        title: '2. How AI Triage Works',
        list: [
          "The patient's mood score, shared concerns, and check-in status are sent to Anthropic's API",
          'The API returns a structured JSON response: priority, alert flags, recommended action',
          'Output is displayed to the clinician as an advisory suggestion only',
          'AI output is never shown directly to the patient',
          'AI output is never used to automatically escalate or contact emergency services',
        ],
      },
      {
        title: '3. What AI Does NOT Do',
        list: [
          'Make any clinical diagnosis',
          'Recommend or prescribe medication or treatment',
          'Automatically escalate any case without human review',
          'Contact emergency services',
          "Replace the professional judgement of the treating clinician",
          'Store or train on patient data (per third-party data processing agreements)',
        ],
      },
      {
        title: '4. Your Rights Regarding Automated Processing',
        list: [
          'Know when your data is processed by an automated system (this disclosure fulfils that obligation)',
          'Request human review of any AI-generated output that affects you',
          `Object to automated processing of your data by contacting ${EMAIL}`,
        ],
      },
    ],
  },
  {
    id: 'crisis',
    label: 'Crisis Safety & Scope of Service Notice',
    tag: 'Critical',
    summary: 'What this platform is — and is not — for.',
    sections: [
      {
        title: 'In immediate danger?',
        body:
          'Call 000 now. This page is information only. Acute Connect is not a crisis service.',
      },
      {
        title: 'If you need help right now',
        list: [
          'Emergency: 000 — police, ambulance, fire',
          'Lifeline: 13 11 14 — 24/7 crisis support (call or text)',
          '13YARN: 13 92 76 — Aboriginal & Torres Strait Islander crisis line',
          'Beyond Blue: 1300 22 4636 — anxiety, depression, mental health',
          'Suicide Call Back Service: 1300 659 467',
          'Kids Helpline: 1800 55 1800 — under 25',
        ],
      },
      {
        title: 'What Acute Connect Is For',
        list: [
          'Scheduling your post-discharge welfare check-in call',
          'Sharing how you are feeling (mood score and optional free text)',
          'Knowing who will call you and when',
          'Connecting you to local mental health resources',
        ],
      },
      {
        title: 'Safe Messaging',
        body:
          "This platform is built to comply with Mindframe's Safe Messaging Guidelines. It does not threaten consequences for non-engagement, describe methods of self-harm, or use language designed to retraumatise.",
      },
    ],
  },
  {
    id: 'cookies',
    label: 'Cookie & Storage Policy',
    tag: 'Required',
    summary: 'How we use browser storage to keep the platform working.',
    sections: [
      {
        title: '1. What We Store',
        list: [
          'Authentication session token (localStorage) — anonymous session identifier, expires after 12 hours',
          'Offline check-in queue (IndexedDB) — stores check-in data locally if you are offline, syncs when you reconnect',
          'Push notification subscription (IndexedDB) — your push endpoint for call reminders',
          'Theme preference (localStorage) — light or dark mode',
          'Language preference (localStorage)',
        ],
      },
      {
        title: '2. What We Do NOT Use',
        list: [
          'Third-party advertising or tracking cookies',
          'Analytics cookies that identify you personally',
          'Cross-site tracking pixels',
          'Social media tracking (Facebook Pixel, etc.)',
        ],
      },
      {
        title: '3. How to Clear Your Data',
        body:
          'In your browser settings, go to Privacy → Site Data, find this site, and clear storage. This will sign you out and remove any offline-queued check-ins.',
      },
    ],
  },
  {
    id: 'districts',
    label: 'Health District Service Agreement — Key Terms',
    tag: 'B2B',
    summary: 'Summary of obligations for deploying entities.',
    sections: [
      {
        title: '1. Deploying Entity Responsibilities',
        list: [
          'Maintain clinical oversight and governance for all patient interactions',
          'Ensure all clinicians using the platform are registered, qualified practitioners',
          'Provide patients with informed consent before issuing a CRN code',
          'Maintain escalation pathways for urgent self-reports',
          'Not represent the platform as a crisis service or clinical diagnostic tool',
          'Comply with Privacy Act 1988 (Cth) and APPs',
          `Notify ${COMPANY} of any suspected data breach within 24 hours`,
        ],
      },
      {
        title: '2. Data Ownership',
        body:
          `Patient check-in data belongs to the patient and the health district. ${COMPANY} processes data as a service provider under the health district's privacy framework. On contract termination, all patient data will be exported to the district and deleted from production systems within 30 days.`,
      },
      {
        title: '3. Liability Allocation',
        body:
          `${COMPANY} accepts liability for platform availability, data security, and technical performance. The health district accepts clinical liability for all patient care decisions, escalation responses, and treatment outcomes.`,
      },
    ],
  },
];

export const LEGAL_HUB_HEADER =
  'Use of Acute Connect constitutes agreement to all listed documents. Continuing, creating a CRN, checking in, or updating information confirms agreement and records a timestamped audit entry on the user profile card.';
