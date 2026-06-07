import type {
    TeamMember,
    CreateTeamMemberRequest,
    UpdateTeamMemberRequest,
} from "@/models"

import {
    getTeamMembers,
    deleteTeamMember,
    updateTeamMember,
    createTeamMember,
    getTeamMemberById,
} from "@/services"

import { createEntityQuery } from "./use-entity-query"
import { queryKeys } from "@/lib/query-keys"

export interface TeamFilters {
    enabled?: boolean
    status?: string
    role?: string
    startDate?: string
    endDate?: string
}

const useTeamsBase = createEntityQuery<TeamMember, TeamFilters, CreateTeamMemberRequest, UpdateTeamMemberRequest>({
    queryKey: queryKeys.teams,
    services: {
        list: getTeamMembers,
        create: createTeamMember,
        update: updateTeamMember,
        delete: deleteTeamMember,
        getById: getTeamMemberById,
    },
    buildParams: (base, f) => ({
        ...base,
        status: f?.status,
        role: f?.role,
        startDate: f?.startDate,
        endDate: f?.endDate,
    }),
    defaultSortBy: "",
    useDebounce: false,
})

export function useTeams(filters?: TeamFilters) {
    const base = useTeamsBase(filters)
    return {
        ...base,
        teams: base.items,
        setTeams: base.setItems,
        deleteTeamMember: base.remove,
        updateTeamMember: base.update,
        createTeamMember: base.create,
        fetchTeamMemberById: base.fetchById,
    }
}
