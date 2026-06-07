import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { SortConfig } from "./data-table.types";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  isLoading?: boolean;
  sort?: SortConfig | null;
  onSort?: (sort: SortConfig) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string | null;
  /** When true, table has no outer border/rounded (e.g. inside toolbar+table card) */
  embedded?: boolean;
  /** When true, table fills its parent's height and scrolls internally (no min/max). */
  fill?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  sort,
  onSort,
  onRowClick,
  emptyMessage = "No results found.",
  embedded = false,
  fill = false,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const handleSort = (columnId: string) => {
    if (!onSort) return;
    const newDirection =
      sort?.column === columnId && sort.direction === "asc" ? "desc" : "asc";
    onSort({ column: columnId, direction: newDirection });
  };

  const getSortIcon = (columnId: string) => {
    if (sort?.column !== columnId) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sort.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const columnCount = columns.length;
  const skeletonRows = 6;

  const sizing = fill
    ? "h-full min-h-0"
    : "min-h-[280px] max-h-[calc(100vh-16rem)]";
  const chrome = embedded
    ? "border-t border-border/50"
    : "rounded-lg border border-border/40 bg-background";

  return (
    <div className={`${sizing} overflow-auto scrollbar-table ${chrome}`}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/20 backdrop-blur supports-[backdrop-filter]:bg-muted/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-border/40 hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
                    header.column.getCanSort() && onSort
                      ? "cursor-pointer select-none transition-colors hover:text-foreground"
                      : ""
                  }`}
                  onClick={() => {
                    if (header.column.getCanSort() && onSort) {
                      handleSort(header.column.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && onSort && getSortIcon(header.column.id)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} className="hover:bg-transparent">
                  {Array.from({ length: columnCount }).map((_, cellIndex) => (
                    <TableCell key={cellIndex} className="px-4 py-2.5">
                      <div
                        className="h-5 rounded bg-muted/60 animate-pulse"
                        style={{
                          width: cellIndex === 0 ? "80%" : cellIndex === columnCount - 1 ? "60%" : "70%",
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={`border-b border-border/30 transition-colors hover:bg-muted/20 ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-2.5 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
