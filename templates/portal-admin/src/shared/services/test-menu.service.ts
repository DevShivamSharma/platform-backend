/**
 * @fileoverview Test Menu Service
 *
 * Handles list operations for test menu items.
 */

import type { TestMenuItem, TestMenuListResponse, TestMenuQuery, UpsertTestMenuItemRequest } from "@/models"
import { createCrudService } from "./crud-service-factory"

// Common convention used by similar admin modules
const BASE = "/api/v1/tests"

const crud = createCrudService<TestMenuItem, UpsertTestMenuItemRequest, Partial<UpsertTestMenuItemRequest>, TestMenuListResponse>({
    basePath: BASE,
})

export const getTestMenu = crud.getList as (params: TestMenuQuery) => ReturnType<typeof crud.getList>
export const getTestMenuItemById = crud.getById
export const createTestMenuItem = crud.create
export const updateTestMenuItem = crud.update
export const deleteTestMenuItem = crud.remove

