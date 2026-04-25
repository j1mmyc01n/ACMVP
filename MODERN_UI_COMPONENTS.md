# Modern UI Components - Implementation Guide

This document describes the new modern UI components added to the Acute Connect application.

## Overview

The UI has been modernized with new components that match the design mockups provided. All components use the updated design system with modern color tokens, smooth animations, and responsive layouts.

## New Components

### 1. PatientCard
**Location:** `src/components/PatientCard.jsx`

A detailed patient profile card with comprehensive information display.

**Features:**
- Patient avatar with color coding
- Current mood score with visual indicator (8.5/10)
- PHQ-9 score with severity badge
- Journey timeline with event markers
- Sessions attended counter
- AI-powered insights with recommendations
- Action buttons (Schedule Telehealth, Send Message)

**Usage:**
```jsx
import PatientCard from './components/PatientCard';

<PatientCard 
  patient={patientData}
  onClick={() => handlePatientClick(patientData)}
  style={{ maxWidth: 650 }}
/>
```

### 2. SimplePatientCard
**Location:** `src/components/SimplePatientCard.jsx`

A compact patient card for grid layouts.

**Features:**
- Patient avatar and basic info
- Last check-in date and mood score
- Priority badge (if high priority)
- Mood progress indicator
- Quick action buttons

**Usage:**
```jsx
import SimplePatientCard from './components/SimplePatientCard';

<SimplePatientCard 
  patient={patientData}
  index={0}
  onClick={() => viewProfile(patientData)}
/>
```

### 3. ResourceHub
**Location:** `src/components/ResourceHub.jsx`

A curated mental health resources hub with filtering and search.

**Features:**
- Search functionality
- Category filters (All, Articles, Videos, Exercises, Podcasts, Guided Meditations)
- Resource cards with thumbnails, ratings, and views
- "Assign to Patient" button
- Interactive article, PDF, template, and podcast resource types

**Usage:**
```jsx
import ResourceHub from './components/ResourceHub';

<ResourceHub />
```

### 4. ModernTriageDashboard
**Location:** `src/pages/admin/ModernTriageDashboard.jsx`

A modern admin dashboard with KPIs, charts, and appointments.

**Features:**
- 4 gradient KPI cards (Active Patients, Avg Mood Score, Sessions Completed, Retention Rate)
- Mood trends line chart (using Recharts)
- Patient status pie chart
- Today's appointments grid
- Real-time data from Supabase
- Smooth animations using framer-motion

**Usage:**
```jsx
import ModernTriageDashboard from './pages/admin/ModernTriageDashboard';

// In routing:
case 'admin': return <ModernTriageDashboard />;
```

### 5. PatientDirectoryGrid
**Location:** `src/pages/admin/PatientDirectoryGrid.jsx`

A grid view for the patient directory with advanced filtering.

**Features:**
- Grid and list view toggle
- Search by name, ID, or condition
- Filter by status (All, Active, New, High Risk)
- Quick action buttons
- Pagination
- Connected to Supabase

**Usage:**
```jsx
import PatientDirectoryGrid from './pages/admin/PatientDirectoryGrid';

<PatientDirectoryGrid 
  onPatientClick={(patient) => openProfile(patient)}
/>
```

## Design System Updates

### Color Tokens
The design system has been updated with modern colors:

- **Primary:** `#4F46E5` (Indigo)
- **Primary Hover:** `#4338CA`
- **Teal:** `#14B8A6`
- **Success:** `#10B981`
- **Warning:** `#F59E0B`
- **Danger:** `#EF4444`

### New CSS Classes

```css
/* KPI Cards */
.ac-kpi-card
.ac-kpi-label
.ac-kpi-value
.ac-kpi-trend
.ac-kpi-trend-up
.ac-kpi-trend-down

/* Patient Cards */
.ac-patient-card
.ac-patient-card-header
.ac-patient-avatar
.ac-patient-info
.ac-patient-name
.ac-patient-meta
.ac-patient-stats
.ac-patient-stat
.ac-patient-stat-value
.ac-patient-stat-label

/* Resource Cards */
.ac-resource-card
.ac-resource-thumbnail
.ac-resource-content
.ac-resource-title
.ac-resource-meta
.ac-resource-rating

/* Chart Containers */
.ac-chart-container
.ac-chart-header
.ac-chart-title

/* Animations */
.ac-animate-fade-in
.ac-animate-slide-in
.ac-animate-scale-in
```

## Routing

New routes have been added to the menu:

```javascript
// Admin menu items
{ id: "admin", label: "Triage Dashboard", icon: FiGrid, badge: "New" }
{ id: "patient_directory", label: "Patient Directory", icon: FiUsers, badge: "New" }
{ id: "resource_hub", label: "Resource Hub", icon: FiBookOpen, badge: "New" }
{ id: "admin_old", label: "Triage Dashboard (Old)", icon: FiGrid }
```

## Data Integration

All components are connected to Supabase:

### Tables Used:
- `clients_1777020684735` - Patient/client data
- `check_ins_1740395000` - Check-in and mood tracking data
- `care_centres_1777090000` - Care center data

### Example Query:
```javascript
const { data: clients } = await supabase
  .from('clients_1777020684735')
  .select('*')
  .eq('status', 'active');
```

## Animations

All components use `framer-motion` for smooth animations:

```javascript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

## Responsive Design

All components are responsive and work on mobile, tablet, and desktop:

```css
@media (max-width: 768px) {
  .ac-grid-4 { grid-template-columns: 1fr 1fr; }
  .ac-grid-3 { grid-template-columns: 1fr; }
  .ac-grid-2 { grid-template-columns: 1fr; }
}
```

## Testing

To test the new components:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Run locally:**
   ```bash
   npm run dev
   ```

3. **Access the new pages:**
   - Admin Triage Dashboard: `/admin`
   - Patient Directory: `/patient_directory`
   - Resource Hub: `/resource_hub`

## Next Steps

1. Add more resource types to the Resource Hub
2. Implement actual API calls for assigning resources to patients
3. Add patient filtering by care center
4. Implement real-time notifications for appointments
5. Add export functionality to dashboards

## Support

For questions or issues, please contact the development team.
