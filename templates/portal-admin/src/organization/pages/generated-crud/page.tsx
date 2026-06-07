import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { Database, Plus } from "lucide-react"
import { portalConfig, type GeneratedField, type GeneratedModule } from "@/lib/portal-config"
import { api } from "@/services/api.service"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { FormModal } from "@/components/ui/form-modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { RowActions } from "@/components/ui/row-actions"

type GeneratedRecord = Record<string, unknown> & { id: string }

function defaultValueForField(field: GeneratedField) {
    if (field.type === "checkbox" || field.type === "toggle") return false
    if (field.type === "multi-select" || field.type === "tags") return []
    return ""
}

function initialValues(module: GeneratedModule) {
    return Object.fromEntries(module.fields.map((field) => [field.key, defaultValueForField(field)]))
}

function displayValue(value: unknown, field?: GeneratedField) {
	if (value === null || value === undefined || value === "") return "--"
	if (Array.isArray(value)) return value.join(", ")

	switch (field?.type) {
		case "checkbox":
		case "toggle":
			return value ? "Yes" : "No"
		case "currency": {
			const fmt = field.displayFormat || "INR"
			const sym = fmt === "USD" ? "$" : fmt === "EUR" ? "€" : fmt === "GBP" ? "£" : "₹"
			const locale = fmt === "INR" ? "en-IN" : "en-US"
			return `${sym}${Number(value || 0).toLocaleString(locale)}`
		}
		case "phone": {
			const digits = String(value).replace(/\D/g, "")
			if (digits.length <= 5) return digits || "--"
			if (digits.length <= 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`
			return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7, 12)}`
		}
		case "date": {
			const d = new Date(String(value))
			return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("en-IN")
		}
		case "percentage":
			return `${value}%`
		case "email":
			return String(value).toLowerCase()
		case "url":
			return String(value)
		default:
			return String(value)
	}
}

function normalizeDraft(module: GeneratedModule, draft: Record<string, unknown>) {
    const next: Record<string, unknown> = {}
    for (const field of module.fields) {
        const value = draft[field.key]
        if (field.type === "number" || field.type === "currency") {
            next[field.key] = value === "" || value === undefined ? null : Number(value)
        } else {
            next[field.key] = value
        }
    }
    return next
}

function FieldControl({
	field,
	value,
	onChange,
}: {
	field: GeneratedField
	value: unknown
	onChange: (value: unknown) => void
}) {
	const [focused, setFocused] = useState(false)

	if (field.type === "textarea") {
		const text = String(value ?? "")
		const maxLen = field.maxLength
		return (
			<div className="relative">
				<textarea
					value={text}
					onChange={(event) => onChange(event.target.value)}
					placeholder={field.placeholder || ""}
					maxLength={maxLen}
					className="min-h-[92px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
				<span className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-muted-foreground">
					{maxLen ? `${text.length} / ${maxLen}` : text.length}
				</span>
			</div>
		)
	}

	if (field.type === "select" || field.type === "radio") {
		return (
			<Select
				options={field.options || []}
				value={String(value ?? "")}
				onValueChange={onChange}
				placeholder={`Select ${field.label.toLowerCase()}`}
			/>
		)
	}

	if (field.type === "multi-select") {
		return (
			<Select
				multiple
				options={field.options || []}
				values={Array.isArray(value) ? value.map(String) : []}
				onValuesChange={onChange}
				placeholder={`Select ${field.label.toLowerCase()}`}
			/>
		)
	}

	if (field.type === "checkbox" || field.type === "toggle") {
		const on = Boolean(value)
		const label = on ? "Active" : "Inactive"
		return (
			<button
				type="button"
				role="switch"
				aria-checked={on}
				onClick={() => onChange(!on)}
				className="flex items-center gap-3"
			>
				<span
					className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
						on ? "bg-primary" : "bg-muted-foreground/30"
					}`}
				>
					<span
						className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
							on ? "translate-x-[22px]" : "translate-x-0.5"
						}`}
					/>
				</span>
				<span className={`text-sm font-medium ${on ? "text-foreground" : "text-muted-foreground"}`}>
					{label}
				</span>
			</button>
		)
	}

	if (field.type === "tags") {
		const tags = Array.isArray(value) ? (value as string[]) : []
		const [draft, setDraft] = useState("")
		const addTag = (raw: string) => {
			const items = raw.split(",").map((s) => s.trim()).filter(Boolean)
			const unique = items.filter((t) => !tags.includes(t))
			if (unique.length) onChange([...tags, ...unique])
			setDraft("")
		}
		return (
			<div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring">
				{tags.map((t) => (
					<span key={t} className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium">
						{t}
						<button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="text-muted-foreground hover:text-destructive">×</button>
					</span>
				))}
				<input
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(draft) }
						if (e.key === "Backspace" && !draft && tags.length) onChange(tags.slice(0, -1))
					}}
					onBlur={() => draft && addTag(draft)}
					placeholder={tags.length ? "" : "Add tags…"}
					className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
				/>
			</div>
		)
	}

	if (field.type === "phone") {
		const raw = String(value ?? "")
		const formatPhone = (r: string) => {
			const d = r.replace(/\D/g, "")
			if (d.length <= 5) return d
			if (d.length <= 10) return `${d.slice(0, 5)} ${d.slice(5)}`
			return `+${d.slice(0, 2)} ${d.slice(2, 7)} ${d.slice(7, 12)}`
		}
		return (
			<Input
				type="tel"
				inputMode="tel"
				value={focused ? raw : formatPhone(raw)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				onChange={(e) => onChange(e.target.value.replace(/[^\d+]/g, "").slice(0, 12))}
				placeholder={field.placeholder || "+91 98765 43210"}
			/>
		)
	}

	if (field.type === "currency") {
		const rawVal = value ?? ""
		const fmt = field.displayFormat || "INR"
		const sym = fmt === "USD" ? "$" : fmt === "EUR" ? "€" : fmt === "GBP" ? "£" : "₹"
		const fmtDisplay = (v: unknown) => {
			const n = Number(v)
			if (v === "" || v == null || Number.isNaN(n)) return ""
			return fmt === "INR" ? n.toLocaleString("en-IN") : n.toLocaleString("en-US")
		}
		return (
			<div className="relative">
				<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
					{sym}
				</span>
				<Input
					type="text"
					inputMode="decimal"
					value={focused ? String(rawVal) : fmtDisplay(rawVal)}
					onFocus={() => setFocused(true)}
					onBlur={() => setFocused(false)}
					onChange={(e) => {
						const cleaned = e.target.value.replace(/[^\d.]/g, "")
						onChange(cleaned === "" ? "" : Number(cleaned))
					}}
					placeholder={field.placeholder || "0"}
					className="pl-8"
				/>
			</div>
		)
	}

	if (field.type === "email") {
		return (
			<Input
				type="email"
				value={String(value ?? "")}
				onChange={(e) => onChange(e.target.value.toLowerCase())}
				placeholder={field.placeholder || "name@example.com"}
			/>
		)
	}

	if (field.type === "percentage") {
		return (
			<div className="relative">
				<Input
					type="text"
					inputMode="decimal"
					value={String(value ?? "")}
					onChange={(e) => {
						const v = e.target.value
						if (v === "") { onChange(""); return }
						if (!/^\d*\.?\d{0,2}$/.test(v)) return
						const n = Number(v)
						if (n > 100) return
						onChange(v)
					}}
					onBlur={() => {
						if (value === "" || value == null) return
						const n = Math.min(100, Math.max(0, Number(value)))
						onChange(Number.isNaN(n) ? "" : n)
					}}
					placeholder={field.placeholder || "0"}
					className="pr-8"
				/>
				<span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
			</div>
		)
	}

	if (field.type === "date") {
		return (
			<Input
				type="date"
				value={String(value ?? "")}
				onChange={(e) => onChange(e.target.value)}
			/>
		)
	}

	if (field.type === "number") {
		return (
			<Input
				type="text"
				inputMode="numeric"
				value={String(value ?? "")}
				onKeyDown={(e) => {
					if (
						!/[\d.\-]/.test(e.key) &&
						!["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"].includes(e.key) &&
						!e.ctrlKey && !e.metaKey
					) e.preventDefault()
				}}
				onChange={(e) => onChange(e.target.value)}
				placeholder={field.placeholder || "0"}
			/>
		)
	}

	return (
		<Input
			type="text"
			value={String(value ?? "")}
			onChange={(event) => onChange(event.target.value)}
			placeholder={field.placeholder || ""}
		/>
	)
}

