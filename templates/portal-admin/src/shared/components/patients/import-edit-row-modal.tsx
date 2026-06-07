/**
 * @fileoverview Edit Row Modal for the Import Patients wizard.
 * Provides a form to fix validation errors on a single imported row.
 * Design aligned with the Add Patient modal (gradient headers, bordered
 * containers, PhoneInput, SSNInput, Select for insurance payers).
 */

import { useState, useCallback, useMemo } from "react"
import {
    AlertCircle,
    CheckCircle2,
    UserRound,
    Shield,
} from "lucide-react"
import { FormModal } from "@/components/ui/form-modal"
import { Input } from "@/components/ui/input"
import { DateInput } from "@/components/ui/date-input"
import { PhoneInput, formatPhone } from "@/components/ui/phone-input"
import { SSNInput } from "@/components/ui/ssn-input"
import { Select } from "@/components/ui/select"
import { FieldLabel } from "@/components/ui/field-label"
import { FieldError } from "@/components/ui/field-error"
import { validateRow } from "@/lib/patient-import/validate-rows"
import { type ImportRow } from "@/lib/patient-import/types"
import type { RowData } from "./import-validation-step"

// ── Props ───────────────────────────────────────────────────

export interface EditRowModalProps {
    row: RowData
    payerNames: string[]
    accountNames: string[]
    accounts: { id: string; name: string }[]
    onClose: () => void
    onSave: (data: ImportRow) => void
}

// ── Component ───────────────────────────────────────────────

export function EditRowModal({ row, payerNames, accountNames, accounts, onClose, onSave }: EditRowModalProps) {
    const [localData, setLocalData] = useState<ImportRow>({ ...row.data })
    const [localErrors, setLocalErrors] = useState<Record<string, string>>(row.errors)

    const accountOptions = useMemo(
        () => accounts.map(a => ({ label: a.name, value: a.name })),
        [accounts]
    )

    const payerOptions = useMemo(
        () => payerNames.map(name => ({ label: name, value: name })),
        [payerNames]
    )

    // Re-validate whenever local data changes
    const update = useCallback((field: keyof ImportRow, value: string) => {
        setLocalData(prev => {
            const next = { ...prev, [field]: value }
            const result = validateRow(next, payerNames, accountNames)
            setLocalErrors(result.errors)
            return next
        })
    }, [payerNames, accountNames])

    const hasErrors = Object.keys(localErrors).length > 0

    return (
        <FormModal
            isOpen
            onClose={onClose}
            title="Fix Row Errors"
            subtitle={`Row ${row.rowIndex} — correct the highlighted fields`}
            icon={AlertCircle}
            iconVariant="destructive"
            maxWidth="max-w-[1100px]"
            showAccentLine
            isSubmitting={false}
            canSubmit={!hasErrors}
            onSubmit={() => onSave(localData)}
            submitLabel="Save Changes"
            submitIcon={CheckCircle2}
        >
            <div className="space-y-4">
                {/* Patient Information */}
                <div>
                    <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                        <UserRound className="h-4 w-4 text-primary-foreground" />
                        <span className="text-sm font-semibold text-primary-foreground">Patient Information</span>
                    </div>
                    <div className="border border-border/60 bg-muted/20 rounded-xl p-3">
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                            <div className="space-y-1">
                                <FieldLabel required>First Name</FieldLabel>
                                <Input
                                    value={localData.firstName}
                                    onChange={(e) => update("firstName", e.target.value)}
                                    className={localErrors.firstName ? "border-destructive" : ""}
                                    placeholder="John"
                                />
                                <FieldError message={localErrors.firstName} />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel required>Last Name</FieldLabel>
                                <Input
                                    value={localData.lastName}
                                    onChange={(e) => update("lastName", e.target.value)}
                                    className={localErrors.lastName ? "border-destructive" : ""}
                                    placeholder="Doe"
                                />
                                <FieldError message={localErrors.lastName} />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel required>Date of Birth</FieldLabel>
                                <DateInput
                                    value={localData.dob}
                                    onChange={(v) => update("dob", v)}
                                    error={!!localErrors.dob}
                                />
                                <FieldError message={localErrors.dob} />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>Gender</FieldLabel>
                                <Select
                                    value={localData.gender}
                                    onValueChange={(v) => update("gender", v)}
                                    options={[
                                        { value: "Male", label: "Male" },
                                        { value: "Female", label: "Female" },
                                        { value: "Other", label: "Other" },
                                    ]}
                                    placeholder="Select"
                                    combobox
                                />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel required>Account</FieldLabel>
                                <Select
                                    value={localData.accountName}
                                    onValueChange={(v) => update("accountName", v)}
                                    options={accountOptions}
                                    placeholder="Select account..."
                                    combobox
                                />
                                <FieldError message={localErrors.accountName} />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>SSN</FieldLabel>
                                <SSNInput
                                    value={localData.ssn}
                                    onChange={(e) => update("ssn", e.target.value)}
                                    className={localErrors.ssn ? "border-destructive" : ""}
                                />
                                <FieldError message={localErrors.ssn} />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>Phone</FieldLabel>
                                <PhoneInput
                                    value={formatPhone(localData.phone)}
                                    onChange={(v) => update("phone", v)}
                                    countryCode="+1"
                                    onCountryCodeChange={() => { }}
                                    error={!!localErrors.phone}
                                />
                                <FieldError message={localErrors.phone} />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>Email</FieldLabel>
                                <Input
                                    value={localData.email}
                                    onChange={(e) => update("email", e.target.value)}
                                    className={localErrors.email ? "border-destructive" : ""}
                                    placeholder="john@example.com"
                                    type="email"
                                />
                                <FieldError message={localErrors.email} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insurance & Verification */}
                <div>
                    <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-primary-foreground" />
                        <span className="text-sm font-semibold text-primary-foreground">Insurance & Verification</span>
                    </div>
                    <div className="border border-border/60 bg-muted/20 rounded-xl p-3">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="space-y-1">
                                <FieldLabel>Primary Insurance</FieldLabel>
                                <Select
                                    value={localData.primaryInsuranceName}
                                    onValueChange={(v) => update("primaryInsuranceName", v)}
                                    options={payerOptions}
                                    placeholder="Search insurance..."
                                    combobox
                                />
                                <FieldError message={localErrors.primaryInsuranceName} />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>Primary Policy #</FieldLabel>
                                <Input
                                    value={localData.primaryInsuranceNumber}
                                    onChange={(e) => update("primaryInsuranceNumber", e.target.value)}
                                    className={localErrors.primaryInsuranceNumber ? "border-destructive" : ""}
                                    placeholder="POL-000000"
                                />
                                <FieldError message={localErrors.primaryInsuranceNumber} />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>Secondary Insurance</FieldLabel>
                                <Select
                                    value={localData.secondaryInsuranceName}
                                    onValueChange={(v) => update("secondaryInsuranceName", v)}
                                    options={payerOptions}
                                    placeholder="Search insurance..."
                                    combobox
                                />
                                <FieldError message={localErrors.secondaryInsuranceName} />
                            </div>
                            <div className="space-y-1">
                                <FieldLabel>Secondary Policy #</FieldLabel>
                                <Input
                                    value={localData.secondaryInsuranceNumber}
                                    onChange={(e) => update("secondaryInsuranceNumber", e.target.value)}
                                    className={localErrors.secondaryInsuranceNumber ? "border-destructive" : ""}
                                    placeholder="POL-000000"
                                />
                                <FieldError message={localErrors.secondaryInsuranceNumber} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormModal>
    )
}
