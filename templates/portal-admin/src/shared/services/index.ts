/**
 * @fileoverview Services barrel export.
 * Re-exports all service functions for clean imports.
 *
 * @example
 * import { getUsers, createUser, api } from "@/services"
 */

export * from "./user.service"
export * from "./team.service"
export * from "./api.service"
export { createCrudService } from "./crud-service-factory"
export * from "./organization.service"
export * from "./account.service"
export * from "./payer.service"
export * from "./fee-schedule.service"
export * from "./medication.service"
export * from "./icd-10.service"
export * from "./test-menu.service"
export * from "./feature.service"
export * from "./plan.service"
