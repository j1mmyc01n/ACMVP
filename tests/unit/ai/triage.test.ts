import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triagePatient, callAgent } from '../../../packages/ai/src/triage';

describe('AI triage', () => {
  it('returns HIGH priority for very low mood', async () => {
    const result = await triagePatient({ mood: 2 });
    expect(result.priority).toBe('HIGH');
    expect(result.alert_flags).toContain('low_mood');
  });

  it('returns MODERATE priority for mid-range mood', async () => {
    const result = await triagePatient({ mood: 5 });
    expect(result.priority).toBe('MODERATE');
  });

  it('returns LOW priority for high mood', async () => {
    const result = await triagePatient({ mood: 9 });
    expect(result.priority).toBe('LOW');
    expect(result.alert_flags).toHaveLength(0);
  });

  it('confidence is between 0 and 1', async () => {
    const result = await triagePatient({ mood: 5 });
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe('AI agent stub', () => {
  it('returns an AgentResponse with a message', async () => {
    const response = await callAgent('What is the system status?');
    expect(response.message).toBeTruthy();
    expect(response.model).toBe('stub');
  });
});
