import { useEffect } from "react"
import { ClipboardCheck, User } from "lucide-react"
import { FormModal } from "@/components/ui/form-modal"
import { SectionHeader } from "@/components/ui/section-header"
import { DateInput } from "@/components/ui/date-input"
import { FieldLabel } from "@/components/ui/field-label"
import { useFormState } from "@/hooks/use-form-state"
import { useFormSubmit } from "@/hooks/use-form-submit"
import { claimStatusCheckSchema } from "@/models/schemas"
import { formatDate } from "@/lib/format"
import { computeClaimEndDate, claimStatusVerification, type AccountConfig } from "@/services/patient-workflow.service"


// ── Types ──────────────────────────────────────────────────────

export interface ClaimStatusPatient {
    id: string
    firstName: string
    lastName: string
    dob: string
    gender: string
    primaryInsuranceId?: string
    primaryInsurancePolicyId?: string
}

interface ClaimStatusModalProps {
    isOpen: boolean
    onClose: () => void
    patient: ClaimStatusPatient
    accountConfig: AccountConfig
}

interface ClaimStatusFormData {
    startDate: string
    endDate: string
}

const emptyForm: ClaimStatusFormData = { startDate: "", endDate: "" }

// ── Component ──────────────────────────────────────────────────

export function ClaimStatusModal({ isOpen, onClose, patient, accountConfig }: ClaimStatusModalProps) {
    const {
        form, update, errors,
        submitError, setSubmitError, setErrors,
        isSubmitting, setIsSubmitting, reset,
    } = useFormState<ClaimStatusFormData>(emptyForm)

    const handleSubmit = useFormSubmit({
        setIsSubmitting,
        setSubmitError,
        setErrors,
        onClose,
        successMessage: "Claim status check initiated successfully!",
        schema: claimStatusCheckSchema,
    })

    useEffect(() => {
        if (isOpen) reset()
    }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

    const canSubmit = !!form.startDate && !!form.endDate

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={`${patient.firstName} ${patient.lastName}`}
            icon={ClipboardCheck}
            maxWidth="max-w-[480px]"
            showAccentLine
            isSubmitting={isSubmitting}
            canSubmit={canSubmit}
            onSubmit={() =>
                handleSubmit(() =>
                    claimStatusVerification({
                        patientId: patient.id,
                        firstName: patient.firstName,
                        lastName: patient.lastName,
                        dateOfBirth: patient.dob,
                        gender: patient.gender,
                        startDate: form.startDate,
                        endDate: form.endDate,
                        payerId: patient.primaryInsuranceId ?? "",
                        memberId: patient.primaryInsurancePolicyId ?? "",
                        accountConfig,
                    }),
                    form
                )
            }

            submitError={submitError}
            submitLabel="Run Check"
            submittingLabel="Running..."
        >
            <div className="space-y-6">
                {/* Patient information (read-only) */}
                <div>
                    <SectionHeader icon={User} title="Patient Information" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Name</p>
                                <p className="text-sm font-medium text-foreground">{patient.firstName} {patient.lastName}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Date of Birth</p>
                                <p className="text-sm font-medium text-foreground">{patient.dob ? formatDate(patient.dob) : "--"}</p>
                            </div>
                            {patient.primaryInsuranceId && (
                                <>
                                    <div>
                                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Insurance</p>
                                        <p className="text-sm font-medium text-foreground">{patient.primaryInsuranceId}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Policy #</p>
                                        <p className="text-sm font-medium text-foreground">{patient.primaryInsurancePolicyId || "--"}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Date of service input */}
                <div>
                    <SectionHeader icon={ClipboardCheck} title="Claim Status Check" />
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            Select a date of service to run the claim status check for this patient.
                        </p>
                        <div className="space-y-1.5">
                            <FieldLabel required>Date of Service</FieldLabel>
                            <DateInput
                                value={form.startDate}
                                onChange={(v) => {
                                    update("startDate", v)
                                    if (v) {
                                        update("endDate", computeClaimEndDate(v))
                                    }
                                }}
                                placeholder="Select service date"
                                error={!!errors.startDate}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </FormModal>
    )
}
