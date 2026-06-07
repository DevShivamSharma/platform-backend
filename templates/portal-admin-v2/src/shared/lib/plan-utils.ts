/**
 * @fileoverview Utility functions for formatting Plan data for display.
 *
 * Converts backend Plan model fields into human-readable strings.
 * Centralizes formatting so all plan-displaying components stay consistent.
 *
 * @module lib/plan-utils
 */

import type { Plan, CreditAllocation } from "@/models"
import type { BadgeConfig } from "@/components/ui/status-badge"

// ── Price Formatting ─────────────────────────────────────────

/**
 * Formats price in cents to display string.
 * 0 → "Free", 4900 → "$49.00", 10050 → "$100.50"
 */
export function formatPlanPrice(priceAmountCents: number): string {
    if (priceAmountCents === 0) return "Free"
    const dollars = priceAmountCents / 100
    return `$${dollars.toFixed(2)}`
}

/**
 * Returns the billing period suffix for a plan.
 * Free plans → "", paid plans → "/mo"
 */
export function formatPlanPeriod(priceAmountCents: number): string {
    if (priceAmountCents === 0) return ""
    return "/mo"
}

// ── Feature Display ──────────────────────────────────────────

/**
 * Formats a feature key for human-readable display.
 * "claims_processing" → "Claims Processing"
 * "vobs" → "VOBs"
 */
export function formatFeatureKey(key: string): string {
    if (key.toUpperCase() === "VOBS") return "VOBs"

    return key
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Formats a single credit allocation as a feature line.
 * { featureKey: "claims", amount: 100 } → "100 Claims included"
 */
export function formatCreditAllocation(allocation: CreditAllocation): string {
    const label = formatFeatureKey(allocation.featureKey)
    return `${allocation.amount.toLocaleString()} ${label} included`
}

/**
 * Converts a Plan's creditAllocations into a display-ready feature list.
 * Falls back to plan description if no allocations exist.
 */
export function getPlanFeatures(plan: Plan): string[] {
    if (plan.creditAllocations && plan.creditAllocations.length > 0) {
        return plan.creditAllocations.map(formatCreditAllocation)
    }
    return plan.description ? [plan.description] : []
}

/**
 * Formats overage price in cents to display string.
 * 0 → null (no overage), 50 → "$0.50/ea overage", 100 → "$1.00/ea overage"
 */
export function formatOveragePrice(overagePriceCents: number): string | null {
    if (overagePriceCents <= 0) return null
    const dollars = overagePriceCents / 100
    return `$${dollars.toFixed(2)}/ overage`
}

export interface PlanFeatureDetail {
    label: string
    allocation: string
    overage: string | null
}

/**
 * Returns structured feature details for a plan, including overage pricing.
 * Falls back to plan description as a single label if no allocations exist.
 */
export function getPlanFeatureDetails(plan: Plan): PlanFeatureDetail[] {
    if (plan.creditAllocations && plan.creditAllocations.length > 0) {
        return plan.creditAllocations.map((a) => ({
            label: formatFeatureKey(a.featureKey),
            allocation: `${a.amount.toLocaleString()} included`,
            overage: formatOveragePrice(a.overagePriceCents),
        }))
    }
    if (plan.description) {
        return [{ label: plan.description, allocation: "", overage: null }]
    }
    return []
}

// ── Plan Styling ─────────────────────────────────────────────

/**
 * Index-based color palette for dynamic plan styling.
 * Rotates through 5 colors for any number of plans.
 */
const PLAN_COLORS = [
    {
        className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
        dotClassName: "bg-amber-500",
        ringClass: "ring-amber-400 dark:ring-amber-500",
        badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
        className: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25",
        dotClassName: "bg-sky-500",
        ringClass: "ring-sky-400 dark:ring-sky-500",
        badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
        className: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/25",
        dotClassName: "bg-violet-500",
        ringClass: "ring-violet-400 dark:ring-violet-500",
        badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
        className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
        dotClassName: "bg-emerald-500",
        ringClass: "ring-emerald-400 dark:ring-emerald-500",
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
        className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
        dotClassName: "bg-rose-500",
        ringClass: "ring-rose-400 dark:ring-rose-500",
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
] as const

/**
 * Gets color styling for a plan based on its array index.
 * Wraps around if there are more plans than colors.
 */
export function getPlanColorByIndex(index: number) {
    return PLAN_COLORS[index % PLAN_COLORS.length]
}

/**
 * Builds a dynamic BadgeConfig record from a Plan array.
 * Keyed by both plan.id and plan.name (lowercased) for flexible lookups.
 */
export function buildPlanBadgeConfig(plans: Plan[]): Record<string, BadgeConfig> {
    const config: Record<string, BadgeConfig> = {}
    plans.forEach((plan, index) => {
        const color = getPlanColorByIndex(index)
        const badge: BadgeConfig = {
            label: plan.name,
            className: color.className,
            dotClassName: color.dotClassName,
        }
        config[plan.id] = badge
        config[plan.name.toLowerCase()] = badge
    })
    return config
}
