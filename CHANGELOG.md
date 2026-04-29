# Acute Connect — Changelog

## v4.1.0 — Location Rollout 2.0: Professional Monitoring & Billing Platform
### Major Features
- 🎨 **Professional Dashboard Redesign**
  - Financial-style UI inspired by modern fintech dashboards
  - Multi-view navigation (Overview, Provision, Monitor, Billing)
  - Real-time metrics cards with trend indicators
  - Interactive charts with Recharts (Area, Line, Bar charts)
  - Responsive grid layouts and professional color schemes

- 🔐 **API Key & Credential Management**
  - Secure credential delivery point for deployed locations
  - Encrypted storage in database (production-ready)
  - Show/hide toggle for sensitive data
  - Copy-to-clipboard functionality
  - Multiple credential types (GitHub, Netlify, Supabase)
  - Expiration and last-used tracking

- 📊 **Credit & API Usage Monitoring**
  - Real-time credit consumption tracking per location
  - Daily usage aggregation for performance
  - API request counting and bandwidth monitoring
  - Response time analytics with percentile tracking
  - Error rate monitoring
  - 30-day usage trend visualizations
  - Top endpoint tracking

- 💰 **Billing & Invoice System**
  - Automated monthly invoice generation
  - Usage-based billing ($0.01 per credit)
  - Tiered subscription plans (Starter $99, Pro $299, Enterprise $999)
  - Automatic tax calculation (10%)
  - Billing history with payment status
  - Due date tracking and overdue detection
  - Invoice export capabilities

- 🏥 **IT Monitoring & Health Checks**
  - Autonomous health monitoring system
  - Multi-service status checks (Netlify, Supabase, GitHub)
  - Uptime percentage calculation
  - Response time monitoring
  - Service degradation detection
  - Automated health checks every 5 minutes
  - Manual health check trigger option

- 🚨 **Alert & Notification System**
  - Configurable alert rules per location
  - Credit threshold alerts
  - Uptime monitoring with thresholds
  - Response time alerts
  - Error rate monitoring
  - Alert history and trigger counting
  - Email notification support
  - Visual alert dashboard

- 🤖 **Autonomous Operations**
  - Scheduled monitoring jobs (5-minute intervals)
  - Automatic health check execution
  - Alert rule evaluation
  - Status updates and notifications
  - Self-healing capabilities foundation

### Database Schema
- Created comprehensive monitoring schema with 8 new tables:
  - `location_instances` - Core location data
  - `location_credentials` - Encrypted credential storage
  - `location_api_usage` - Detailed usage logs
  - `location_daily_usage` - Aggregated metrics
  - `location_billing` - Invoice records
  - `location_health_checks` - Health monitoring data
  - `location_deployment_logs` - Deployment activity
  - `location_alert_rules` - Alert configuration

- Added sample data seeding for demonstration
- Implemented auto-update triggers
- Added indexes for performance optimization

### Technical Improvements
- Created `locationRolloutUtils.js` utility library
- Implemented health check functions
- Added usage tracking middleware
- Built alert evaluation engine
- Created invoice generation automation
- Integrated Recharts for data visualization

### Documentation
- Created comprehensive LOCATION_ROLLOUT_DOCS.md
- Usage guides for all features
- API reference documentation
- Troubleshooting guide
- Security best practices
- Future enhancement roadmap

---

## v4.0.1 — Architecture Verification & Documentation Update
### Verified
- ✅ All system modules properly created and functional
- ✅ Overseer Dashboard fully operational with real-time telemetry
- ✅ Location Rollout System complete with automated deployment
- ✅ Documentation synchronized with actual implementation

### Documentation
- Updated TODO.md to reflect completed state
- Clarified all features in Location Rollout System
- Verified FILE_STRUCTURE_MAP.md matches actual file tree

---

## v4.0.0 — Full Stack PWA Restructure
### Major Changes
- 🏗️ **Complete Modular Architecture**
  - Split monolithic files into organized folder structure
  - Separated concerns: pages, features, components, services
  - Improved maintainability and scalability

- 🎯 **Overseer Dashboard** (renamed from SysAdmin Dashboard)
  - High-tech Network Operations Center (NOC) interface
  - Real-time animated SVG gauges for all locations
  - Live system telemetry and health monitoring
  - Location-specific status cards with needle gauges
  - Simulated real-time data throughput metrics
  - Event stream logging

- 🚀 **Location Rollout System** — Complete rebuild
  - **Infrastructure Setup**: GitHub, Netlify, Supabase credentials
  - **Care Type Selection**: Mental health, domestic violence, crisis support, substance abuse, youth services, general care
  - **Automated Tailoring**: Deployment tasks adapt to care type (e.g., mental health gets psychiatrist network integration)
  - **User Provisioning**: Create admin and staff accounts per location
  - **Phase Pipeline**: Planning → IT Setup → Training → Testing → Live (visual progress tracking)
  - **Contact Management**: Key stakeholders tracking with CRUD operations
  - **Compliance Tracking**: Regulatory and safety checkpoints
  - **Live Deployment Terminal**: Real-time logs during setup with simulated deployment process
  - **Template System**: Uses Acute Care platform as base template for all new locations
  - **Local Storage**: Rollout data persisted locally for offline access

### Fixed
- ✅ Location management (renamed from Care Centres)
- ✅ All client profiles fully editable
- ✅ CRM requests no longer stuck
- ✅ Proper folder structure for scalability
- ✅ Module export errors resolved

---

## v3.0.1
### Added
- ✅ SysAdmin Super Dashboard (Nexus Layout) with live gauges
- ✅ Real-time data simulation and animation

## v3.0.0
### Added
- Location Rollout Module (basic version)
- Client Profile Card with event logs
- Care Team Access Control

### Fixed
- CRM clients from CRN requests
- PDF reports formatting

---

## v2.9.2
### Added
- Multi-Centre Check-In Management

## v2.9.1
### Fixed
- PDF reports, CRN Requests workflow

## v2.8.0
### Added
- GitHub AI Agent Panel

## v2.7.0
### Added
- AI Code Fixer
- Location Rollout Manager (prototype)

## v2.6.0
### Added
- PWA support
- OTP login
- Heat Map
- Crisis Analytics
- Bulk Offboarding

## v2.5.0
### Added
- Care team assignment
- Crisis analytics
- Provider & Sponsor join pages

## v2.0.0
### Added
- Jax AI assistant
- Authentication system
- CRM and Triage
- Clinical Reports
- Dark mode