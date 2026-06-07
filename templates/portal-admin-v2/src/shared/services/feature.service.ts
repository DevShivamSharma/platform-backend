/**
 * @fileoverview Feature Service
 *
 * CRUD operations for subscription features via the billing admin API.
 */

import type { Feature, CreateFeatureRequest, UpdateFeatureRequest } from "@/models"
import type { PaginatedResponse } from "@/models/pagination.model"
import { createCrudService } from "./crud-service-factory"

const crud = createCrudService<Feature, CreateFeatureRequest, UpdateFeatureRequest, PaginatedResponse<Feature>>({
    basePath: "/api/v1/billing/features",
})

export const createFeature = crud.create
export const getFeatures = crud.getList
export const getFeatureById = crud.getById
export const updateFeature = crud.update
export const deleteFeature = crud.remove