export default function GeneratedCrudPage() {
    const { moduleId } = useParams()
    const module = useMemo(
        () => (portalConfig.generatedModules || []).find((item) => item.id === moduleId),
        [moduleId],
    )
    const [rows, setRows] = useState<GeneratedRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [total, setTotal] = useState(0)
    const [search, setSearch] = useState("")
    const [sortBy, setSortBy] = useState("created_at")
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC")
    const [isFormOpen, setFormOpen] = useState(false)
    const [editItem, setEditItem] = useState<GeneratedRecord | null>(null)
    const [deleteItem, setDeleteItem] = useState<GeneratedRecord | null>(null)
    const [draft, setDraft] = useState<Record<string, unknown>>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState("")

    const endpoint = module ? `/api/v1/generated/${module.id}` : ""

    const columns = useMemo<DataTableColumn<GeneratedRecord>[]>(() => {
        if (!module) return []
        const keys = module.listColumns?.length
            ? module.listColumns
            : module.fields.slice(0, 5).map((field) => field.key)

        return keys
            .map((key) => module.fields.find((field) => field.key === key))
            .filter(Boolean)
            .map((field) => ({
                id: field!.key,
                header: field!.label,
                accessorKey: field!.key,
                sortable: module.tableFeatures?.sort !== false,
                cell: (row) => <span>{displayValue(row[field!.key], field)}</span>,
            }))
    }, [module])

    const loadRows = useCallback(async () => {
        if (!module) return
        setLoading(true)
        try {
            const result = await api.get<{
                items: GeneratedRecord[]
                total: number
                page: number
                limit: number
            }>(endpoint, {
                params: { page, limit, search, sortBy, sortOrder },
            })
            setRows(result.data.items || [])
            setTotal(result.data.total || 0)
        } finally {
            setLoading(false)
        }
    }, [endpoint, limit, module, page, search, sortBy, sortOrder])

    useEffect(() => {
        void loadRows()
    }, [loadRows])

    function openCreate() {
        if (!module) return
        setEditItem(null)
        setDraft(initialValues(module))
        setSubmitError("")
        setFormOpen(true)
    }

    function openEdit(row: GeneratedRecord) {
        if (!module) return
        setEditItem(row)
        setDraft({ ...initialValues(module), ...row })
        setSubmitError("")
        setFormOpen(true)
    }

    async function submitForm() {
        if (!module) return
        setSubmitting(true)
        setSubmitError("")
        try {
            const payload = normalizeDraft(module, draft)
            if (editItem) {
                await api.patch(`${endpoint}/${editItem.id}`, payload)
            } else {
                await api.post(endpoint, payload)
            }
            setFormOpen(false)
            await loadRows()
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Could not save record.")
        } finally {
            setSubmitting(false)
        }
    }

    async function confirmDelete() {
        if (!deleteItem) return
        setSubmitting(true)
        try {
            await api.delete(`${endpoint}/${deleteItem.id}`)
            setDeleteItem(null)
            await loadRows()
        } finally {
            setSubmitting(false)
        }
    }

    if (!module) {
        return (
            <div className="p-6 lg:p-8">
                <h1 className="text-2xl font-bold tracking-tight">Module not found</h1>
                <p className="mt-2 text-muted-foreground">This generated module is not available in portal-config.json.</p>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <header className="flex shrink-0 flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:pb-4 lg:pt-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{module.pluralName}</h1>
                    <p className="text-muted-foreground">Manage {module.pluralName.toLowerCase()} records.</p>
                </div>
                <Button variant="gradient" className="gap-2" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add {module.singularName}
                </Button>
            </header>

            <div className="min-h-0 flex-1 px-6 pb-0 lg:px-8">
                <DataTable
                    data={rows}
                    columns={columns}
                    loading={loading}
                    rowKey="id"
                    page={page}
                    pageSize={limit}
                    total={total}
                    onPageChange={setPage}
                    onPageSizeChange={setLimit}
                    onSearch={(value) => {
                        setPage(1)
                        setSearch(value)
                    }}
                    searchValue={search}
                    onSort={(column, order) => {
                        setSortBy(column)
                        setSortOrder(order)
                    }}
                    fillHeight
                    emptyMessage={`No ${module.pluralName.toLowerCase()} found.`}
                    onRowClick={openEdit}
                    renderRowActions={(row) => (
                        <RowActions
                            row={row}
                            onEdit={openEdit}
                            onDelete={setDeleteItem}
                        />
                    )}
                />
            </div>

            <FormModal
                isOpen={isFormOpen}
                onClose={() => setFormOpen(false)}
                title={`${editItem ? "Edit" : "Add"} ${module.singularName}`}
                subtitle={module.pluralName}
                icon={Database}
                isSubmitting={submitting}
                canSubmit={!submitting}
                onSubmit={submitForm}
                submitError={submitError}
                submitLabel={editItem ? "Save Changes" : `Add ${module.singularName}`}
                maxWidth="max-w-[720px]"
            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {module.fields.map((field) => (
                        <label
                            key={field.key}
                            className={`space-y-1.5 ${field.width === "full" ? "md:col-span-2" : ""}`}
                        >
                            <span className="text-sm font-medium text-foreground">
                                {field.label}
                                {field.required && <span className="text-destructive"> *</span>}
                            </span>
                            <FieldControl
                                field={field}
                                value={draft[field.key]}
                                onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                            />
                            {field.helpText && (
                                <span className="block text-xs text-muted-foreground">
                                    {field.helpText}
                                </span>
                            )}
                        </label>
                    ))}
                </div>
            </FormModal>

            <ConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={confirmDelete}
                isConfirming={submitting}
                title={`Delete ${module.singularName}`}
                entityName={displayValue(deleteItem?.[columns[0]?.id || "id"]) || module.singularName}
            />
        </div>
    )
}
