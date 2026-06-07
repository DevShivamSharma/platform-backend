import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type { SortConfig } from "@/shared/components/data-table/data-table.types";
import type { GeneratedModule } from "@/lib/config.types";
import { getRecords, deleteRecord as deleteRow, type FilterOp } from "@/lib/dataStore";
import type {
  GlobalFilterConfig,
  GlobalFilterField,
} from "@/shared/filter-bar/global-filter.types";
import { humanize } from "@/lib/utils";
import { searchColumns } from "./columns";

type Row = Record<string, unknown>;

const PAGE_SIZE = 10;

/**
 * Build the horizontal filter-bar config straight from module.fields.
 * Supports select/radio (single), multi-select (multi), and date/datetime.
 */
function buildFilterConfig(module: GeneratedModule): {
  filterConfig: GlobalFilterConfig;
  filterTypes: Record<string, FilterOp>;
} {
  const filterFields: GlobalFilterField[] = [];
  const filterTypes: Record<string, FilterOp> = {};

  for (const field of module.fields) {
    const toOptions = () =>
      (field.options ?? []).map((option) => ({ label: humanize(option), value: option }));

    if ((field.type === "select" || field.type === "radio") && field.options?.length) {
      filterFields.push({ key: field.key, label: field.label, type: "select", options: toOptions() });
      filterTypes[field.key] = "eq";
    } else if (field.type === "multi-select" && field.options?.length) {
      filterFields.push({
        key: field.key,
        label: field.label,
        type: "select",
        multi: true,
        options: toOptions(),
      });
      filterTypes[field.key] = "in";
    } else if (field.type === "date" || field.type === "datetime") {
      filterFields.push({ key: field.key, label: field.label, type: "date" });
      filterTypes[field.key] = "date";
    }
  }

  const defaultValues = Object.fromEntries(filterFields.map((f) => [f.key, ""]));
  return { filterConfig: { filterFields, defaultValues }, filterTypes };
}

export function useCrudList(module: GeneratedModule) {
  const [data, setData] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortConfig | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const reqId = useRef(0);

  const { filterConfig, filterTypes } = useMemo(() => buildFilterConfig(module), [module]);

  const debouncedSearch = useDebounce(search, 300);

  const fetchData = useCallback(async () => {
    const id = ++reqId.current;
    setIsLoading(true);
    try {
      const res = await getRecords(module.tableName, {
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        searchColumns: searchColumns(module),
        sortColumn: sort?.column ?? null,
        sortDirection: sort?.direction ?? "asc",
        filters,
        filterTypes,
      });
      if (id !== reqId.current) return;
      setData(res.data);
      setTotalPages(res.totalPages);
      setTotalRecords(res.totalRecords);
    } catch {
      if (id === reqId.current) setData([]);
    } finally {
      if (id === reqId.current) setIsLoading(false);
    }
  }, [module, page, debouncedSearch, sort, filters, filterTypes]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const applyFilters = useCallback((next: Record<string, string>) => {
    setFilters({ ...next });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await deleteRow(module.tableName, id);
      void fetchData();
    },
    [module.tableName, fetchData]
  );

  return {
    data,
    isLoading,
    search,
    filters,
    sort,
    page,
    totalPages,
    totalRecords,
    pageSize: PAGE_SIZE,
    filterConfig,
    setSearch: onSearch,
    setFilter,
    applyFilters,
    clearFilters,
    setSort,
    setPage,
    refresh: fetchData,
    remove,
  };
}
