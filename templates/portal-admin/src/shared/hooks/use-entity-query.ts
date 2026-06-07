/**
 * @fileoverview TanStack Query Entity Hook Factory
 *
 * Drop-in replacement for `createEntityHook` that uses TanStack Query
 * for server state management. Provides the same return interface
 * (`EntityHookReturn`) so consumers don't need to change.
 *
 * Benefits over the custom `useListState` approach:
 * - Stale-while-revalidate: shows cached data while refetching
 * - Automatic cache invalidation via query keys
 * - Background refetch and window focus support (opt-in)
 * - React Query Devtools for debugging cache state
 * - Optimistic update patterns for mutations
 *
 * @module hooks/use-entity-query
 *
 * @example
 * ```ts
 * const useTeamsBase = createEntityQuery<TeamMember, TeamFilters, CreateReq, UpdateReq>({
 *   queryKey: queryKeys.teams,
 *   services: { list: getTeamMembers, create: createTeamMember, ... },
 *   buildParams: (base, f) => ({ ...base, status: f?.status }),
 * })
 *
 * export function useTeams(filters?: TeamFilters) {
 *   const base = useTeamsBase(filters)
 *   return { teams: base.items, ...base }
 * }
 * ```
 */

import { useState, useCallback, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useDebouncedValue } from "./use-debounced-value"
import { DEBOUNCE_MS } from "@/constants"
import type { ApiResponse } from "@/models/api/api.model"
import type { PaginatedResponse } from "@/models/pagination.model"

// ============================================================
// TYPES
// ============================================================

export interface ListBaseParams {
    page: number
    limit: number
    search: string
    sortBy: string
    sortOrder: "ASC" | "DESC"
}

/**
 * Service functions for a standard CRUD entity.
 * Only `list` is required; CRUD operations are optional.
 */
export interface EntityServices<
    T,
    CreatePayload = never,
    UpdatePayload = never,
> {
    /** Paginated list endpoint — required */
    list: (params: Record<string, string | number | boolean | string[] | undefined>) => Promise<ApiResponse<PaginatedResponse<T>>>
    /** Create entity endpoint */
    create?: (payload: CreatePayload) => Promise<ApiResponse<T>>
    /** Update entity endpoint */
    update?: (id: string, payload: UpdatePayload) => Promise<ApiResponse<T>>
    /** Delete entity endpoint */
    delete?: (id: string) => Promise<ApiResponse<void>>
    /** Get single entity by ID */
    getById?: (id: string) => Promise<ApiResponse<T>>
}

/**
 * Standardized return type from hooks produced by the factory.
 * Provides list state with typed CRUD operations.
 */
export interface EntityHookReturn<T, CreatePayload, UpdatePayload> {
    items: T[]
    setItems: React.Dispatch<React.SetStateAction<T[]>>
    loading: boolean
    error: string | null
    total: number
    page: number
    limit: number
    search: string
    setPage: (page: number) => void
    setLimit: (limit: number) => void
    setSearch: (search: string) => void
    /** Active sort column id (or API sort key); empty when unsorted / default. */
    sortBy: string
    setSortBy: (sortBy: string) => void
    sortOrder: "ASC" | "DESC"
    setSortOrder: (sortOrder: "ASC" | "DESC") => void
    refetch: () => Promise<void>
    /** Whether a background refetch is in progress (TanStack Query only) */
    fetching?: boolean
    /** Create entity — returns the full API response so `useFormSubmit` can unwrap it */
    create: (payload: CreatePayload) => Promise<ApiResponse<T>>
    /** Update entity — returns the full API response */
    update: (id: string, payload: UpdatePayload) => Promise<ApiResponse<T>>
    /** Delete entity — returns the full API response */
    remove: (id: string) => Promise<ApiResponse<void>>
    /** Fetch single entity by ID — unwraps `ApiResponse.data` for direct use */
    fetchById: (id: string) => Promise<T>
}

interface EntityQueryKeys {
    all: readonly string[]
    lists: () => readonly string[]
    list: (filters?: Record<string, unknown> | undefined) => readonly unknown[]
    details: () => readonly string[]
    detail: (id: string) => readonly unknown[]
}

export interface CreateEntityQueryConfig<
    T,
    F extends object,
    CreatePayload,
    UpdatePayload,
> {
    /** Query key factory from `@/lib/query-keys` */
    queryKey: EntityQueryKeys
    /** Service functions for CRUD */
    services: EntityServices<T, CreatePayload, UpdatePayload>
    /** Builds request params from base pagination + filters */
    buildParams: (
        base: ListBaseParams,
        filters?: F,
    ) => Record<string, string | number | boolean | string[] | undefined>
    /** Default column to sort by */
    defaultSortBy?: string
    /** Whether to debounce search (default: true) */
    useDebounce?: boolean
}

