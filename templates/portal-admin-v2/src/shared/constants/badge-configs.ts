import type { BadgeConfig } from "@/components/ui/status-badge"
import type { InsuranceStatus, PayerProvider } from "@/models"
import { ORGANIZATION_ROLE_OPTION, INSURANCE_STATUS_OPTION, ADMIN_ROLE_OPTION, STATUS_OPTION, CLAIM_STATUS_OPTION, PROVIDER_OPTION, LOOPING_OPTION, BATCH_STATUS_OPTION, BATCH_TYPE_OPTION, INVOICE_STATUS_OPTION, PERIOD_STATUS_OPTION, CLOSED_REASON_OPTION } from "@/constants";

interface BadgeOptionItem {
    value: string
    label: string
    className: string
    dotClassName?: string
}

const getConfig = (data: BadgeOptionItem[]): Record<string, BadgeConfig> => {
    const result: Record<string, BadgeConfig> = {}
    data.forEach((item) => {
        result[item.value.toLowerCase()] = item
    })
    return result
}

// ============================================================
// ACTIVE / INACTIVE  (users, accounts, orgs, payers, team)
// ============================================================

export const statusConfig: Record<string, BadgeConfig> = getConfig(STATUS_OPTION)


// ============================================================
// CLAIM STATUS
// ============================================================

export const claimStatusConfig: Record<string, BadgeConfig> = getConfig(CLAIM_STATUS_OPTION)

// ============================================================
// INSURANCE STATUS  (customer — lowercase keys)
// ============================================================

export const insuranceStatusConfig: Record<InsuranceStatus, BadgeConfig> = getConfig(INSURANCE_STATUS_OPTION)


// ============================================================
// INSURANCE STATUS  (admin — capitalised keys from API)
// ============================================================

export const adminInsuranceStatusConfig: Record<InsuranceStatus, BadgeConfig> = getConfig(INSURANCE_STATUS_OPTION)

// ============================================================
// ROLE BADGES  (profile pages)
// ============================================================

export const adminRoleConfig: Record<string, BadgeConfig> = getConfig(ADMIN_ROLE_OPTION)

export const organizationRoleConfig: Record<string, BadgeConfig> = getConfig(ORGANIZATION_ROLE_OPTION)

// ============================================================
// PAYER BADGES
// ============================================================

export const providerConfig: Record<PayerProvider, BadgeConfig> = getConfig(PROVIDER_OPTION)

export const loopingConfig: Record<string, BadgeConfig> = getConfig(LOOPING_OPTION)

// ============================================================
// BATCH JOB BADGES
// ============================================================

export const batchStatusConfig: Record<string, BadgeConfig> = getConfig(BATCH_STATUS_OPTION)

export const batchTypeConfig: Record<string, BadgeConfig> = getConfig(BATCH_TYPE_OPTION)

// ============================================================
// INVOICE STATUS BADGES
// ============================================================

export const invoiceStatusConfig: Record<string, BadgeConfig> = getConfig(INVOICE_STATUS_OPTION)

// ============================================================
// USAGE PERIOD BADGES
// ============================================================

export const periodStatusConfig: Record<string, BadgeConfig> = getConfig(PERIOD_STATUS_OPTION)

export const closedReasonConfig: Record<string, BadgeConfig> = getConfig(CLOSED_REASON_OPTION)