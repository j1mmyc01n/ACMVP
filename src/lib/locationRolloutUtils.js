// Location Rollout Utilities
// Helper functions for monitoring, alerts, and autonomous operations

import { supabase } from '../supabase/supabase';

/**
 * Check health of a location's infrastructure
 */
export async function checkLocationHealth(locationId, location) {
  try {
    const healthChecks = {
      netlify_status: 'up',
      supabase_status: 'up',
      github_status: 'up',
      response_time_ms: 0,
      uptime_percentage: 100,
    };

    // Check Netlify site
    if (location.netlify_url) {
      const startTime = Date.now();
      try {
        const response = await fetch(location.netlify_url, { method: 'HEAD', timeout: 5000 });
        healthChecks.response_time_ms = Date.now() - startTime;
        healthChecks.netlify_status = response.ok ? 'up' : 'down';
      } catch (error) {
        healthChecks.netlify_status = 'down';
      }
    }

    // Check Supabase (via API)
    if (location.supabase_url) {
      try {
        const response = await fetch(`${location.supabase_url}/rest/v1/`, { method: 'HEAD', timeout: 5000 });
        healthChecks.supabase_status = response.ok || response.status === 404 ? 'up' : 'down';
      } catch (error) {
        healthChecks.supabase_status = 'down';
      }
    }

    // Check GitHub repo (via API)
    if (location.github_repo_full_name) {
      try {
        const response = await fetch(`https://api.github.com/repos/${location.github_repo_full_name}`, { 
          method: 'GET',
          timeout: 5000 
        });
        healthChecks.github_status = response.ok ? 'up' : 'down';
      } catch (error) {
        healthChecks.github_status = 'down';
      }
    }

    // Calculate overall status
    const allUp = healthChecks.netlify_status === 'up' && 
                  healthChecks.supabase_status === 'up' && 
                  healthChecks.github_status === 'up';
    const status = allUp ? 'healthy' : 'degraded';

    // Calculate uptime (simplified - in production would track over time)
    healthChecks.uptime_percentage = allUp ? 100 : 95;

    // Save health check
    await supabase.from('location_health_checks').insert({
      location_id: locationId,
      status,
      ...healthChecks,
      checked_at: new Date().toISOString(),
      next_check_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // Next check in 5 minutes
    });

    return { success: true, status, ...healthChecks };
  } catch (error) {
    console.error('Health check error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Track API usage event
 */
export async function trackApiUsage(locationId, usageData) {
  try {
    await supabase.from('location_api_usage').insert({
      location_id: locationId,
      endpoint: usageData.endpoint || '/api/unknown',
      method: usageData.method || 'GET',
      credits_consumed: usageData.credits || 1,
      response_time_ms: usageData.responseTime || 0,
      status_code: usageData.statusCode || 200,
      request_body_size: usageData.requestSize || 0,
      response_body_size: usageData.responseSize || 0,
      timestamp: new Date().toISOString(),
    });

    // Update location credits
    const { data: location } = await supabase
      .from('location_instances')
      .select('credits_used')
      .eq('id', locationId)
      .single();

    if (location) {
      await supabase
        .from('location_instances')
        .update({ 
          credits_used: (location.credits_used || 0) + (usageData.credits || 1) 
        })
        .eq('id', locationId);
    }

    return { success: true };
  } catch (error) {
    console.error('Usage tracking error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check and trigger alert rules
 */
export async function checkAlertRules(locationId) {
  try {
    // Get location data
    const { data: location } = await supabase
      .from('location_instances')
      .select('*')
      .eq('id', locationId)
      .single();

    if (!location) return { success: false, error: 'Location not found' };

    // Get alert rules
    const { data: rules } = await supabase
      .from('location_alert_rules')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true);

    if (!rules || rules.length === 0) return { success: true, triggeredRules: [] };

    const triggeredRules = [];

    for (const rule of rules) {
      let shouldTrigger = false;
      let currentValue = 0;

      switch (rule.rule_type) {
        case 'credit_threshold':
          currentValue = location.credits_used || 0;
          shouldTrigger = rule.comparison_operator === 'greater_than' 
            ? currentValue > rule.threshold_value
            : currentValue < rule.threshold_value;
          break;

        case 'uptime':
          // Get latest health check
          const { data: health } = await supabase
            .from('location_health_checks')
            .select('uptime_percentage')
            .eq('location_id', locationId)
            .order('checked_at', { ascending: false })
            .limit(1)
            .single();
          
          currentValue = health?.uptime_percentage || 100;
          shouldTrigger = currentValue < rule.threshold_value;
          break;

        case 'response_time':
          // Get average response time from recent health checks
          const { data: healthChecks } = await supabase
            .from('location_health_checks')
            .select('response_time_ms')
            .eq('location_id', locationId)
            .order('checked_at', { ascending: false })
            .limit(10);
          
          if (healthChecks && healthChecks.length > 0) {
            currentValue = healthChecks.reduce((sum, h) => sum + h.response_time_ms, 0) / healthChecks.length;
            shouldTrigger = currentValue > rule.threshold_value;
          }
          break;
      }

      if (shouldTrigger) {
        triggeredRules.push({
          ...rule,
          currentValue,
          message: `Alert: ${rule.rule_type} threshold exceeded (${currentValue} vs ${rule.threshold_value})`,
        });

        // Update trigger count
        await supabase
          .from('location_alert_rules')
          .update({
            last_triggered_at: new Date().toISOString(),
            trigger_count: rule.trigger_count + 1,
          })
          .eq('id', rule.id);
      }
    }

    return { success: true, triggeredRules };
  } catch (error) {
    console.error('Alert check error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate monthly invoice for a location
 */
export async function generateMonthlyInvoice(locationId, billingPeriodStart, billingPeriodEnd) {
  try {
    // Get location
    const { data: location } = await supabase
      .from('location_instances')
      .select('*')
      .eq('id', locationId)
      .single();

    if (!location) return { success: false, error: 'Location not found' };

    // Calculate usage charges
    const { data: usage } = await supabase
      .from('location_daily_usage')
      .select('total_credits_consumed')
      .eq('location_id', locationId)
      .gte('date', billingPeriodStart)
      .lte('date', billingPeriodEnd);

    const totalCredits = usage?.reduce((sum, day) => sum + (day.total_credits_consumed || 0), 0) || 0;
    const creditRate = 0.01; // $0.01 per credit
    const usageCharge = totalCredits * creditRate;

    // Plan fees
    const planFees = {
      starter: 99,
      pro: 299,
      enterprise: 999,
    };
    const baseSubscriptionFee = planFees[location.plan_type] || 299;

    // Calculate totals
    const subtotal = usageCharge + baseSubscriptionFee;
    const tax = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + tax;

    // Create billing record
    const { data: invoice, error } = await supabase
      .from('location_billing')
      .insert({
        location_id: locationId,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        credits_used: totalCredits,
        credit_rate: creditRate,
        usage_charge: usageCharge,
        base_subscription_fee: baseSubscriptionFee,
        subtotal,
        tax,
        total_amount: totalAmount,
        status: 'pending',
        due_date: new Date(new Date(billingPeriodEnd).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days after period end
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, invoice };
  } catch (error) {
    console.error('Invoice generation error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Autonomous monitoring job - runs periodically
 */
export async function runAutonomousMonitoring() {
  try {
    console.log('[Autonomous Monitor] Starting health checks...');

    // Get all active locations
    const { data: locations } = await supabase
      .from('location_instances')
      .select('*')
      .eq('status', 'active');

    if (!locations || locations.length === 0) {
      console.log('[Autonomous Monitor] No active locations found');
      return { success: true, checkedCount: 0 };
    }

    const results = [];

    // Run health checks for each location
    for (const location of locations) {
      const healthResult = await checkLocationHealth(location.id, location);
      const alertResult = await checkAlertRules(location.id);

      results.push({
        locationId: location.id,
        locationName: location.location_name,
        health: healthResult,
        alerts: alertResult,
      });

      // If critical alerts, could send notifications here
      if (alertResult.triggeredRules?.length > 0) {
        console.log(`[Autonomous Monitor] Alerts triggered for ${location.location_name}:`, alertResult.triggeredRules);
      }
    }

    console.log(`[Autonomous Monitor] Completed checks for ${locations.length} locations`);
    return { success: true, checkedCount: locations.length, results };
  } catch (error) {
    console.error('[Autonomous Monitor] Error:', error);
    return { success: false, error: error.message };
  }
}