// ============================================================
// FACTORY
// ============================================================

export function createEntityQuery<
    T,
    F extends object = object,
    CreatePayload = never,
    UpdatePayload = never,
>(config: CreateEntityQueryConfig<T, F, CreatePayload, UpdatePayload>) {
    return function useEntityQuery(
        filters?: F & { enabled?: boolean },
    ): EntityHookReturn<T, CreatePayload, UpdatePayload> {
        const queryClient = useQueryClient()
        const enabled = filters?.enabled ?? true
        const shouldDebounce = config.useDebounce ?? true

        // ── Pagination & Search State ────────────────────────────
        const [page, setPage] = useState(1)
        const [limit, setLimit] = useState(10)
        const [search, setSearch] = useState("")
        const [sortBy, setSortBy] = useState(config.defaultSortBy ?? "")
        const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")

        const debouncedSearch = useDebouncedValue(search, DEBOUNCE_MS)
        const effectiveSearch = shouldDebounce ? debouncedSearch : search

        // ── Query ────────────────────────────────────────────────
        const base: ListBaseParams = {
            page,
            limit,
            search: effectiveSearch,
            sortBy,
            sortOrder,
        }
        const params = config.buildParams(base, filters)

        const { data, isLoading, isFetching, error, refetch } = useQuery({
            queryKey: config.queryKey.list({ ...params, ...filters }),
            queryFn: () => config.services.list(params),
            enabled,
        })

        const items = useMemo(() => data?.data?.items ?? [], [data])
        const total = data?.data?.total ?? 0

        // Keep a local setItems for backward compatibility
        const [localItems, setLocalItems] = useState<T[] | null>(null)
        const effectiveItems = localItems ?? items

        const setItems: React.Dispatch<React.SetStateAction<T[]>> = useCallback(
            (updater) => {
                setLocalItems((prev) => {
                    const current = prev ?? items
                    return typeof updater === "function"
                        ? (updater as (prev: T[]) => T[])(current)
                        : updater
                })
            },
            [items],
        )

        // Reset local items when query data changes
        // (localItems is an overlay for optimistic updates)
        const resetLocalItems = useCallback(() => setLocalItems(null), [])

        const handleRefetch = useCallback(async () => {
            resetLocalItems()
            await refetch()
        }, [refetch, resetLocalItems])

        // ── Mutations ────────────────────────────────────────────
        const createMutation = useMutation({
            mutationFn: (payload: CreatePayload) => {
                if (!config.services.create) {
                    return Promise.reject(new Error("Create not configured"))
                }
                return config.services.create(payload)
            },
            onSuccess: () => {
                resetLocalItems()
                queryClient.invalidateQueries({ queryKey: config.queryKey.all })
            },
        })

        const updateMutation = useMutation({
            mutationFn: ({ id, payload }: { id: string; payload: UpdatePayload }) => {
                if (!config.services.update) {
                    return Promise.reject(new Error("Update not configured"))
                }
                return config.services.update(id, payload)
            },
            onSuccess: () => {
                resetLocalItems()
                queryClient.invalidateQueries({ queryKey: config.queryKey.all })
            },
        })

        const deleteMutation = useMutation({
            mutationFn: (id: string) => {
                if (!config.services.delete) {
                    return Promise.reject(new Error("Delete not configured"))
                }
                return config.services.delete(id)
            },
            onSuccess: () => {
                resetLocalItems()
                queryClient.invalidateQueries({ queryKey: config.queryKey.all })
            },
        })

        // ── Backward-Compatible Wrappers ─────────────────────────
        const create = useCallback(
            (payload: CreatePayload) => createMutation.mutateAsync(payload),
            [createMutation],
        )

        const update = useCallback(
            (id: string, payload: UpdatePayload) =>
                updateMutation.mutateAsync({ id, payload }),
            [updateMutation],
        )

        const remove = useCallback(
            (id: string) => deleteMutation.mutateAsync(id),
            [deleteMutation],
        )

        const fetchById = useCallback(
            async (id: string): Promise<T> => {
                if (!config.services.getById) {
                    throw new Error("GetById not configured")
                }
                const response = await config.services.getById(id)
                return response.data
            },
            [],
        )

        return {
            items: effectiveItems,
            setItems,
            loading: isLoading,
            fetching: isFetching,
            error: error?.message ?? null,
            total,
            page,
            limit,
            search,
            setPage,
            setLimit,
            setSearch,
            sortBy,
            setSortBy,
            sortOrder,
            setSortOrder,
            refetch: handleRefetch,
            create,
            update,
            remove,
            fetchById,
        }
    }
}
