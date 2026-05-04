import type { AgentResponse } from '@acmvp/types';
interface Patient {
    id?: string;
    full_name?: string;
    crn?: string;
    mood?: number;
    support_category?: string;
    [key: string]: unknown;
}
interface TriageResult {
    priority: 'HIGH' | 'MODERATE' | 'LOW';
    mood_score: number;
    alert_flags: string[];
    recommended_action: string;
    confidence: number;
    summary: string;
}
/**
 * AI triage stub — returns a rule-based assessment until the OpenAI API is wired in.
 * TODO: Replace with actual OpenAI/Claude API call in Phase 2.
 */
export declare function triagePatient(patient: Patient): Promise<TriageResult>;
/**
 * Generic agent call stub — placeholder for the OpenAI/Claude agent layer.
 * TODO: Replace with actual API call.
 */
export declare function callAgent(prompt: string): Promise<AgentResponse>;
export {};
//# sourceMappingURL=triage.d.ts.map