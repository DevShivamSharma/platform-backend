import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Building, Building2, MapPin } from "lucide-react"
import { FieldLabel } from "@/components/ui/field-label"
import { FieldError } from "@/components/ui/field-error"
import { STC_CODE_OPTIONS, STATUS_OPTIONS } from "@/constants"
import type { AccountStatus } from "@/models"
import * as React from "react"
import { getNpiDetails } from "@/services/account.service"

// ── Types ──────────────────────────────────────────────────────

export interface AccountFormData {
    id?: string
    npi: string
    stcCodes: string
    taxId?: string
    name: string
    address: string
    city: string
    state: string
    zip: string
    organizationId?: string
    status?: "Active" | "Inactive"
}

export const emptyAccountForm: AccountFormData = {
    npi: "",
    stcCodes: "",
    taxId: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    organizationId: "",
    status: "Active",
}

// ── Shared form fields ──────────────────────────────────────────

export function AccountInfoFields({
    form,
    update,
    errors,
    lockAccountFieldsUntilNpiLookup = false,
}: {
    form: AccountFormData
    update: <K extends keyof AccountFormData>(key: K, value: AccountFormData[K]) => void
    errors: Partial<Record<keyof AccountFormData, string>>
    lockAccountFieldsUntilNpiLookup?: boolean
}) {
    const [npiStatus, setNpiStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
    const [npiMessage, setNpiMessage] = React.useState<string>("")
    const lastLookupNpiRef = React.useRef<string>("")
    const requestSeq = React.useRef(0)

    const accountFieldsEnabled = !lockAccountFieldsUntilNpiLookup || npiStatus === "success"
    React.useEffect(() => {
        if (!lockAccountFieldsUntilNpiLookup) return

        const npi = (form.npi ?? "").trim()
        setNpiMessage("")

        if (npi.length !== 10) {
            lastLookupNpiRef.current = ""
            setNpiStatus("idle")
            return
        }

        const seq = ++requestSeq.current
        setNpiStatus("loading")

        const t = window.setTimeout(async () => {
            try {
                const res = await getNpiDetails(npi)
                if (requestSeq.current !== seq) return

                const results = res?.data?.results ?? []
                const first = results[0]

                if (!res.success || !first) {
                    lastLookupNpiRef.current = npi
                    setNpiStatus("error")
                    setNpiMessage("NPI not found")
                    return
                }

                lastLookupNpiRef.current = npi
                setNpiStatus("success")
                setNpiMessage("")

                const orgName = first.basic?.organization_name
                if (orgName) update("name", orgName)

                const taxonomyCode = (first.taxonomies ?? [])[0]?.code
                if (taxonomyCode) update("taxId", taxonomyCode)

                const addr = (first.addresses ?? [])[0]
                if (addr) {
                    if (addr.address_1) update("address", addr.address_1)
                    if (addr.city) update("city", addr.city)
                    if (addr.state) update("state", addr.state)
                    // if (addr.postal_code) update("zip", addr.postal_code.replace(/\D/g, "").slice(0, 5))
                }
            } catch (e) {
                if (requestSeq.current !== seq) return
                setNpiStatus("error")
                setNpiMessage("Failed to lookup NPI")
            }
        }, 450)

        return () => window.clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.npi, lockAccountFieldsUntilNpiLookup])

    return (
        <div>
            {/* <SectionHeader icon={Building2} title="NPI Information" /> */}
            <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground">NPI Information</span>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 mb-4">
                <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                    <div className="space-y-1.5">
                        <FieldLabel required>NPI</FieldLabel>
                        <Input
                            placeholder="1234567890"
                            value={form.npi}
                            onChange={(e) => update("npi", e.target.value.replace(/\D/g, "").slice(0, 10))}
                            className={errors.npi ? "border-destructive" : ""}
                            maxLength={10}
                            required
                            disabled={!lockAccountFieldsUntilNpiLookup}
                        />
                        {form.npi && form.npi.length > 0 && form.npi.length < 10 && !errors.npi && (
                            <p className="text-xs text-warning">NPI must be exactly 10 digits</p>
                        )}
                        {lockAccountFieldsUntilNpiLookup && form.npi?.length === 10 && npiStatus === "loading" && (
                            <p className="text-xs text-muted-foreground">Looking up NPI…</p>
                        )}
                        {lockAccountFieldsUntilNpiLookup && npiMessage && (
                            <p className="text-xs text-destructive">{npiMessage}</p>
                        )}
                        <FieldError message={errors.npi} />
                    </div>
                </div>
            </div>
            {/* <SectionHeader icon={Building2} title="Account Information" /> */}
            <div className="gradient-primary rounded-lg px-4 py-2.5 flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground">Account Information</span>
            </div>
            <div
                className={`rounded-xl border border-border/60 bg-muted/20 p-4 ${!accountFieldsEnabled ? "opacity-60" : ""}`}
                aria-disabled={!accountFieldsEnabled}
            >
                <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                    {/* <div className="space-y-1.5">
                        <FieldLabel required>NPI</FieldLabel>
                        <Input
                            placeholder="1234567890"
                            value={form.npi}
                            onChange={(e) => update("npi", e.target.value.replace(/\D/g, "").slice(0, 10))}
                            className={errors.npi ? "border-destructive" : ""}
                            maxLength={10}
                            required
                        />
                        {form.npi && form.npi.length > 0 && form.npi.length < 10 && !errors.npi && (
                            <p className="text-xs text-warning">NPI must be exactly 10 digits</p>
                        )}
                        <FieldError message={errors.npi} />
                    </div> */}
                    <div className="space-y-1.5">
                        <FieldLabel required>Name</FieldLabel>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Sunrise Medical Center"
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
                                className={`pl-9 ${errors.name ? "border-destructive" : ""}`}
                                disabled={!accountFieldsEnabled}
                                required
                            />
                        </div>
                        <FieldError message={errors.name} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel required>STC Codes</FieldLabel>
                        <div className="relative">
                            <Select
                                multiple
                                values={form.stcCodes ? form.stcCodes.split(",") : []}
                                onValuesChange={(v) => update("stcCodes", v.join(","))}
                                options={STC_CODE_OPTIONS}
                                placeholder="Select STC Codes"
                                icon={Building}
                                searchable
                                searchPlaceholder="Search STC Codes..."
                                disabled={!accountFieldsEnabled}
                            />
                        </div>
                        <FieldError message={errors.stcCodes} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel required>Tax Id</FieldLabel>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="123456"
                                value={form.taxId}
                                onChange={(e) => update("taxId", e.target.value)}
                                className={`pl-9 ${errors.taxId ? "border-destructive" : ""}`}
                                disabled={!accountFieldsEnabled}
                                required
                            />
                        </div>
                        <FieldError message={errors.taxId} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel required>Address</FieldLabel>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="123 Main Street"
                                value={form.address}
                                onChange={(e) => update("address", e.target.value)}
                                className={`pl-9 ${errors.address ? "border-destructive" : ""}`}
                                disabled={!accountFieldsEnabled}
                                required
                            />
                        </div>
                        <FieldError message={errors.address} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel required>City</FieldLabel>
                        <Input
                            placeholder="San Francisco"
                            value={form.city}
                            onChange={(e) => update("city", e.target.value)}
                            className={errors.city ? "border-destructive" : ""}
                            disabled={!accountFieldsEnabled}
                            required
                        />
                        <FieldError message={errors.city} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel required>State</FieldLabel>
                        <Input
                            placeholder="CA"
                            value={form.state}
                            onChange={(e) => update("state", e.target.value)}
                            className={errors.state ? "border-destructive" : ""}
                            disabled={!accountFieldsEnabled}
                            required
                        />
                        <FieldError message={errors.state} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel required>Zip</FieldLabel>
                        <Input
                            placeholder="94102"
                            value={form.zip}
                            onChange={(e) => update("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
                            className={errors.zip ? "border-destructive" : ""}
                            maxLength={5}
                            disabled={!accountFieldsEnabled}
                            required
                        />
                        <FieldError message={errors.zip} />
                    </div>
                    <div className="space-y-1.5">
                        <FieldLabel required>Status</FieldLabel>
                        <Select
                            placeholder="Select status..."
                            options={STATUS_OPTIONS}
                            value={form.status}
                            onValueChange={(val) => update("status", val as AccountStatus)}
                            className={errors.status ? "border-destructive" : ""}
                            combobox
                            disabled={!accountFieldsEnabled}
                        />
                        <FieldError message={errors.status} />
                    </div>
                </div>
            </div>
        </div>
    )
}
