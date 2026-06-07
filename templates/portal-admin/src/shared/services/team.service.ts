/**
 * @fileoverview TeamMember Service
 *
 * Handles CRUD + status operations for organization teams.
 */

import type {
    TeamMember,
    TeamMemberListResponse,
    CreateTeamMemberRequest,
    UpdateTeamMemberRequest,
    TeamMemberQuery,
} from "@/models"

import { api } from "./api.service"
import { createCrudService } from "./crud-service-factory"

const BASE = "/api/v1/admins"

const crud = createCrudService<TeamMember, CreateTeamMemberRequest, UpdateTeamMemberRequest, TeamMemberListResponse>({
    basePath: BASE,
    updateMethod: "put",
})

export const createTeamMember = crud.create
export const getTeamMembers = crud.getList as (params: TeamMemberQuery) => ReturnType<typeof crud.getList>
export const getTeamMemberById = crud.getById
export const updateTeamMember = crud.update
export const deleteTeamMember = crud.remove

/**
 * Change team member status
 */
export function updateTeamMemberStatus(id: string, status: string) {
    return api.patch<void>(`${BASE}/status/${id}`, { status })
}
