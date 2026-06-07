export interface SortConfig {
  column: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T> {
  data: T[];
  columns: import("@tanstack/react-table").ColumnDef<T, unknown>[];
  isLoading?: boolean;
  sort?: SortConfig | null;
  onSort?: (sort: SortConfig) => void;
  onRowClick?: (row: T) => void;
}
