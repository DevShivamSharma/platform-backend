/**
 * @fileoverview Fee Schedule Service
 *
 * Handles CRUD operations for fee schedule entries.
 */

import type {
    FeeScheduleEntry,
    FeeScheduleEntryListResponse,
    CreateFeeScheduleEntryRequest,
    UpdateFeeScheduleEntryRequest,
    FeeScheduleEntryQuery,
} from "@/models"

import { createCrudService } from "./crud-service-factory"

const BASE = "/api/v1/fee-schedules"

const crud = createCrudService<
    FeeScheduleEntry,
    CreateFeeScheduleEntryRequest,
    UpdateFeeScheduleEntryRequest,
    FeeScheduleEntryListResponse
>({
    basePath: BASE,
})

export const createFeeScheduleEntry = crud.create
export const getFeeScheduleEntries = crud.getList as (params: FeeScheduleEntryQuery) => ReturnType<typeof crud.getList>
export const getFeeScheduleEntryById = crud.getById
export const updateFeeScheduleEntry = crud.update
export const deleteFeeScheduleEntry = crud.remove

