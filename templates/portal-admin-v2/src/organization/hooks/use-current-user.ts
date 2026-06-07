import { createCurrentUserHook } from "@/hooks/use-current-user"
import { getOrganizationCurrentUser } from "@organization/services/organization-auth.service"

export const useCurrentUser = createCurrentUserHook(getOrganizationCurrentUser)
