export interface AuditLog {
    id?: string;
    user_id?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    previous_value?: Record<string, unknown>;
    new_value?: Record<string, unknown>;
    agreement_version?: string;
    ip_address?: string;
    device_info?: Record<string, unknown>;
    created_at?: string;
}
export interface ProfileAuditLog {
    id?: string;
    user_id?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    ip_address?: string;
    device_info?: Record<string, unknown>;
    legal_bundle_version: string;
    agreement_accepted: boolean;
    created_at?: string;
}
export interface MedicalEvent {
    id?: string;
    user_id?: string;
    crn?: string;
    event_type: string;
    fhir_resource_type?: string;
    fhir_payload: Record<string, unknown>;
    created_at?: string;
}
export declare const MEDICAL_EVENT_TYPES: readonly ["patient_created", "check_in", "mood_observation", "note_added", "document_uploaded", "medication_change", "lab_result"];
export type MedicalEventType = (typeof MEDICAL_EVENT_TYPES)[number];
export declare const FHIR_RESOURCE_TYPES: readonly ["Patient", "Encounter", "Observation", "Condition", "MedicationStatement", "DocumentReference", "CarePlan", "AllergyIntolerance", "Immunization"];
export type FhirResourceType = (typeof FHIR_RESOURCE_TYPES)[number];
export interface ConsentAgreement {
    id?: string;
    user_id?: string;
    agreement_type: string;
    agreement_version: string;
    accepted: boolean;
    accepted_at?: string;
    ip_address?: string;
    device_info?: Record<string, unknown>;
    source_action?: string;
}
//# sourceMappingURL=clinical.d.ts.map