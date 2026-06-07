import type {
    User,
    CreateUserRequest,
    UpdateUserRequest,
} from "@/models"

import {
    getUsers,
    deleteUser,
    updateUser,
    createUser,
    getUserById,
    getOrganizationUserConfig
} from "@/services/user.service"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

import type { UserFilters } from "@/models"

const useUsersBase = createEntityQuery<User, UserFilters, CreateUserRequest, UpdateUserRequest>({
    queryKey: queryKeys.users,
    services: {
        list: getUsers,
        create: createUser,
        update: updateUser,
        delete: deleteUser,
        getById: getUserById,
    },
    buildParams: (base, f) => ({
        ...base,
        status: f?.status,
        role: f?.role,
        organizationIds: f?.organizationName
            ? f.organizationName.split(",")
            : undefined,
        accountIds: f?.accountIds
            ? f.accountIds.split(",")
            : undefined,
        startDate: f?.startDate,
        endDate: f?.endDate,
    }),
    defaultSortBy: "",
    useDebounce: false,
})

export function useUsers(filters?: UserFilters) {
    const base = useUsersBase(filters)

    const organizationsUserConfig = async () => {
        const res = await getOrganizationUserConfig()
        return res.data
    }

    return {
        ...base,
        users: base.items,
        setUsers: base.setItems,
        deleteUser: base.remove,
        updateUser: base.update,
        createUser: base.create,
        fetchUserById: base.fetchById,
        organizationsUserConfig,
    }
}
