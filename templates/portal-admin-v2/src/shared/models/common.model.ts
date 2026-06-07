/**
 * @fileoverview Common Model - Shared base types used across all entities.
 *
 * This module contains foundational types that other models extend or reference,
 * including base entity shape, status types, navigation, sorting, and component props.
 *
 * @module models/common
 */

import type React from "react"

// ============================================================
// BASE ENTITY
// ============================================================

/**
 * Base shape shared by all persistable entities.
 * Every entity in the system should extend this interface.
 */
export interface BaseEntity {
    /** Unique identifier */
    id: string
    /** ISO timestamp of creation */
    createdAt?: string
    /** ISO timestamp of last update */
    updatedAt?: string
}

export type CreateDTO<T extends BaseEntity> = Omit<T, keyof BaseEntity>

// ============================================================
// FILTER TYPES
// ============================================================

/**
 * Option shape used by filter dropdowns across the app.
 */
export interface FilterOption {
    label: string
    value: string
}

// ============================================================
// STATUS TYPES
// ============================================================

/**
 * Common status values shared across multiple entities.
 */
export type EntityStatus = "active" | "inactive"

/**
 * Display configuration for rendering a status badge.
 */
export interface StatusDisplayConfig {
    /** Human-readable label */
    label: string
    /** Tailwind CSS class string for styling */
    className: string
}

// ============================================================
// NAVIGATION TYPES
// ============================================================

/**
 * Represents a navigation item in the sidebar.
 */
export interface NavItem {
    /** Display title */
    title: string
    /** URL path */
    url: string
    /** Optional icon component */
    icon?: React.ComponentType<{ className?: string }>
    /** Whether the item is currently active */
    isActive?: boolean
    /** Nested navigation items */
    items?: NavItem[]
}

// ============================================================
// TABLE / SORTING TYPES
// ============================================================

/**
 * Sort direction for table columns.
 */
export type SortOrder = "asc" | "desc" | null

/**
 * Configuration for sortable table state.
 */
export interface SortConfig<T = string> {
    /** Column key being sorted, or null if unsorted */
    key: T | null
    /** Sort direction */
    order: SortOrder
}

// ============================================================
// MODAL PROP TYPES
// ============================================================

/**
 * Base props shared by all modal components.
 *
 * @template T - The entity type returned on successful submission.
 *               Defaults to `unknown` for modals that don't pass data back.
 */
export interface BaseModalProps<T = unknown> {
    /** Whether the modal is visible */
    isOpen: boolean
    /** Callback to close the modal */
    onClose: () => void
    /** Optional callback on successful submission */
    onSuccess?: (data?: T) => void
}

// ============================================================
// COMPONENT PROP TYPES
// ============================================================

/**
 * Base props that all components should extend.
 */
export interface BaseComponentProps {
    /** Additional CSS classes */
    className?: string
    /** Test identifier for e2e testing */
    testId?: string
}
