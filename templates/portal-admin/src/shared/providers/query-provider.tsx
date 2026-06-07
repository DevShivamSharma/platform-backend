/**
 * @fileoverview TanStack Query provider configuration.
 *
 * Wraps the application with a `QueryClientProvider` that uses sensible defaults
 * for a healthcare CRM: conservative stale times, single retry, and no automatic
 * background refetch (to avoid unnecessary API load on compliance-critical systems).
 *
 * @module providers/query-provider
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { ReactNode } from "react"

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
        mutations: {
            retry: 0,
        },
    },
})

export function QueryProvider({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    )
}

export { queryClient }
