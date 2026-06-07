import { useParams } from "react-router-dom"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { batchStatusConfig } from "@/constants/badge-configs"
import { useBatchDetail } from "@/hooks/use-batch-detail"
import { Skeleton } from "@/components/loading"
import { getItemColumns, BatchDetailHeader } from "@/components/batches/batch-detail-shared"

export default function BatchDetailPage() {
    const { id } = useParams<{ id: string }>()

    const { batch, loading, error, page, limit, setPage, setLimit } = useBatchDetail(id)

    if (loading && !batch) {
        return (
            <div className="p-6 lg:px-8 lg:pt-8 space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
        )
    }

    if (error || !batch) {
        return (
            <div className="p-6 lg:px-8 lg:pt-8">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">{error ?? "Batch not found."}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <header className="p-6 lg:px-8 lg:pt-8 lg:pb-4 shrink-0 space-y-4">
                {/* Title row */}
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">{batch.name}</h1>
                    <StatusBadge status={batch.status} config={batchStatusConfig} />
                </div>

                {/* Batch info */}
                <BatchDetailHeader batch={batch} />
            </header>

            {/* Items list */}
            <div className="flex-1 min-h-0 px-6 lg:px-8 pb-6">
                <h2 className="text-sm font-bold text-foreground mb-3">Items in Batch</h2>
                <DataTable
                    data={batch.items.items}
                    columns={getItemColumns(batch.type)}
                    rowKey="id"
                    loading={loading}
                    fillHeight
                    emptyMessage="No items in this batch."
                    page={page}
                    pageSize={limit}
                    total={batch.items.total}
                    onPageChange={setPage}
                    onPageSizeChange={setLimit}
                />
            </div>

        </div>
    )
}
