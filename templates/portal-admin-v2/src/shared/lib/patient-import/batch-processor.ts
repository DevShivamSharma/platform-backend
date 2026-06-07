import { createPatientBulk } from "@/services/patient.service"
import type { CreatePatientRequest, Gender } from "@/models/patient.model"
import type {
    ValidatedRow,
    BatchProgress,
    FailedImportRow,
    ImportResult,
} from "./types"

const DEFAULT_BATCH_SIZE = 10

interface BatchProcessorConfig {
    rows: { rowIndex: number; data: ValidatedRow }[]
    organizationId: string
    batchSize?: number
    onProgress: (progress: BatchProgress) => void
    signal?: AbortSignal,
    payers: { payerId: string; payerName: string }[]
    accounts: { id: string; name: string }[]
    tag?: string
}

function getPayerIdByName(
    payerName: string | undefined,
    payersOptions: { payerId: string; payerName: string }[]
): string | undefined {
    if (!payerName) return undefined

    const match = payersOptions.find(
        (payer) =>
            payer.payerName.trim().toLowerCase() ===
            payerName.trim().toLowerCase()
    )

    return match?.payerId
}

function getAccountIdByName(
    accountName: string | undefined,
    accounts: { id: string; name: string }[]
): string | undefined {
    if (!accountName) return undefined

    const match = accounts.find(
        (account) =>
            account.name.trim().toLowerCase() ===
            accountName.trim().toLowerCase()
    )

    return match?.id
}



export async function processImportBatches(
    config: BatchProcessorConfig
): Promise<ImportResult> {
    const {
        rows,
        organizationId,
        batchSize = DEFAULT_BATCH_SIZE,
        onProgress,
        signal,
        payers,
        accounts,
        tag,
    } = config

    const totalRows = rows.length
    const totalBatches = Math.ceil(totalRows / batchSize)
    let successCount = 0
    let failedCount = 0
    const failedRows: FailedImportRow[] = []
    function normalizeGender(value?: string): Gender {
        const g = value?.trim().toLowerCase()

        if (g === "male") return "Male"
        if (g === "female") return "Female"
        return "Other"
    }
    function toCreatePayload(
        row: ValidatedRow,
    ): CreatePatientRequest {

        const primaryInsuranceId = getPayerIdByName(
            row.primaryInsuranceName,
            payers
        )

        const secondaryInsuranceId = getPayerIdByName(
            row.secondaryInsuranceName,
            payers
        )

        const accountId = getAccountIdByName(row.accountName, accounts)

        return {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            countryCode: "+1",
            ssn: row.ssn || "",
            dob: row.dob,
            gender: normalizeGender(row.gender),
            ethnicity: "",
            address: "",
            city: "",
            state: "",
            zipCode: "",

            accountId,

            primaryInsuranceId,
            primaryInsuranceName: payers.find(p => p.payerId === primaryInsuranceId)?.payerName || row.primaryInsuranceName || undefined,
            primaryInsurancePolicyId: row.primaryInsuranceNumber || undefined,

            secondaryInsuranceId,
            secondaryInsuranceName: payers.find(p => p.payerId === secondaryInsuranceId)?.payerName || row.secondaryInsuranceName || undefined,
            secondaryInsurancePolicyId: row.secondaryInsuranceNumber || undefined,
            ...(tag ? { tag } : {}),
        }
    }
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        if (signal?.aborted) {
            return {
                successCount,
                failedCount,
                failedRows,
                cancelled: true,
            }
        }

        const start = batchIndex * batchSize
        const end = Math.min(start + batchSize, totalRows)
        const batchRows = rows.slice(start, end)

        const patientsPayload = batchRows.map(({ data }) =>
            toCreatePayload(data)
        )

        try {
            const response = await createPatientBulk({
                organizationId,
                patients: patientsPayload,
            })

            // If backend returns success
            if (response?.data) {
                successCount += batchRows.length
            } else {
                throw new Error(
                    response.message || "Bulk insert failed"
                )
            }
        } catch (error: unknown) {
            const errorMessage =
                (error instanceof Error ? error.message : null) ||
                "Bulk API failed"

            // Entire batch failed
            for (const { rowIndex, data } of batchRows) {
                failedCount++
                failedRows.push({
                    rowIndex,
                    data,
                    error: errorMessage,
                })
            }
        }

        const processedRows = end

        onProgress({
            currentBatch: batchIndex + 1,
            totalBatches,
            processedRows,
            totalRows,
            successCount,
            failedCount,
            percentComplete: Math.round(
                (processedRows / totalRows) * 100
            ),
        })
    }

    return {
        successCount,
        failedCount,
        failedRows,
        cancelled: false,
    }
}