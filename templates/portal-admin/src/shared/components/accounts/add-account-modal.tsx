import { Building } from "lucide-react"
import { FormModal } from "@/components/ui/form-modal"
import { useAccounts, useEntityFormModal } from "@/hooks"
import { accountFormSchema } from "@/models/schemas"
import type { BaseModalProps, CreateAccountRequest } from "@/models"
import { AccountInfoFields, emptyAccountForm } from "./account-info-fields"
import type { AccountFormData } from "./account-info-fields"

// ── Types ──────────────────────────────────────────────────────

interface AddAccountModalProps extends BaseModalProps {
    organizationId?: string
}

// ── Main modal ─────────────────────────────────────────────────

export function AddAccountModal({ isOpen, onClose, onSuccess, organizationId: propOrgId }: AddAccountModalProps) {
    const { createAccount } = useAccounts({ enabled: false })

    const {
        form,
        update,
        errors,
        isSubmitting,
        submitError,
        handleSubmit,
    } = useEntityFormModal<AccountFormData>({
        initialData: emptyAccountForm,
        isOpen,
        onSuccess,
        onClose,
        entityLabel: "Account",
        schema: accountFormSchema,
    })

    const canSubmit = accountFormSchema.safeParse({
        npi: form.npi,
        stcCodes: form.stcCodes,
        name: form.name,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        status: form.status,
    }).success

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Account"
            subtitle="Add a new Account to your organization"
            icon={Building}
            showAccentLine
            isSubmitting={isSubmitting}
            maxWidth="max-w-[1100px]"
            canSubmit={!!canSubmit}
            onSubmit={() => {
                const payload: CreateAccountRequest = {
                    npi: form.npi,
                    stcCodes: form.stcCodes ? form.stcCodes.split(",").filter(Boolean) : [],
                    name: form.name,
                    taxId: form.taxId ?? "",
                    address: form.address,
                    organizationId: propOrgId || "",
                    city: form.city,
                    state: form.state,
                    zip: form.zip,
                }
                handleSubmit(() => createAccount(payload), form)
            }}
            submitError={submitError}
            submitLabel="Add Account"
            submittingLabel="Creating..."
        >
            <div className="space-y-6">
                <AccountInfoFields form={form} update={update} errors={errors} lockAccountFieldsUntilNpiLookup />
            </div>
        </FormModal>
    )
}
