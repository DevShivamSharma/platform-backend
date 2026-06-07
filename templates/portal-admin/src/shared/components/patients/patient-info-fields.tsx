import React from "react"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { DateInput } from "@/components/ui/date-input"
import { SSNInput } from "@/components/ui/ssn-input"
import { Select } from "@/components/ui/select"
import { FieldLabel } from "@/components/ui/field-label"
import { FieldError } from "@/components/ui/field-error"
import { useInsuranceDiscovery } from "@/hooks"

export interface PatientInfoFieldsProps {
    form: {
        firstName: string
        lastName: string
        dateOfBirth: string
        gender: string
        organizationId?: string
        accountId?: string
        ssn: string
        phone: string
        phoneCode: string
        tag: string
        zipCode: string
    }
    update: (field: string, value: string) => void
    errors: Record<string, string | undefined>
    type?: "customer" | "admin"
    accountOptions?: { label: string; value: string }[]
    /** Controlled account value (used by add-patient-modal in customer mode) */
    selectedAccountId?: string
    /** Account change handler (used by add-patient-modal in customer mode) */
    onAccountChange?: (value: string) => void
    /** Active account ID from topbar context — shows read-only label instead of dropdown */
    activeAccountId?: string
    /** Active account name for the read-only label */
    activeAccountName?: string
}

export const PatientInfoFields = React.memo(function PatientInfoFields({
    form,
    update,
    errors,
    type = "customer",
    accountOptions = [],
    selectedAccountId,
    onAccountChange,
    activeAccountId,
    activeAccountName
}: PatientInfoFieldsProps) {

    const discovery = useInsuranceDiscovery()

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 gap-x-4 gap-y-2">
                <div className="space-y-1">
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
                <div className="space-y-1">
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
                <div className="space-y-1">
                    <FieldLabel required>Date of Birth</FieldLabel>
                    <DateInput value={form.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} required />
                    <FieldError message={errors.dateOfBirth} />
                </div>
                <div className="space-y-1">
                    <FieldLabel>Gender</FieldLabel>
                    <Select
                        value={form.gender}
                        onValueChange={(v) => update("gender", v)}
                        options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Others", label: "Others" }]}
                        placeholder="Select"
                        combobox
                    />
                    <FieldError message={errors.gender} />
                </div>
                {type === "admin" && accountOptions.length > 0 && (
                    <div className="space-y-1">
                        <FieldLabel>Account</FieldLabel>
                        <Select
                            value={form.accountId ?? ""}
                            onValueChange={(v) => update("accountId", v)}
                            options={accountOptions}
                            placeholder="Search accounts..."
                            combobox
                        />
                        <FieldError message={errors.accountId} />
                    </div>
                )}
                {type === "customer" && activeAccountId && (
                    <div className="space-y-1">
                        <FieldLabel>Account</FieldLabel>
                        <div className="flex items-center h-9 px-3 rounded-md border border-border bg-muted/50 text-sm text-foreground">
                            {activeAccountName || activeAccountId}
                        </div>
                    </div>
                )}
                {type === "customer" && !activeAccountId && accountOptions.length > 0 && onAccountChange && (
                    <div className="space-y-1">
                        <FieldLabel required>Account</FieldLabel>
                        <Select
                            value={selectedAccountId ?? ""}
                            onValueChange={onAccountChange}
                            options={accountOptions}
                            placeholder="Select account..."
                            combobox
                        />
                        <FieldError message={errors.accountId} />
                    </div>
                )}
                <div className="space-y-1">
                    <FieldLabel>SSN</FieldLabel>
                    <SSNInput value={form.ssn} onChange={(e) => update("ssn", e.target.value)} />
                    <FieldError message={errors.ssn} />
                </div>
                <div className="space-y-1">
                    <FieldLabel>Phone</FieldLabel>
                    <PhoneInput
                        value={form.phone}
                        onChange={(v) => update("phone", v)}
                        countryCode={form.phoneCode}
                        onCountryCodeChange={(v) => update("phoneCode", v)}
                    />
                    <FieldError message={errors.phone} />
                </div>
                <div className="space-y-1">
                    <FieldLabel>ZIP Code</FieldLabel>
                    <Input
                        placeholder="e.g. 10001"
                        value={form.zipCode}
                        onChange={(e) => {
                            update("zipCode", e.target.value)
                            discovery.setZipCode(e.target.value)
                        }}
                        maxLength={10}
                    />
                </div>
                <div className="space-y-1">
                    <FieldLabel>Tag</FieldLabel>
                    <Input
                        placeholder="e.g. batch-march-2026"
                        value={form.tag}
                        onChange={(e) => update("tag", e.target.value)}
                    />
                </div>

            </div>
        </div>
    )
})
