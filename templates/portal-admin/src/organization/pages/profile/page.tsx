import { lazy, Suspense, useEffect, useState } from "react"
import { ModalErrorBoundary } from "@/components/error-boundary"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { organizationRoleConfig as roleConfig } from "@/constants/badge-configs"
import { Camera, User, Mail, Shield, Lock, Pencil, KeyRound, ShieldAlert, Building2, LifeBuoy } from "lucide-react"
import { useCurrentUser } from "@organization/hooks/use-current-user"
import type { AuthUser } from "@/models/api/auth.model"
import { Toggle } from "@/components/ui/toggle"
import { secureStorage } from "@/lib/security"
import { ORGANIZATION_STORAGE_KEYS } from "@/constants"
import { getCustomerById } from "@/services"
import { getPortalDisplayName, legacyRoutesEnabled, portalConfig } from "@/lib/portal-config"

const EditProfileModal = lazy(() =>
  import("./_components/edit-profile-modal").then(m => ({ default: m.EditProfileModal }))
)

const ChangePasswordModal = lazy(() =>
  import("./_components/change-password-modal").then(m => ({ default: m.ChangePasswordModal }))
)

const TwoFactorModal = lazy(() =>
  import("./_components/two-factor-modal").then(m => ({ default: m.TwoFactorModal }))
)

export default function OrganizationProfilePage() {
  const { user: currentUser } = useCurrentUser()
  const userId = currentUser?.id ?? ""

  const [user, setUser] = useState<AuthUser | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false)
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false)
  const isGeneratedPortal = !legacyRoutesEnabled()

  const loadStoredProfile = async () => {
    const profileJson = await secureStorage.get(ORGANIZATION_STORAGE_KEYS.USER_PROFILE)
    const storedUser: AuthUser | null = profileJson ? JSON.parse(profileJson) : null
    const nextUser = storedUser || currentUser || null
    setUser(nextUser)
    setIsTwoFactorEnabled(!!nextUser?.isTwoFactorAuthenticationEnabled)
  }

  const getCustomerDataById = async (id: string) => {
    if (isGeneratedPortal) {
      await loadStoredProfile()
      return
    }
    const response = await getCustomerById(id)
    setUser(response?.data)
    setIsTwoFactorEnabled(!!response?.data?.isTwoFactorAuthenticationEnabled)
    await secureStorage.set(
      ORGANIZATION_STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(response?.data)
    )
  }

  useEffect(() => {
    if (userId) {
      getCustomerDataById(userId)
    } else {
      void loadStoredProfile()
    }
  }, [userId, currentUser?.email])

  async function handleProfilePhoto(file?: File) {
    if (!file || !user) return
    if (file.size > 750 * 1024) {
      window.alert("Profile photo must be under 750 KB.")
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const updated = {
        ...user,
        profilePhotoUrl: String(reader.result || ""),
      }
      setUser(updated)
      await secureStorage.set(ORGANIZATION_STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated))
    }
    reader.readAsDataURL(file)
  }

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : ""
  const displayName = getPortalDisplayName()
  const profilePhotoUrl = user?.profilePhotoUrl

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings.
          </p>
        </div>
      </header>

      {!user ? (
        /* ---------------- LOADING UI ---------------- */
        <div className="flex-1 min-h-0 px-6 lg:px-8 pb-6 space-y-6 animate-shimmer">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-muted rounded"></div>
                  <div className="h-3 w-64 bg-muted rounded"></div>
                </div>
                <div className="h-8 w-28 bg-muted rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-muted"></div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-24 bg-muted rounded"></div>
                      <div className="h-4 w-32 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-muted rounded"></div>
                  <div className="h-3 w-64 bg-muted rounded"></div>
                </div>
                <div className="h-8 w-36 bg-muted rounded"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-muted rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-3 w-32 bg-muted rounded"></div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-40 bg-muted rounded"></div>
                    <div className="h-3 w-24 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-10 bg-muted rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ---------------- REAL UI ---------------- */
        <div className="flex-1 min-h-0 px-6 lg:px-8 pb-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription>Your basic account details.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 overflow-hidden rounded-full bg-brand flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt={`${user.firstName} ${user.lastName}`} className="h-full w-full object-cover" />
                    ) : (
                      initials || <User className="h-7 w-7" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-brand shadow-sm hover:bg-muted">
                    <Camera className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => handleProfilePhoto(event.target.files?.[0])}
                    />
                  </label>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">First Name</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{user.firstName}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Last Name</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{user.lastName}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Email Address</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Role</p>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <StatusBadge status={user.role} config={roleConfig} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Settings</CardTitle>
              <CardDescription>Portal and support details for this account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Portal</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{displayName}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Support</p>
                  <div className="flex items-center gap-2">
                    <LifeBuoy className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {portalConfig.company?.supportEmail || "Configured by admin"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Security</CardTitle>
                  <CardDescription>
                    Manage your password and security settings.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsPasswordOpen(true)}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Change Password
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">••••••••••••</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Two Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">
                      {isTwoFactorEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
                <Toggle
                  className="cursor-pointer"
                  checked={isTwoFactorEnabled}
                  onCheckedChange={() => setIsTwoFactorModalOpen(true)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ---------------- MODALS ---------------- */}
      {isEditOpen && user && (
        <ModalErrorBoundary onClose={() => setIsEditOpen(false)}>
          <Suspense fallback={null}>
            <EditProfileModal
              isOpen
              onClose={() => setIsEditOpen(false)}
              onSuccess={() => getCustomerDataById(userId)}
              user={user}
            />
          </Suspense>
        </ModalErrorBoundary>
      )}
      {isPasswordOpen && user && (
        <ModalErrorBoundary onClose={() => setIsPasswordOpen(false)}>
          <Suspense fallback={null}>
            <ChangePasswordModal
              isOpen
              onClose={() => setIsPasswordOpen(false)}
              userId={user.id}
            />
          </Suspense>
        </ModalErrorBoundary>
      )}
      {isTwoFactorModalOpen && user && (
        <ModalErrorBoundary onClose={() => setIsTwoFactorModalOpen(false)}>
          <Suspense fallback={null}>
            <TwoFactorModal
              isOpen
              userId={user.id}
              isEnabled={isTwoFactorEnabled}
              onClose={() => setIsTwoFactorModalOpen(false)}
              onSuccess={(val) => {
                setIsTwoFactorEnabled(val)
                setIsTwoFactorModalOpen(false)
              }}
            />
          </Suspense>
        </ModalErrorBoundary>
      )}
    </div>
  )
}
