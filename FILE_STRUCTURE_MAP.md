# Acute Connect — File Structure Map
_Full Stack PWA Architecture_

> Related documentation
>
> - **Supabase Dual Site Map (detailed)**: [`SUPABASE_DUAL_SITE_MAP.md`](./SUPABASE_DUAL_SITE_MAP.md)
>   - Complete UI/route map across app surfaces + Supabase tables, realtime channels, and serverless writers.

```
acute-connect-pwa/
├── .env                          # Environment variables (Supabase keys, API tokens)
├── .gitignore
├── package.json
├── vite.config.js
├── postcss.config.js
├── tailwind.config.js
├── index.html
├── README.md
├── TODO.md                       # Project task tracker
├── CHANGELOG.md                  # Version history
├── FILE_STRUCTURE_MAP.md         # This file
│
├── src/
│   ├── main.jsx                  # App entry point
│   ├── App.jsx                   # Main app shell (routing, auth, layout)
│   ├── App.css
│   ├── index.css
│   │
│   ├── common/                   # Shared utilities
│   │   └── SafeIcon.jsx          # Safe icon wrapper
│   │
│   ├── components/               # Reusable UI components
│   │   ├── UI.jsx                # Design system components (Button, Card, Badge, etc.)
│   │   ├── JaxAI.jsx             # AI assistant panel
│   │   └── GitHubAgent.jsx       # GitHub AI agent panel
│   │
│   ├── lib/                      # Utilities and configuration
│   │   ├── utils.js              # Helper functions (dark mode, classnames, etc.)
│   │   └── menu.js               # Navigation menu structure
│   │
│   ├── styles/                   # Global styles
│   │   └── acute.css             # Design system CSS variables
│   │
│   ├── supabase/                 # Supabase integration
│   │   ├── supabase.js           # Supabase client
│   │   └── migrations/           # Database schema migrations
│   │       ├── 1740395000000_initial_schema.sql
│   │       ├── 1777020684735-fix_policies_and_clients.sql
│   │       ├── 1777025000000-open_access_and_admins.sql
│   │       ├── 1777025373206-recreate_all_tables.sql
│   │       ├── 1777090000000-new_tables.sql
│   │       ├── 1777090001000-add_care_centre_to_clients.sql
│   │       ├── 1777090002000-ensure_care_centre.sql
│   │       ├── 1777090003000-add_clinical_notes.sql
│   │       ├── 1777090003000-clinical_notes_feedback.sql
│   │       ├── 1777090004000-add_support_category.sql
│   │       ├── 1777090005000-add_support_category_fix.sql
│   │       ├── 1777090006000-crn_requests.sql
│   │       ├── 1777090007000-otp_codes.sql
│   │       ├── 1777090008000-fix_crn_requests_policy.sql
│   │       ├── 1777090009000-sponsors.sql
│   │       ├── 1777090010000-add_status_to_clients.sql
│   │       ├── 1777090011000-fix_crn_requests_insert_policy.sql
│   │       ├── 1777090012000-add_logo_data_to_sponsors.sql
│   │       └── 1777090013000-update_sponsors_for_ads.sql
│   │
│   ├── pages/                    # Page modules
│   │   │
│   │   ├── ClientViews.jsx       # Public-facing pages export
│   │   ├── AdminViews.jsx        # Admin pages export
│   │   ├── SystemViews.jsx       # System admin pages export
│   │   │
│   │   ├── client/               # Public pages
│   │   │   ├── CheckInPage.jsx
│   │   │   ├── ResourcesPage.jsx
│   │   │   ├── ProfessionalsPage.jsx
│   │   │   ├── ProviderJoinPage.jsx
│   │   │   └── SponsorJoinPage.jsx
│   │   │
│   │   ├── admin/                # Admin pages
│   │   │   ├── TriageDashboard.jsx
│   │   │   ├── CRMPage.jsx
│   │   │   ├── CRNGenerator.jsx
│   │   │   ├── ClientCRM.jsx
│   │   │   ├── ClientProfileCard.jsx
│   │   │   ├── PatientRegistry.jsx
│   │   │   ├── InvoicingPage.jsx
│   │   │   ├── CrisisPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── SponsorLedger.jsx
│   │   │   ├── MultiCentreCheckin.jsx
│   │   │   └── AdditionalPages.jsx  # Bulk offboarding, crisis analytics, feedback
│   │   │
│   │   └── system/               # System admin pages
│   │       ├── OverseerDashboard.jsx    # Main NOC dashboard (renamed from SysDash)
│   │       ├── LocationRollout.jsx      # Fully automated deployment system
│   │       ├── LocationsPage.jsx        # Location management (renamed from Offices)
│   │       ├── IntegrationsPage.jsx
│   │       ├── SettingsPage.jsx
│   │       ├── UsersPage.jsx
│   │       ├── SuperAdminPage.jsx
│   │       ├── HeatMapPage.jsx
│   │       ├── FeedbackPage.jsx
│   │       ├── FeatureRequestPage.jsx
│   │       ├── ProviderMetricsPage.jsx
│   │       ├── AICodeFixerPage.jsx
│   │       └── GitHubAgentPage.jsx
│   │
│   └── features/                 # Feature modules (future expansion)
│       ├── auth/
│       ├── crm/
│       ├── triage/
│       └── rollout/
│
└── public/                       # Static assets
    ├── manifest.json
    ├── icons/
    └── service-worker.js
```

## Architecture Principles

### 1. **Separation of Concerns**
- **Pages**: Top-level route components
- **Components**: Reusable UI elements
- **Features**: Business logic modules
- **Services**: API and data layer
- **Lib**: Utilities and configuration

### 2. **Modular Structure**
- Each major feature in its own directory
- Clear import/export boundaries
- Scalable for team collaboration

### 3. **PWA-First**
- Service worker for offline capability
- Manifest for installability
- Performance optimized

### 4. **Type Safety** (Future)
- Ready for TypeScript migration
- Prop validation with PropTypes

## Key Directories

### `/src/pages/system/`
System administration modules:
- **OverseerDashboard.jsx**: Real-time NOC monitoring
- **LocationRollout.jsx**: Automated deployment pipeline
- **LocationsPage.jsx**: Location CRUD operations

### `/src/pages/admin/`
Administrative features:
- **TriageDashboard.jsx**: Patient triage and prioritization
- **CRMPage.jsx**: Client relationship management
- **CrisisPage.jsx**: Crisis event handling

### `/src/pages/client/`
Public-facing pages:
- **CheckInPage.jsx**: Client check-in interface
- **ResourcesPage.jsx**: Community resources
- **ProfessionalsPage.jsx**: Provider directory

### `/src/components/`
Shared UI components:
- **UI.jsx**: Design system (buttons, cards, forms)
- **JaxAI.jsx**: AI assistant
- **GitHubAgent.jsx**: GitHub integration panel

### `/src/supabase/migrations/`
Database schema version control:
- All migrations timestamped
- Idempotent and reversible
- RLS policies included

## Migration Status

✅ **Phase 1**: Documentation (TODO, CHANGELOG, FILE_STRUCTURE_MAP)
✅ **Phase 2**: Split SystemViews.jsx into modular files
⏳ **Phase 3**: Split AdminViews.jsx into modular files
⏳ **Phase 4**: Extract features into `/features/`
⏳ **Phase 5**: Service layer abstraction
