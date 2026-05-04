/**
 * Increment the per-location request counter. Called from a route's handler
 * to drive billing and quota enforcement. Failure is non-fatal.
 */
export declare function recordUsage(locationId: string, route: string, billableUnits?: number): Promise<void>;
//# sourceMappingURL=usage.d.ts.map