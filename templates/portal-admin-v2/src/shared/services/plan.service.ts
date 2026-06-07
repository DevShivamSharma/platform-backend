/**
 * @fileoverview Plan Service
 *
 * CRUD operations for subscription plans via the billing admin API,
 * plus a customer-facing endpoint for available (active) plans.
 */

import type { Plan, CreatePlanRequest, UpdatePlanRequest } from "@/models"
import type { PaginatedResponse } from "@/models/pagination.model"
import { api } from "./api.service"
import { createCrudService } from "./crud-service-factory"

// ── Admin CRUD ───────────────────────────────────────────────

const crud = createCrudService<Plan, CreatePlanRequest, UpdatePlanRequest, PaginatedResponse<Plan>>({
    basePath: "/api/v1/billing/plans",
})

export const createPlan = crud.create
export const getPlans = crud.getList
export const getPlanById = crud.getById
export const updatePlan = crud.update
export const deletePlan = crud.remove

// ── Customer-facing ──────────────────────────────────────────

/**
 * Fetches available (active) plans for customer plan selection.
 * Returns a paginated response; consumers should extract `.data.items`.
 * Restricted to PRIMARY_USER role on the backend.
 */
export function getAvailablePlans() {
    return api.get<PaginatedResponse<Plan>>("/api/v1/billing/plans/available")
}
