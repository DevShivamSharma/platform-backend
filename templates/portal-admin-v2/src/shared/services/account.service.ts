import type {
    Account,
    AccountListResponse,
    CreateAccountRequest,
    UpdateAccountRequest,
    AccountQuery,
    AuthUser,
} from "@/models"

import { createCrudService } from "./crud-service-factory"
import { api } from "./api.service"

export interface AccountConfigItem {
    id: string
    name: string
    npi: string
    stcCodes: string[]
}

export interface AccountConfigResponse {
    success: boolean
    apiCode: number
    message: string
    accounts: AccountConfigItem[]
}

const BASE = "/api/v1/accounts"
const BASE_ACCOUNT = "/api/v1/account"
const NPI_ACCOUNT = "/api/v1/external-api"

const crud = createCrudService<Account, CreateAccountRequest, UpdateAccountRequest, AccountListResponse>({
    basePath: BASE,
})

export const createAccount = crud.create
export const getAccounts = crud.getList as (params: AccountQuery) => ReturnType<typeof crud.getList>
export const getAccountById = crud.getById
export const updateAccount = crud.update
export const deleteAccount = crud.remove




export function getAllAccount() {
    return api.get<AccountConfigResponse>(`${BASE}/config`);
}
// get by id account

export function getaccountById(id: string) {
    return api.get<AuthUser>(`${BASE_ACCOUNT}/users/${id}`);
}

export interface NpiLookupAddress {
    address_1?: string
    address_purpose?: string
    address_type?: string
    city?: string
    country_code?: string
    country_name?: string
    postal_code?: string
    state?: string
    telephone_number?: string
}

export interface NpiLookupResult {
    number: string
    enumeration_type?: string
    addresses?: NpiLookupAddress[]
    taxonomies?: Array<{
        code?: string
        desc?: string
        primary?: boolean
        state?: string | null
        license?: string | null
        taxonomy_group?: string
    }>
    basic?: {
        organization_name?: string
        status?: string
        enumeration_date?: string
        last_updated?: string
    }
}

export interface NpiLookupData {
    result_count: number
    results: NpiLookupResult[]
}

export function getNpiDetails(id: string) {
    return api.get<NpiLookupData>(`${NPI_ACCOUNT}/npi-lookup`, {
        params: {
            npi: id,
        },
        showLoader: false,
    })
}