/**
 * @fileoverview Type-safe query key factory for TanStack Query.
 *
 * Centralizes all query key definitions so cache invalidation is consistent
 * and discoverable. Each entity namespace provides `all`, `list`, and `detail`
 * key builders.
 *
 * @example
 * ```ts
 * // In a query
 * useQuery({ queryKey: queryKeys.teams.list(filters), queryFn: ... })
 *
 * // Invalidate all team queries after mutation
 * queryClient.invalidateQueries({ queryKey: queryKeys.teams.all })
 *
 * // Invalidate specific detail
 * queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail("team-123") })
 * ```
 *
 * @module lib/query-keys
 */

function createEntityKeys<TFilters = Record<string, unknown>>(entity: string) {
    return {
        all: [entity] as const,
        lists: () => [entity, "list"] as const,
        list: (filters?: TFilters) => [entity, "list", filters] as const,
        details: () => [entity, "detail"] as const,
        detail: (id: string) => [entity, "detail", id] as const,
    }
}

export const queryKeys = {
    teams: createEntityKeys("teams"),
    organizations: createEntityKeys("organizations"),
    accounts: createEntityKeys("accounts"),
    patients: createEntityKeys("patients"),
    payers: createEntityKeys("payers"),
    feeScheduleEntries: createEntityKeys("fee-schedule-entries"),
    medications: createEntityKeys("medications"),
    icd10Codes: createEntityKeys("icd-10-codes"),
    testMenu: createEntityKeys("test-menu"),
    users: createEntityKeys("users"),
    batches: createEntityKeys("batches"),
    claims: createEntityKeys("claims"),
    claimVerifications: createEntityKeys("claim-verifications"),
    invoices: createEntityKeys("invoices"),
    patientNotes: createEntityKeys("patient-notes"),
    features: createEntityKeys("features"),
    plans: createEntityKeys("plans"),
    patientConfig: createEntityKeys("patient-config"),
    batchConfig: createEntityKeys("batch-config"),
} as const
