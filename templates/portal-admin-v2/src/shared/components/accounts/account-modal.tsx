import type React from "react"
import { Building } from "lucide-react"
import { FormModal } from "@/components/ui/form-modal"
import { useAccounts, useEntityFormModal } from "@/hooks"
import { accountFormSchema } from "@/models/schemas"
import type { AccountStatus, BaseModalProps, CreateAccountRequest, UpdateAccountRequest } from "@/models"
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

type AccountModalProps = BaseModalProps & {
    organizationId?: string
} & (
        | { mode: "add"; account?: never }
        | { mode: "edit"; account: AccountData }
    )

// ── Main modal ─────────────────────────────────────────────────

export function AccountModal(props: AccountModalProps) {
    const { isOpen, onClose, onSuccess, organizationId: propOrgId, mode } = props
    const account = mode === "edit" ? props.account : undefined

    const { createAccount, updateAccount, fetchAccountById } = useAccounts({ enabled: false })

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
        ...(mode === "edit" && account
            ? {
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
            }
            : {}),
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

    const isAdd = mode === "add"

    const onSubmit = () => {
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

        if (isAdd) {
            handleSubmit(() => createAccount(payload), form)
        } else {
            const updatePayload: UpdateAccountRequest = {
                ...payload,
                status: form.status as AccountStatus,
            }
            handleSubmit(async () => {
                await updateAccount(account!.id, updatePayload)
                return { ...account!, ...updatePayload }
            }, form)
        }
    }

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={isAdd ? "Add Account" : "Edit Account"}
            subtitle={isAdd ? "Add a new Account to your organization" : "Update Account information"}
            icon={Building}
            loading={loading}
            showAccentLine
            isSubmitting={isSubmitting}
            maxWidth="max-w-[1100px]"
            canSubmit={!!canSubmit}
            onSubmit={onSubmit}
            submitError={submitError}
            submitLabel={isAdd ? "Add Account" : "Save Account"}
            submittingLabel={isAdd ? "Creating..." : "Saving..."}
        >
            <div ref={formRef as React.RefObject<HTMLDivElement | null>} className="space-y-6">
                <AccountInfoFields
                    form={form}
                    update={update}
                    errors={errors}
                    lockAccountFieldsUntilNpiLookup={isAdd}
                />
            </div>
        </FormModal>
    )
}
