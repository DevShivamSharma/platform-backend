import type React from "react"
import { Building } from "lucide-react"
import { FormModal } from "@/components/ui/form-modal"
import { useAccounts, useEntityFormModal } from "@/hooks"
import { accountFormSchema } from "@/models/schemas"
import type { AccountStatus, BaseModalProps, UpdateAccountRequest } from "@/models"
import { AccountInfoFields, emptyAccountForm } from "./account-info-fields"
import type { AccountFormData } from "./account-info-fields"

// ── Types ──────────────────────────────────────────────────────

export interface AccountData {
    id: string
    npi: string
    stcCodes: string[]
    taxId?: string
    name: string
    address: string
    city: string
    state: string
    zip: string
    organizationId?: string
    status?: AccountStatus
}

interface EditAccountModalProps extends BaseModalProps {
    account: AccountData
    organizationId?: string
}

// ── Main modal ─────────────────────────────────────────────────

export function EditAccountModal({ isOpen, onClose, onSuccess, account, organizationId: propOrgId }: EditAccountModalProps) {
    const { updateAccount, fetchAccountById } = useAccounts({ enabled: false })

    const {
        form,
        update,
        errors,
        loading,
        formRef,
        isSubmitting,
        submitError,
        handleSubmit,
    } = useEntityFormModal<AccountFormData, AccountData>({
        initialData: emptyAccountForm,
        isOpen,
        entityId: account.id,
        fetchById: fetchAccountById,
        transformToForm: (f) => ({
            npi: f.npi,
            stcCodes: Array.isArray(f.stcCodes) ? f.stcCodes.join(",") : f.stcCodes,
            taxId: f.taxId || "",
            name: f.name,
            address: f.address,
            city: f.city,
            state: f.state,
            zip: f.zip,
            organizationId: f.organizationId || "",
            status: f.status || "Active",
        }),
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
            title="Edit Account"
            subtitle="Update Account information"
            icon={Building}
            loading={loading}
            showAccentLine
            isSubmitting={isSubmitting}
            maxWidth="max-w-[1100px]"
            canSubmit={!!canSubmit}
            onSubmit={() => {
                const payload: UpdateAccountRequest = {
                    npi: form.npi,
                    stcCodes: form.stcCodes ? form.stcCodes.split(",").filter(Boolean) : [],
                    name: form.name,
                    taxId: form.taxId ?? "",
                    address: form.address,
                    organizationId: propOrgId || "",
                    city: form.city,
                    state: form.state,
                    zip: form.zip,
                    status: form.status as AccountStatus,
                }
                handleSubmit(async () => {
                    await updateAccount(account.id, payload)
                    return { ...account, ...payload }
                }, form)
            }}
            submitError={submitError}
            submitLabel="Save Account"
            submittingLabel="Saving..."
        >
            <div ref={formRef as React.RefObject<HTMLDivElement | null>} className="space-y-6">
                <AccountInfoFields form={form} update={update} errors={errors} />
            </div>
        </FormModal>
    )
}
