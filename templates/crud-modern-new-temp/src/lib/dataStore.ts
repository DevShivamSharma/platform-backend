import { supabase, requireSupabase, isSupabaseConfigured } from "./supabaseClient";

/** How a filter value is applied against its column. */
export type FilterOp = "eq" | "in" | "date";

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  searchColumns?: string[];
  sortColumn?: string | null;
  sortDirection?: "asc" | "desc";
  filters?: Record<string, string>;
  /** Per-key operator; defaults to "eq" when not specified. */
  filterTypes?: Record<string, FilterOp>;
}

export interface ListResult<T> {
  data: T[];
  totalRecords: number;
  totalPages: number;
  page: number;
}

export interface BreakdownItem {
  label: string;
  count: number;
}

export interface TrendPoint {
  label: string;
  count: number;
}

const DEFAULT_PAGE_SIZE = 10;

export async function getRecords<T = Record<string, unknown>>(
  table: string,
  params: ListParams = {}
): Promise<ListResult<T>> {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search = "",
    searchColumns = [],
    sortColumn,
    sortDirection = "asc",
    filters = {},
    filterTypes = {},
  } = params;

  if (!isSupabaseConfigured || !supabase) {
    return { data: [], totalRecords: 0, totalPages: 1, page: 1 };
  }

  let query = supabase.from(table).select("*", { count: "exact" });

  for (const [key, value] of Object.entries(filters)) {
    if (value === "" || value == null) continue;
    const op = filterTypes[key] ?? "eq";

    if (op === "in") {
      const values = value.split(",").map((item) => item.trim()).filter(Boolean);
      if (values.length) query = query.in(key, values);
    } else if (op === "date") {
      // Match a single calendar day even when the column stores timestamps.
      const day = value.slice(0, 10);
      const next = new Date(`${day}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      query = query.gte(key, day).lt(key, next.toISOString().slice(0, 10));
    } else {
      query = query.eq(key, value);
    }
  }

  const term = search.trim();
  if (term && searchColumns.length) {
    query = query.or(searchColumns.map((column) => `${column}.ilike.%${term}%`).join(","));
  }

  if (sortColumn) {
    query = query.order(sortColumn, { ascending: sortDirection === "asc" });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;

  const totalRecords = count ?? 0;
  return {
    data: (data ?? []) as T[],
    totalRecords,
    totalPages: Math.max(1, Math.ceil(totalRecords / pageSize)),
    page,
  };
}

export async function getRecord<T = Record<string, unknown>>(
  table: string,
  id: string
): Promise<T | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
  if (error) throw error;
  return (data ?? null) as T | null;
}

export async function createRecord<T = Record<string, unknown>>(
  table: string,
  payload: Record<string, unknown>
): Promise<T> {
  const client = requireSupabase();
  const { data, error } = await client.from(table).insert(payload).select().single();
  if (error) throw error;
  return data as T;
}

export async function updateRecord<T = Record<string, unknown>>(
  table: string,
  id: string,
  payload: Record<string, unknown>
): Promise<T> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(table)
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as T;
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function countRecords(
  table: string,
  filters: Record<string, string> = {}
): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "" && value != null) query = query.eq(key, value);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function sumColumn(table: string, column: string, limit = 5000): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { data, error } = await supabase.from(table).select(column).limit(limit);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => {
    const value = Number((row as unknown as Record<string, unknown>)[column]);
    return Number.isNaN(value) ? sum : sum + value;
  }, 0);
}

export async function getBreakdown(
  table: string,
  column: string,
  options: string[] = [],
  limit = 5000
): Promise<BreakdownItem[]> {
  if (!isSupabaseConfigured || !supabase) return options.map((label) => ({ label, count: 0 }));
  const { data, error } = await supabase.from(table).select(column).limit(limit);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const value = String((row as unknown as Record<string, unknown>)[column] ?? "");
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const ordered = options.length ? options : Array.from(counts.keys());
  return ordered.map((label) => ({ label, count: counts.get(label) ?? 0 }));
}

export async function getCreatedAtTrend(
  table: string,
  days = 14
): Promise<TrendPoint[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from(table)
    .select("created_at")
    .gte("created_at", start.toISOString())
    .limit(5000);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    counts.set(date.toISOString().slice(0, 10), 0);
  }

  for (const row of data ?? []) {
    const key = String((row as Record<string, unknown>).created_at ?? "").slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}
