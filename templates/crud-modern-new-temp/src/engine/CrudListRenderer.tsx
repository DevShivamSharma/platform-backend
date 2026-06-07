import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Eye, MoreHorizontal, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/shared/components/data-table/DataTable";
import { DataTablePagination } from "@/shared/components/data-table/DataTablePagination";
import { ConfirmDialog } from "@/shared/components/confirm-dialog/ConfirmDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { HorizontalFilterBar } from "@/shared/filter-bar/HorizontalFilterBar";
import { useAuth } from "@/core/auth/auth.context";
import type { GeneratedModule } from "@/lib/config.types";
import { addPath, detailPath, editPath, getDeletePermission, getWritePermission, theme } from "@/lib/config";
import { humanize } from "@/lib/utils";
import { notify } from "@/lib/toast";
import { useCrudList } from "./useCrudList";
import { buildColumns } from "./columns";
import { exportRowsToXlsx } from "./exportXlsx";

type Row = Record<string, unknown>;

export function CrudListRenderer({ module }: { module: GeneratedModule }) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const list = useCrudList(module);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const canWrite = hasPermission(getWritePermission(module));
  const canDelete = hasPermission(getDeletePermission(module));

  const hasFilters = list.filterConfig.filterFields.length > 0;
  const showFilters = module.tableFeatures.filter && hasFilters;
  const activeFilterCount = Object.values(list.filters).filter(
    (value) => value != null && String(value).trim() !== ""
  ).length;

  const handleClearAll = () => {
    list.clearFilters();
    if (list.search) list.setSearch("");
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const cols = module.listColumns.length
      ? module.listColumns
      : Object.keys(list.data[0] ?? {});
    setIsExporting(true);
    try {
      await exportRowsToXlsx({
        fileName: module.tableName,
        sheetName: module.pluralName,
        columns: cols.map((key) => ({ key, header: humanize(key) })),
        rows: list.data as Row[],
        brandColor: theme.primary,
      });
    } catch {
      notify.error("Could not export data");
    } finally {
      setIsExporting(false);
    }
  };

  const columns: ColumnDef<Row, unknown>[] = useMemo(() => {
    const base = buildColumns(module);
    return [
      ...base,
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const record = row.original;
          const id = String(record.id ?? "");
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-lg shadow-lg">
                  <DropdownMenuItem onClick={(event) => { event.stopPropagation(); navigate(detailPath(module, id)); }}>
                    <Eye className="mr-2 h-4 w-4" /> View
                  </DropdownMenuItem>
                  {canWrite && (
                    <DropdownMenuItem onClick={(event) => { event.stopPropagation(); navigate(editPath(module, id)); }}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={(event) => { event.stopPropagation(); setDeleteTarget(record); }}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, [canDelete, canWrite, module, navigate]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await list.remove(String(deleteTarget.id));
      notify.deleted(module.singularName);
    } catch {
      notify.error(`Could not delete ${module.singularName.toLowerCase()}`);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const isEmpty = !list.isLoading && list.data.length === 0 && !list.search;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col gap-4"
    >
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold tracking-tight">{module.pluralName}</h1>
        <p className="text-sm text-muted-foreground">{list.totalRecords} total</p>
      </div>

      {/* Unified toolbar + filters + table card (visually attached, reference style) */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            {module.tableFeatures.search && (
              searchOpen ? (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder={`Search ${module.pluralName.toLowerCase()}...`}
                    value={list.search}
                    onChange={(event) => list.setSearch(event.target.value)}
                    onBlur={() => { if (!list.search) setSearchOpen(false); }}
                    className="h-9 w-56 pl-8 pr-8"
                  />
                  {list.search && (
                    <button
                      type="button"
                      onClick={() => list.setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSearchOpen(true)}
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )
            )}
            {showFilters && (
              <Button
                variant={filtersOpen ? "secondary" : "ghost"}
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setFiltersOpen((open) => !open)}
                title="Toggle filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {module.tableFeatures.export !== false && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5"
                onClick={handleExport}
                disabled={list.data.length === 0 || isExporting}
              >
                <Download className="h-4 w-4" /> {isExporting ? "Exporting…" : "Export"}
              </Button>
            )}
            {canWrite && (
              <Button
                size="sm"
                className="h-9 text-primary-foreground"
                onClick={() => navigate(addPath(module))}
                style={{ background: "var(--primary)" }}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add {module.singularName}
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showFilters && filtersOpen && (
            <motion.div
              key="filter-row"
              initial={{ height: 0, opacity: 0, y: -6 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -6 }}
              transition={{
                type: "spring",
                stiffness: 360,
                damping: 32,
                mass: 0.8,
                opacity: { duration: 0.18 },
              }}
              className="overflow-hidden border-t border-border/40"
            >
              <div className="px-3 py-2.5">
                <HorizontalFilterBar
                  config={list.filterConfig}
                  values={list.filters}
                  onApply={list.applyFilters}
                  onClear={handleClearAll}
                  searchValue={list.search}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isEmpty ? (
          <div className="flex min-h-0 flex-1 items-center justify-center border-t border-border/40 p-6">
            <EmptyState
              title={`No ${module.pluralName.toLowerCase()} yet`}
              description={
                canWrite
                  ? `Get started by adding your first ${module.singularName.toLowerCase()}.`
                  : "No records are available for this module."
              }
              action={
                canWrite ? (
                  <Button onClick={() => navigate(addPath(module))} className="text-primary-foreground" style={{ background: "var(--primary)" }}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add your first {module.singularName.toLowerCase()}
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1">
              <DataTable
                data={list.data}
                columns={columns}
                isLoading={list.isLoading}
                sort={list.sort}
                onSort={module.tableFeatures.sort ? list.setSort : undefined}
                onRowClick={(row) => navigate(detailPath(module, String((row as Row).id)))}
                embedded
                fill
              />
            </div>
            {module.tableFeatures.pagination && (
              <div className="border-t border-border/40">
                <DataTablePagination
                  page={list.page}
                  totalPages={list.totalPages}
                  totalRecords={list.totalRecords}
                  onPageChange={list.setPage}
                  canGoNext={list.page < list.totalPages}
                  canGoPrev={list.page > 1}
                  pageSize={list.pageSize}
                  currentPageSize={list.data.length}
                />
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${module.singularName}`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </motion.div>
  );
}
