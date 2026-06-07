import type { PaginatedResponse } from "@/models/pagination.model"

export type AccountStatus = "Active" | "Inactive"

export interface Account {
    id: string
    npi: string
    name: string
    address: string
    city: string
    state: string
    zip: string
    organizationId: string
    organization?: { name: string }
    taxId: string
    stcCodes: string[]
    status: AccountStatus
    createdAt: string
    updatedAt: string
    isPrimary: boolean
}

export interface CreateAccountRequest {
    npi: string
    name: string
    address: string
    city: string
    state: string
    zip: string
    organizationId: string
    taxId: string
    stcCodes: string[]
}

export interface UpdateAccountRequest extends Partial<CreateAccountRequest> {
    status?: AccountStatus
}

export type AccountListResponse = PaginatedResponse<Account>

export type AccountQuery = {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: "ASC" | "DESC"
    status?: string
    city?: string
    state?: string
    organizationId?: string
    stcCodes?: string
    startDate?: string
    isPrimary?: string
    endDate?: string
}

export interface AccountFilters {
    enabled?: boolean
    status?: string
    city?: string
    state?: string
    stcCodes?: string
    organizationId?: string
    startDate?: string
    endDate?: string
}
