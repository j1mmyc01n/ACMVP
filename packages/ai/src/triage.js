/**
 * AI triage stub — returns a rule-based assessment until the OpenAI API is wired in.
 * TODO: Replace with actual OpenAI/Claude API call in Phase 2.
 */
export async function triagePatient(patient) {
    await new Promise((r) => setTimeout(r, 1200));
    const mood = patient.mood ?? 5;
    return {
        priority: mood <= 3 ? 'HIGH' : mood <= 6 ? 'MODERATE' : 'LOW',
        mood_score: mood,
        alert_flags: mood <= 3
            ? ['low_mood', 'sleep_disruption']
            : mood <= 5
                ? ['mild_anxiety']
                : [],
        recommended_action: mood <= 3
            ? 'Prioritise contact within 2 hours. Review safety plan.'
            : mood <= 6
                ? 'Standard follow-up within scheduled window.'
                : 'Routine check-in. Patient reports stable.',
        confidence: 0.87,
        summary: mood <= 3
            ? 'Patient reports significant distress. Immediate clinician review recommended.'
            : 'Patient engagement positive. Continue standard care pathway.',
    };
}
/**
 * Generic agent call stub — placeholder for the OpenAI/Claude agent layer.
 * TODO: Replace with actual API call.
 */
export async function callAgent(prompt) {
    await new Promise((r) => setTimeout(r, 800));
    return {
        message: `Agent received: "${prompt.slice(0, 60)}..."`,
        timestamp: new Date().toISOString(),
        model: 'stub',
    };
}
//# sourceMappingURL=triage.js.map