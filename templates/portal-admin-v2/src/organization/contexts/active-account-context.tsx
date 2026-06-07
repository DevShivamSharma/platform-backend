import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { getAllAccount, type AccountConfigItem } from "@/services/account.service"
import { secureStorage } from "@/lib/security"
import { ORGANIZATION_STORAGE_KEYS } from "@/constants"

interface ActiveAccountContextType {
    /** Currently selected account, or null if "All Accounts" */
    activeAccount: AccountConfigItem | null
    /** ID of the active account, or "" for all */
    activeAccountId: string
    /** All available accounts for this organization */
    accounts: AccountConfigItem[]
    /** Whether accounts are still loading */
    loading: boolean
    /** Set the active account by ID. Empty string = "All Accounts" */
    setActiveAccountId: (id: string) => void
    /** Single account ID string for API filters, or undefined for "all" */
    accountIdsFilter: string | undefined
}

const ActiveAccountContext = createContext<ActiveAccountContextType | undefined>(undefined)

export function useActiveAccount() {
    const context = useContext(ActiveAccountContext)
    if (!context) {
        throw new Error("useActiveAccount must be used within an ActiveAccountProvider")
    }
    return context
}

export function ActiveAccountProvider({ children }: { children: React.ReactNode }) {
    const [accounts, setAccounts] = useState<AccountConfigItem[]>([])
    const [activeAccountId, setActiveAccountIdState] = useState("")
    const [loading, setLoading] = useState(true)

    // Fetch accounts and restore persisted selection
    useEffect(() => {
        let cancelled = false

        ;(async () => {
            try {
                const [res, storedId] = await Promise.all([
                    getAllAccount(),
                    secureStorage.get(ORGANIZATION_STORAGE_KEYS.ACTIVE_ACCOUNT),
                ])

                if (cancelled) return

                const list = res.data?.accounts ?? []
                setAccounts(list)

                if (list.length === 1) {
                    // Auto-select the only account
                    setActiveAccountIdState(list[0].id)
                    await secureStorage.set(ORGANIZATION_STORAGE_KEYS.ACTIVE_ACCOUNT, list[0].id)
                } else if (storedId && list.some(a => a.id === storedId)) {
                    // Restore persisted selection
                    setActiveAccountIdState(storedId)
                } else {
                    // Default to "All Accounts" — clear stale storage
                    setActiveAccountIdState("")
                    if (storedId) {
                        await secureStorage.remove(ORGANIZATION_STORAGE_KEYS.ACTIVE_ACCOUNT)
                    }
                }
            } catch {
                // If fetch fails, leave with empty accounts and no filter
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => { cancelled = true }
    }, [])

    const setActiveAccountId = useCallback(async (id: string) => {
        setActiveAccountIdState(id)
        if (id) {
            await secureStorage.set(ORGANIZATION_STORAGE_KEYS.ACTIVE_ACCOUNT, id)
        } else {
            await secureStorage.remove(ORGANIZATION_STORAGE_KEYS.ACTIVE_ACCOUNT)
        }
    }, [])

    const activeAccount = useMemo(
        () => accounts.find(a => a.id === activeAccountId) ?? null,
        [accounts, activeAccountId],
    )

    const accountIdsFilter = useMemo(
        () => activeAccountId || undefined,
        [activeAccountId],
    )

    const value = useMemo<ActiveAccountContextType>(() => ({
        activeAccount,
        activeAccountId,
        accounts,
        loading,
        setActiveAccountId,
        accountIdsFilter,
    }), [activeAccount, activeAccountId, accounts, loading, setActiveAccountId, accountIdsFilter])

    return (
        <ActiveAccountContext.Provider value={value}>
            {children}
        </ActiveAccountContext.Provider>
    )
}
