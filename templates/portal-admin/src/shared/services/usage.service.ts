import { api } from "@/services/api.service"

// ── Types ──────────────────────────────────────────────────────

export type PeriodStatus = "active" | "closed"

export type ClosedReason = "renewal" | "cancellation" | "plan_change"

export interface UsagePeriodFeature {
    featureKey: string
    planCreditsAllocated: number
    planCreditsUsed: number
    overageUnitsUsed: number
    overageUnitPriceCents: number
    overageAmountCents: number
}

export interface UsagePeriod {
    periodStart: string
    periodEnd: string
    status: PeriodStatus
    closedReason: ClosedReason | null
    customerName?: string
    features: UsagePeriodFeature[]
}

export interface UsagePeriodsResponse {
    total: number
    page: number
    limit: number
    totalPages: number
    items: UsagePeriod[]
}

export interface ListUsagePeriodsParams {
    page?: number
    limit?: number
    status?: PeriodStatus | ""
}

// ── API Calls ──────────────────────────────────────────────────

export function listMyUsagePeriods(params: ListUsagePeriodsParams = {}) {
    return api.get<UsagePeriodsResponse>("/api/v1/billing/credits/me/periods", {
        params: {
            page: params.page,
            limit: params.limit,
            status: params.status,
        },
    })
}

export function listUsagePeriods(
    organizationId: string | null | undefined,
    params: ListUsagePeriodsParams = {},
) {
    return api.get<UsagePeriodsResponse>(
        `/api/v1/billing/credits/periods`,
        {
            params: {
                page: params.page,
                limit: params.limit,
                status: params.status,
                organizationId: organizationId || undefined,
            },
        },
    )
}
