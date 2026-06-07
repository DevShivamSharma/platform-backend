import type {
    Account,
    CreateAccountRequest,
    UpdateAccountRequest,
} from "@/models"

import {
    getAccounts,
    deleteAccount,
    updateAccount,
    createAccount,
    getAccountById,
} from "@/services/account.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

import type { AccountFilters } from "@/models"
import { getOrganizationUserConfig } from "@/services"

const useAccountsBase = createEntityQuery<Account, AccountFilters, CreateAccountRequest, UpdateAccountRequest>({
    queryKey: queryKeys.accounts,
    services: {
        list: getAccounts,
        create: createAccount,
        update: updateAccount,
        delete: deleteAccount,
        getById: getAccountById,
    },
    buildParams: (base, f) => ({
        ...base,
        status: f?.status,
        organizationId: f?.organizationId,
        city: f?.city,
        state: f?.state,
        stcCodes: f?.stcCodes,
        startDate: f?.startDate,
        endDate: f?.endDate,
    }),
    defaultSortBy: "",
    useDebounce: false,
})

export function useAccounts(filters?: AccountFilters) {
    const base = useAccountsBase(filters)
    const organizationsUserConfig = async () => {
        const res = await getOrganizationUserConfig()
        return res.data
    }
    return {
        ...base,
        accounts: base.items,
        setAccounts: base.setItems,
        deleteAccount: base.remove,
        updateAccount: base.update,
        createAccount: base.create,
        fetchAccountById: base.fetchById,
        organizationsUserConfig
    }
}
