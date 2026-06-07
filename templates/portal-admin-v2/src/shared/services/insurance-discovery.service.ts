/**
 * @fileoverview Insurance Discovery Service
 *
 * Searches for patient insurance coverage using demographics.
 */

import { api } from "./api.service"
import type { InsuranceDiscoveryRequest, InsuranceDiscoveryResponse } from "@/models/insurance-discovery.model"

/**
 * Discover insurance coverage for a patient using demographics.
 *
 * @param payload - Search criteria (firstName, lastName, dateOfBirth, zip)
 * @returns Discovered coverages array
 */
export function discoverInsurance(payload: InsuranceDiscoveryRequest) {
    return api.post<InsuranceDiscoveryResponse>("/api/v1/insurance-discovery", payload)
}
