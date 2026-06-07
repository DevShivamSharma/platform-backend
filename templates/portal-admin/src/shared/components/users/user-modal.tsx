import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { logger } from "@/lib/logger"
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Building2,
    Building,
} from "lucide-react"
import { PhoneInput, formatPhone } from "@/components/ui/phone-input"
import { Select } from "@/components/ui/select"
import { FieldLabel } from "@/components/ui/field-label"
import { FieldError } from "@/components/ui/field-error"
import type { BaseModalProps, User as UserModel } from "@/models"
import { STATUS_OPTION, SECURITY } from "@/constants"
import { useEntityFormModal, useUsers } from "@/hooks"
import { createUserSchema } from "@/models/schemas"
import { FormModal } from "@/components/ui/form-modal"
import { getOrganizations } from "@/services/organization.service"
import { getAllAccount } from "@/services"

// ── Types ──────────────────────────────────────────────────────

export interface UserData {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    organization?: { name: string; id: string }
    role: string
}

interface UserModalProps extends BaseModalProps {
    user?: UserData | null
    variant?: "admin" | "customer"
    /** Organization ID for customer variant. Resolved by the caller. */
    organizationId?: string
}

interface UserFormData {
    firstName: string
    lastName: string
    email: string
    phoneCode?: string
    accountIds?: string
    phoneNumber: string
    organizationId?: string
    role: string
    password?: string
    status?: string
}

const initialFormData: UserFormData = {
    firstName: "",
    lastName: "",
    email: "",
    phoneCode: "+1",
    phoneNumber: "",
    organizationId: "",
    accountIds: "",
    role: "Organization User",
    password: "",
    status: "",
}

// ── Main modal ─────────────────────────────────────────────────

