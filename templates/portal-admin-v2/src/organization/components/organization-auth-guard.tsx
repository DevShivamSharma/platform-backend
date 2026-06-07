/**
 * @fileoverview OrganizationAuthGuard - Organization-specific auth guard using the shared factory.
 *
 * @security Critical for route-level access control.
 * @module components/organization-auth-guard
 */

import { ORGANIZATION_ROUTES, ORGANIZATION_STORAGE_KEYS, ORGANIZATION_ROLES } from "@/constants"
import { createAuthGuard } from "@/components/auth-guard-factory"

const { AuthGuard: OrganizationAuthGuard, PublicGuard: OrganizationPublicGuard } = createAuthGuard({
    storageKeys: ORGANIZATION_STORAGE_KEYS,
    allowedRoles: ORGANIZATION_ROLES,
    routes: {
        login: ORGANIZATION_ROUTES.LOGIN,
        default: ORGANIZATION_ROUTES.DASHBOARD,
        forceReset: ORGANIZATION_ROUTES.FORCE_RESET,
    },
})

export { OrganizationAuthGuard, OrganizationPublicGuard }
