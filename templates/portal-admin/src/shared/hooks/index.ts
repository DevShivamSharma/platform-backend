/**
 * @fileoverview Barrel export for the hooks module.
 *
 * Centralizes all custom hook exports so consumers can import from
 * a single path: `@/hooks`.
 *
 * @module hooks
 *
 * @example
 * ```tsx
 * import { useFormState, useFormSubmit, useUsers } from "@/hooks"
 * import type { UseFormStateReturn } from "@/hooks"
 * ```
 */

export { createCurrentUserHook } from "./use-current-user"
export type { ListBaseParams, EntityServices, EntityHookReturn } from "./use-entity-query"
export { useCrudPage } from "./use-crud-page"
export type { UseCrudPageConfig, UseCrudPageReturn } from "./use-crud-page"
export { useFormState } from "./use-form-state"
export type { UseFormStateReturn } from "./use-form-state"
export { useFormSubmit } from "./use-form-submit"
export type { UseFormSubmitOptions, FormSubmitExecutor } from "./use-form-submit"
export { useEntityFormModal } from "./use-entity-form-modal"
export { useUsers } from "./use-users"
export { useDeleteEntity } from "./use-delete-entity"
export { useCrudState } from "./use-crud-state"
export { useOrganizations } from "./use-organizations"
export { useAccounts } from "./use-accounts"
export { usePatients } from "./use-patients"
export { useClaims } from "./use-claims"
export { useTeams } from "./use-teams"
export { usePayers } from "./use-payers"
export { useFeeScheduleEntries } from "./use-fee-schedule-entries"
export { useMedications } from "./use-medications"
export { useIcd10Codes } from "./use-icd-10-codes"
export { useTestMenu } from "./use-test-menu"
export { useActivityTracker } from "./use-activity-tracker"
export { useBatches } from "./use-batches"
export { useBatchDetail } from "./use-batch-detail"
export { useBatchCount } from "./use-batch-count"
export { useBatchConfig } from "./use-batch-config"
export { usePayerOptions } from "./use-payer-options"
export { usePassword } from "./use-password"
export { useClaimVerifications } from "./use-claim-verifications"
export { usePatientConfig } from "./use-patient-config"
export { useClaimStatusConfig } from "./use-claim-status-config"
export { usePatientNotes } from "./use-patient-notes"
export { useDebouncedValue } from "./use-debounced-value"
export { useFeatures } from "./use-features"
export { usePlans } from "./use-plans"
export { useAvailablePlans } from "./use-available-plans"
export { useInvoices } from "./use-invoices"
export type { InvoiceFilters, UseInvoicesReturn } from "./use-invoices"
export { useUsagePeriods } from "./use-usage-periods"
export type { UsagePeriodFilters, UseUsagePeriodsReturn } from "./use-usage-periods"
export { usePatientInsurance } from "./use-patient-insurance"
export type { InsuranceTierState, UsePatientInsuranceConfig, UsePatientInsuranceReturn } from "./use-patient-insurance"
export { usePatientImport } from "./use-patient-import"
export type { ValidatedRowEntry, UsePatientImportConfig, UsePatientImportReturn } from "./use-patient-import"
export { useInsuranceDiscovery } from "./use-insurance-discovery"
export type { DiscoveryFormValues, UseInsuranceDiscoveryReturn } from "./use-insurance-discovery"
