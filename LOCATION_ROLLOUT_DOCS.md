# Location Rollout Module - Documentation

## Overview

The redesigned Location Rollout module is a comprehensive platform for deploying, monitoring, and managing location instances with fully autonomous capabilities. It provides end-to-end infrastructure provisioning, real-time monitoring, usage tracking, billing management, and IT oversight.

## Features

### 1. **Autonomous Deployment Pipeline**
Fully automated infrastructure provisioning that creates:
- GitHub repositories from templates
- Supabase database projects with automatic configuration
- Netlify hosting with environment variables
- Automatic secret management and deployment triggers

### 2. **Professional Dashboard UI**
Modern financial-style dashboard inspired by Lindseo design with:
- Real-time metrics cards with trend indicators
- Interactive charts and visualizations (Recharts)
- Multi-view navigation (Overview, Provision, Monitor, Billing)
- Responsive grid layouts and professional styling

### 3. **API Key & Credential Management**
Secure delivery point for keys and credentials:
- Encrypted credential storage in database
- Secure viewing with show/hide toggle
- Copy-to-clipboard functionality
- Multiple credential types (GitHub tokens, Netlify tokens, Supabase keys)
- Last used tracking and expiration monitoring

### 4. **Credit & API Usage Monitoring**
Real-time usage tracking and analytics:
- Per-location credit consumption tracking
- Daily usage aggregation for performance
- API request counting and bandwidth monitoring
- Response time analytics
- Error rate tracking
- Usage trend charts and visualizations

### 5. **Billing & Invoice System**
Complete billing management:
- Automatic monthly invoice generation
- Usage-based billing ($0.01 per credit)
- Plan-based subscription fees (Starter/Pro/Enterprise)
- Tax calculation (10%)
- Billing history with status tracking
- Payment status monitoring (Pending/Paid/Overdue)

### 6. **IT Monitoring & Health Checks**
Autonomous health monitoring:
- Real-time infrastructure health checks
- Multi-service status monitoring (Netlify, Supabase, GitHub)
- Uptime percentage tracking
- Response time monitoring
- Service degradation detection
- Automated health check scheduling (every 5 minutes)

### 7. **Alert & Notification System**
Intelligent alert rules:
- Credit threshold alerts
- Uptime threshold monitoring
- Response time alerts
- Error rate monitoring
- Configurable alert rules per location
- Email notification support
- Alert history and trigger counting

## Database Schema

### Core Tables

#### `location_instances`
Stores deployed location information
- Infrastructure URLs (GitHub, Netlify, Supabase)
- Deployment status and phase tracking
- Billing plan and credit limits
- Contact information
- Timestamps and metadata

#### `location_credentials`
Encrypted credential storage
- Multiple credential types
- Active/inactive status
- Expiration tracking
- Last used timestamps

#### `location_api_usage`
Detailed API usage logs
- Per-request tracking
- Endpoint and method logging
- Credit consumption
- Performance metrics (response time, sizes)

#### `location_daily_usage`
Aggregated daily usage metrics
- Total requests and credits
- Bandwidth consumption
- Average response times
- Error counts
- Top endpoints

#### `location_billing`
Billing records and invoices
- Billing period tracking
- Usage and subscription charges
- Tax calculations
- Payment status and due dates

#### `location_health_checks`
Health monitoring data
- Overall status (healthy/degraded/down)
- Service-specific status
- Uptime percentage
- Performance metrics

#### `location_deployment_logs`
Deployment activity logs
- Phase-based logging
- Message types (info/success/warning/error)
- Timestamp tracking

#### `location_alert_rules`
Configurable alert rules
- Rule types (credit/uptime/response_time/error_rate)
- Threshold values
- Notification settings
- Trigger history

## Usage Guide

### Provisioning a New Location

1. **Navigate to Provision Tab**
   - Click "New Location" button or select Provision view

2. **Fill Location Details**
   - Location Name (e.g., "Bondi Beach Clinic")
   - Care Type (Mental Health, Crisis Support, etc.)
   - Plan Type (Starter/Pro/Enterprise)
   - Monthly Credit Limit
   - Contact Information

3. **Enter API Credentials**
   - GitHub Personal Access Token
   - GitHub Organization/Username
   - Template Repository
   - Netlify Personal Access Token
   - Supabase Management API Token
   - Supabase Organization ID

4. **Start Provisioning**
   - Click "Provision Location" button
   - Monitor real-time progress through 5 phases:
     1. GitHub Repository Creation
     2. Supabase Project Setup (60-second wait)
     3. Netlify Site Creation
     4. Secret Configuration
     5. Deployment Trigger

5. **Review Results**
   - Copy repository URLs and credentials
   - Follow next steps for GitHub secrets setup

### Monitoring Locations

1. **Select Location from Overview**
   - Click "View" button on any location
   - Automatically loads usage, billing, and health data

2. **View Real-time Metrics**
   - API Requests count
   - Credits Used vs Limit
   - Uptime Percentage
   - Average Response Time

3. **Analyze Usage Trends**
   - 30-day usage chart
   - Daily breakdown
   - Peak usage identification

