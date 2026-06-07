import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  /** Page size (e.g. 100). When provided, shows "Showing X–Y of Z records" from API total. */
  pageSize?: number;
  /** Current page row count (for last page). When omitted with pageSize, derived from totalRecords. */
  currentPageSize?: number;
}

export function DataTablePagination({
  page,
  totalPages,
  totalRecords,
  onPageChange,
  canGoNext,
  canGoPrev,
  pageSize,
  currentPageSize,
}: DataTablePaginationProps) {
  const start =
    pageSize != null ? (page - 1) * pageSize + 1 : null;
  const end =
    pageSize != null
      ? currentPageSize != null
        ? (page - 1) * pageSize + currentPageSize
        : Math.min(page * pageSize, totalRecords)
      : null;
  const recordsLabel =
    totalRecords === 0
      ? "Showing 0 of 0 records"
      : start != null && end != null
        ? `Showing ${start}–${end} of ${totalRecords} records`
        : null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {recordsLabel != null && <span>{recordsLabel}</span>}
        <span>Page {page} of {totalPages}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