export function UserModal({ isOpen, onClose, onSuccess, user, variant = "admin", organizationId: propOrgId }: UserModalProps) {
    const isAdmin = variant === "admin"
    const { createUser, updateUser, fetchUserById } = useUsers({ enabled: false })
    const [showPassword, setShowPassword] = useState(false)
    const [organizationOptions, setOrganizationOptions] = useState<{ label: string; value: string }[]>([])
    const [assignAccountOptions, setAssignAccountOptions] = useState<{ label: string; value: string }[]>([])




    const {
        form,
        update,
        errors,
        isEdit,
        loading,
        formRef,
        isSubmitting,
        submitError,
        setSubmitError,
        handleSubmit,
    } = useEntityFormModal<UserFormData, UserModel>({
        initialData: initialFormData,
        isOpen,
        entityId: user?.id,
        fetchById: fetchUserById,
        transformToForm: (u) => ({
            firstName: u.firstName,
            lastName: u.lastName,
            accountIds: Array.isArray(u.accounts) && u.accounts.length > 0
                ? u.accounts.map(a => a.id).join(",")
                : Array.isArray(u.accountIds) ? u.accountIds.join(",") : "",
            email: u.email,
            phoneCode: u.countryCode || "+1",
            phoneNumber: formatPhone(u.phoneNumber || ""),
            organizationId: u.organizationId || "",
            role: u.role || "Organization User",
            password: "",
            status: u.status ?? "Active",
        }),
        onSuccess,
        onClose,
        entityLabel: "User",
        schema: createUserSchema,
    })

    // Fetch account options for organization create mode
    useEffect(() => {
        if (!isOpen) return;
        (async () => {
            try {
                const res = await getAllAccount()
                setAssignAccountOptions(res?.data?.accounts?.map((acc: { name: string; id: string }) => ({
                    label: acc?.name,
                    value: acc?.id,
                })))
            } catch (err: unknown) {
                logger.error("Failed to fetch accounts", err)
            }
        })()

    }, [isOpen])

    // Fetch organization options for admin create mode
    useEffect(() => {
        if (!isOpen || isEdit || !isAdmin) return
            ; (async () => {
                try {
                    const res = await getOrganizations({ limit: 1000 })
                    setOrganizationOptions(res.data.items.map((org: { name: string; id: string }) => ({
                        label: org.name,
                        value: org.id,
                    })))
                } catch (err: unknown) {
                    logger.error("Failed to fetch organizations", err)
                    setSubmitError("Failed to load organizations. Please close and try again.")
                }
            })()
    }, [isOpen, isEdit, isAdmin, setSubmitError])

    // Reset password visibility on modal open
    useEffect(() => {
        if (isOpen) setShowPassword(false)
    }, [isOpen])

    const canSubmit = isEdit
        ? (
            form.firstName.trim() &&
            form.lastName.trim() &&
            form.phoneNumber.trim()
        )
        : (
            form.firstName.trim() &&
            form.lastName.trim() &&
            form.email.trim() &&
            form.phoneNumber.trim() &&
            (isAdmin ? form.organizationId : true) &&
            form.role
        )
    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Edit User" : "Add User"}
            subtitle={isEdit ? "Update user details" : isAdmin ? "Add a new user" : "Add a new user to your organization"}
            icon={User}
            loading={loading}
            isSubmitting={isSubmitting}
            canSubmit={!!canSubmit}
            submitError={submitError}
            submitLabel={isEdit ? "Save Changes" : "Add User"}
            submittingLabel={isEdit ? "Saving..." : "Adding..."}
            onSubmit={async () => {
                if (isEdit && user?.id) {
                    const payload = {
                        firstName: form.firstName,
                        lastName: form.lastName,
                        countryCode: form.phoneCode ?? "+1",
                        phoneNumber: form.phoneNumber.replace(/\D/g, ""),
                        accountIds: form.accountIds ? form.accountIds.split(",").filter(Boolean) : [],
                        status: form.status as "Active" | "Inactive",
                    }
                    handleSubmit(async () => {
                        await updateUser(user.id, payload)
                        return { ...user, ...payload }
                    }, form)
                } else {
                    const payload = {
                        firstName: form.firstName,
                        lastName: form.lastName,
                        email: form.email,
                        accountIds: form.accountIds ? form.accountIds.split(",").filter(Boolean) : [],
                        countryCode: form.phoneCode ?? "+1",
                        phoneNumber: form.phoneNumber.replace(/\D/g, ""),
                        organizationId: isAdmin ? (form.organizationId ?? "") : (propOrgId || ""),
                        role: form.role,
                        ...(isAdmin && { password: form.password })
                    }
                    handleSubmit(() => createUser(payload), form)
                }
            }}
        >
            <div ref={formRef as React.RefObject<HTMLDivElement | null>} className="space-y-5">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <FieldLabel required>First Name</FieldLabel>
                        <Input
                            placeholder="John"
                            value={form.firstName}
                            onChange={(e) => update("firstName", e.target.value)}
                            className={errors.firstName ? "border-destructive" : ""}
                            required
                        />
                        <FieldError message={errors.firstName} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel required>Last Name</FieldLabel>
                        <Input
                            placeholder="Doe"
                            value={form.lastName}
                            onChange={(e) => update("lastName", e.target.value)}
                            className={errors.lastName ? "border-destructive" : ""}
                            required
                        />
                        <FieldError message={errors.lastName} />
                    </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-2 gap-4">
                    {!isEdit && (
                        <div className="space-y-1.5">
                            <FieldLabel required>Email</FieldLabel>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="john@company.com"
                                    value={form.email}
                                    onChange={(e) => update("email", e.target.value)}
                                    className={`pl-9 ${errors.email ? "border-destructive" : ""}`}
                                    required
                                />
                            </div>
                            <FieldError message={errors.email} />
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <FieldLabel required>Phone Number</FieldLabel>
                        <PhoneInput
                            value={form.phoneNumber}
                            onChange={(v) => update("phoneNumber", v)}
                            countryCode={form.phoneCode}
                            onCountryCodeChange={(v) => update("phoneCode", v)}
                            error={!!errors.phoneNumber}
                            required
                        />
                        <FieldError message={errors.phoneNumber} />
                    </div>
                    {isEdit && (
                        <div className="space-y-1.5">
                            <FieldLabel>Status</FieldLabel>
                            <Select
                                options={STATUS_OPTION}
                                value={form.status}
                                onValueChange={(v) => update("status", v as "Active" | "Inactive")}
                                placeholder="Select status"
                                combobox
                            />
                        </div>
                    )}
                </div>
                <div className="space-y-1.5">
                    <FieldLabel required>Assign Accounts</FieldLabel>
                    <div className="relative">
                        <Select
                            multiple
                            values={form.accountIds ? form.accountIds.split(",") : []}
                            onValuesChange={(v) => update("accountIds", v.join(","))}
                            options={assignAccountOptions}
                            placeholder="Select Assign Accounts"
                            icon={Building}
                            searchable
                            searchPlaceholder="Search Assign Accounts..."
                        />
                    </div>
                    <FieldError message={errors.accountIds} />
                </div>
                {/* Organization (admin only, create only) */}
                {isAdmin && !isEdit && (
                    <div className="space-y-1.5">
                        <FieldLabel required>Organization</FieldLabel>
                        <Select
                            value={form.organizationId}
                            onValueChange={(v) => update("organizationId", v)}
                            options={organizationOptions}
                            placeholder="Search organizations..."
                            icon={Building2}
                            combobox
                        />
                        <FieldError message={errors.organization} />
                    </div>
                )}

                {/* Password (admin variant only) */}
                {!isEdit && isAdmin && (
                    <div className="space-y-1.5">
                        <FieldLabel required={!isEdit}>Password</FieldLabel>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Min. 8 characters"
                                value={form.password}
                                onChange={(e) => update("password", e.target.value)}
                                className={`pl-9 pr-10 ${errors.password ? "border-destructive" : ""}`}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {form.password && form.password.length > 0 && form.password.length < SECURITY.MIN_PASSWORD_LENGTH && !errors.password && (
                            <p className="text-xs text-warning">Password must be at least {SECURITY.MIN_PASSWORD_LENGTH} characters</p>
                        )}
                        <FieldError message={errors.password} />
                    </div>
                )}
            </div>
        </FormModal>
    )
}