4. **Check Infrastructure Health**
   - Netlify status
   - Supabase status
   - GitHub status
   - Manual health check trigger

5. **Review Active Alerts**
   - Alert type and threshold
   - Current value vs threshold
   - Last triggered timestamp

6. **Access API Credentials**
   - View secured credentials
   - Copy to clipboard
   - Show/hide values toggle

### Managing Billing

1. **View Current Month Charges**
   - Usage charges (credits × $0.01)
   - Plan subscription fee
   - Total amount due

2. **Review Billing History**
   - Past invoices
   - Payment status
   - Credit usage per period

3. **Monitor Payment Status**
   - Pending invoices
   - Due dates
   - Payment methods

### Autonomous Monitoring

1. **Enable Monitoring**
   - Click "Start Monitoring" button
   - Activates 5-minute interval checks

2. **Automatic Operations**
   - Health checks for all active locations
   - Alert rule evaluation
   - Status updates
   - Notification triggers

3. **Monitor Results**
   - Check console logs for monitoring activity
   - Review triggered alerts
   - Update location data automatically

## API Reference

### Utility Functions (`locationRolloutUtils.js`)

#### `checkLocationHealth(locationId, location)`
Performs comprehensive health check on location infrastructure
- **Parameters:**
  - `locationId`: UUID of location
  - `location`: Location object with URLs
- **Returns:** Health check results with service statuses

#### `trackApiUsage(locationId, usageData)`
Records API usage event and updates credits
- **Parameters:**
  - `locationId`: UUID of location
  - `usageData`: Object with endpoint, method, credits, etc.
- **Returns:** Success status

#### `checkAlertRules(locationId)`
Evaluates all alert rules for a location
- **Parameters:**
  - `locationId`: UUID of location
- **Returns:** Triggered rules array

#### `generateMonthlyInvoice(locationId, startDate, endDate)`
Creates monthly invoice based on usage
- **Parameters:**
  - `locationId`: UUID of location
  - `startDate`: Billing period start
  - `endDate`: Billing period end
- **Returns:** Invoice object

#### `runAutonomousMonitoring()`
Executes monitoring cycle for all active locations
- **Returns:** Results array with health checks and alerts

## Configuration

### Credit Rate
Default: $0.01 per credit
Location: `locationRolloutUtils.js` - `generateMonthlyInvoice` function

### Plan Fees
- Starter: $99/month
- Pro: $299/month
- Enterprise: $999/month

### Monitoring Interval
Default: 5 minutes
Location: `LocationRollout.jsx` - `useEffect` hook

### Health Check Timeout
Default: 5 seconds
Location: `locationRolloutUtils.js` - `checkLocationHealth` function

## Security Considerations

1. **Credential Storage**
   - Credentials stored in database
   - Should use encryption at rest in production
   - Limited access through RLS policies
   - Show/hide toggle for viewing

2. **API Tokens**
   - Never commit tokens to repository
   - Use environment variables for defaults
   - Rotate tokens regularly
   - Monitor token usage

3. **Access Control**
   - Implement RLS policies for production
   - Restrict credential access by user role
   - Audit credential access
   - Monitor suspicious activity

## Troubleshooting

### Provisioning Fails

**GitHub Repository Creation**
- Check GitHub token permissions (repo, workflow, admin:repo_hook)
- Verify organization name
- Ensure template repository exists
- Check rate limits

**Supabase Project Creation**
- Verify Supabase management token
- Check organization ID
- Ensure sufficient quota
- Wait for 60-second provisioning period

**Netlify Site Creation**
- Verify Netlify personal access token
- Check site name availability
- Ensure account has space for new site

### Monitoring Issues

**Health Checks Failing**
- Verify site URLs are accessible
- Check CORS settings
- Ensure services are running
- Review timeout settings

**No Usage Data**
- Verify location is active
- Check API usage tracking implementation
- Ensure credentials are valid
- Review database policies

### Billing Discrepancies

**Incorrect Credit Count**
- Check usage tracking function
- Verify aggregation queries
- Review daily usage records
- Validate credit calculation

**Missing Invoices**
- Run invoice generation manually
- Check billing period dates
- Verify location has usage data
- Review invoice generation function

## Future Enhancements

1. **Real-time WebSocket Updates**
   - Live dashboard updates
   - Instant alert notifications
   - Real-time usage graphs

2. **Advanced Analytics**
   - Predictive usage forecasting
   - Cost optimization recommendations
   - Performance benchmarking

3. **Multi-region Support**
   - Geographic distribution
   - Latency optimization
   - Redundancy options

4. **Automated Scaling**
   - Auto-adjust credit limits
   - Dynamic resource allocation
   - Load balancing

5. **Enhanced Security**
   - Hardware security module integration
   - Multi-factor authentication for credential access
   - Audit logging
   - Compliance reporting

## Support

For issues or questions:
1. Check this documentation
2. Review database schema
3. Check browser console for errors
4. Verify API credentials
5. Contact system administrator

---

**Version:** 1.0.0  
**Last Updated:** April 25, 2026  
**Maintained by:** ACMVP Team
