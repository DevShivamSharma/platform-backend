/**
 * @fileoverview UI option configurations for status badges, filters, and dropdowns.
 *
 * These constants define the display properties (label, className, dotClassName)
 * for badge/filter/dropdown options across the application.
 *
 * @module constants/option-configs
 */

import {
    BADGE_EMERALD, BADGE_RED, BADGE_AMBER, BADGE_ZINC,
    BADGE_VIOLET, BADGE_SKY, BADGE_SLATE, BADGE_ORANGE,
    DOT_EMERALD, DOT_RED, DOT_AMBER, DOT_ZINC,
    DOT_VIOLET, DOT_SKY, DOT_SLATE, DOT_ORANGE,
} from "./badge-styles"

export const INSURANCE_STATUS_OPTION = [
    { value: "Active", label: "Active", className: BADGE_EMERALD, dotClassName: DOT_EMERALD },
    { value: "Inactive", label: "Inactive", className: BADGE_RED, dotClassName: DOT_RED },
    { value: "Contradictory", label: "Contradictory", className: BADGE_AMBER, dotClassName: DOT_AMBER },
    { value: "Unknown", label: "Unknown", className: BADGE_ZINC, dotClassName: DOT_ZINC },
]

export const CLAIM_STATUS_OPTION = [
    { value: "Paid", label: "Paid", className: "bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/25", dotClassName: "bg-green-500" },
    { value: "Partial-Pay", label: "Partial Pay", className: BADGE_ORANGE, dotClassName: DOT_ORANGE },
    { value: "Denied", label: "Denied", className: BADGE_RED, dotClassName: DOT_RED },
    { value: "Pending", label: "Pending", className: BADGE_AMBER, dotClassName: DOT_AMBER },
    { value: "Accepted", label: "Accepted", className: BADGE_EMERALD, dotClassName: DOT_EMERALD },
    { value: "Rejected", label: "Rejected", className: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25", dotClassName: "bg-rose-500" },
    { value: "Forwarded", label: "Forwarded", className: BADGE_SKY, dotClassName: DOT_SKY },
    { value: "Not-Found", label: "Not Found", className: BADGE_ZINC, dotClassName: DOT_ZINC },
    { value: "Info-Requested", label: "Info Requested", className: BADGE_VIOLET, dotClassName: DOT_VIOLET },
    { value: "Error", label: "Error", className: "bg-destructive/15 text-destructive dark:text-red-400 border border-destructive/25", dotClassName: "bg-destructive" },
    { value: "Unknown", label: "Unknown", className: BADGE_SLATE, dotClassName: DOT_SLATE },
]

export const STATUS_OPTION = [
    { value: "Active", label: "Active", className: BADGE_EMERALD, dotClassName: DOT_EMERALD },
    { value: "Inactive", label: "Inactive", className: BADGE_RED, dotClassName: DOT_RED },
]

/** Plain status options for form Select dropdowns (no badge styling). */
export const STATUS_OPTIONS = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
]

export const ORGANIZATION_ROLE_OPTION = [
    { value: "Organization Admin", label: "Organization Admin", className: BADGE_VIOLET, dotClassName: DOT_VIOLET },
    { value: "Organization User", label: "Organization User", className: BADGE_SKY, dotClassName: DOT_SKY },
]

export const ADMIN_ROLE_OPTION = [
    { value: "Super Admin", label: "Super Admin", className: BADGE_AMBER, dotClassName: DOT_AMBER },
    { value: "Admin", label: "Admin", className: BADGE_VIOLET, dotClassName: DOT_VIOLET },
    { value: "Staff", label: "Staff", className: BADGE_SKY, dotClassName: DOT_SKY },
]

export const PROVIDER_OPTION = [
    { value: 'Availity', label: "Availity", className: BADGE_EMERALD, dotClassName: DOT_EMERALD },
    { value: 'Stedi', label: "Stedi", className: BADGE_VIOLET, dotClassName: DOT_VIOLET }
]

export const LOOPING_OPTION = [
    { value: 'enabled', label: "Enabled", className: BADGE_EMERALD, dotClassName: DOT_EMERALD },
    { value: 'disabled', label: "Disabled", className: BADGE_SLATE, dotClassName: DOT_SLATE }
]

export const BATCH_STATUS_OPTION = [
    { value: "PENDING", label: "Pending", className: BADGE_AMBER, dotClassName: DOT_AMBER },
    { value: "PROCESSING", label: "Processing", className: BADGE_SKY, dotClassName: DOT_SKY },
    { value: "COMPLETED", label: "Completed", className: BADGE_EMERALD, dotClassName: DOT_EMERALD },
    { value: "FAILED_SYSTEM_ERROR", label: "System Error", className: BADGE_RED, dotClassName: DOT_RED },
]

export const BATCH_TYPE_OPTION = [
    { value: "ELIGIBILITY", label: "Eligibility", className: BADGE_SKY, dotClassName: DOT_SKY },
    { value: "CLAIM_STATUS", label: "Claim Status", className: BADGE_VIOLET, dotClassName: DOT_VIOLET },
]

export const INVOICE_STATUS_OPTION = [
    { value: "draft", label: "Draft", className: BADGE_SLATE, dotClassName: DOT_SLATE },
    { value: "open", label: "Open", className: BADGE_AMBER, dotClassName: DOT_AMBER },
    { value: "paid", label: "Paid", className: BADGE_EMERALD, dotClassName: DOT_EMERALD },
    { value: "uncollectible", label: "Uncollectible", className: BADGE_RED, dotClassName: DOT_RED },
    { value: "void", label: "Void", className: BADGE_ZINC, dotClassName: DOT_ZINC },
]

export const PERIOD_STATUS_OPTION = [
    { value: "active", label: "Active", className: BADGE_EMERALD, dotClassName: DOT_EMERALD },
    { value: "closed", label: "Closed", className: BADGE_SLATE, dotClassName: DOT_SLATE },
]

export const CLOSED_REASON_OPTION = [
    { value: "renewal", label: "Renewal", className: BADGE_SKY, dotClassName: DOT_SKY },
    { value: "cancellation", label: "Cancellation", className: BADGE_RED, dotClassName: DOT_RED },
    { value: "plan_change", label: "Plan Change", className: BADGE_AMBER, dotClassName: DOT_AMBER },
]

export const INSURANCE_TYPE_OPTION = [
    { value: "HMO", label: "HMO" },
    { value: "PPO", label: "PPO" },
    { value: "EPO", label: "EPO" },
    { value: "POS", label: "POS" },
    { value: "Indemnity", label: "Indemnity" },
    { value: "Medicare", label: "Medicare" },
    { value: "Medicaid", label: "Medicaid" },
    { value: "COBRA", label: "COBRA" },
    { value: "Workers Compensation", label: "Workers Compensation" },
    { value: "Other", label: "Other" },
]

export const ETHNICITY_OPTIONS = [
    "Hispanic/Latino",
    "Non-Hispanic/Latino",
    "Native American",
    "Asian",
    "Black/African American",
    "Pacific Islander",
    "White",
    "Multiracial",
    "Other",
    "Prefer not to say",
]
