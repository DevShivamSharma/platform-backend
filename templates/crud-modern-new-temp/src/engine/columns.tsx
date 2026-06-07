import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GeneratedModule, GeneratedFieldConfig } from "@/lib/config.types";
import { cn, formatCurrency, formatDate, formatDateTime, formatTime, humanize } from "@/lib/utils";

type Row = Record<string, unknown>;

const searchableTypes = new Set(["text", "email", "phone", "select"]);

function renderStatusCell(field: GeneratedFieldConfig, value: string) {
  if (!value) return <span className="text-muted-foreground">-</span>;
  const options = field.options ?? [];
  const optionIndex = Math.max(0, options.indexOf(value));
  const opacity = 0.08 + (optionIndex % 4) * 0.04;

  return (
    <Badge
      variant="outline"
      className="gap-1.5 whitespace-nowrap border-primary/25 font-medium text-foreground"
      style={{ backgroundColor: `color-mix(in srgb, var(--primary) ${opacity * 100}%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {humanize(value)}
    </Badge>
  );
}

function renderArray(value: unknown) {
  const arr = Array.isArray(value) ? (value as string[]) : [];
  if (!arr.length) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {arr.slice(0, 2).map((item) => (
        <span key={item} className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium">
          {item}
        </span>
      ))}
      {arr.length > 2 && <span className="text-[11px] text-muted-foreground">+{arr.length - 2}</span>}
    </div>
  );
}

function renderCell(field: GeneratedFieldConfig, value: unknown) {
  switch (field.type) {
    case "select":
    case "radio":
      return renderStatusCell(field, String(value ?? ""));
    case "phone": {
      const digits = String(value ?? "").replace(/\D/g, "");
      if (!digits) return <span className="text-muted-foreground">-</span>;
      const formatted = digits.length <= 5
        ? digits
        : digits.length <= 10
          ? `${digits.slice(0, 5)} ${digits.slice(5)}`
          : `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
      return <span className="tabular-nums">{formatted}</span>;
    }
    case "email":
      return value ? (
        <span className="text-muted-foreground">{String(value).toLowerCase()}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    case "url":
      return value ? (
        <a href={String(value)} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[200px] block">
          {String(value).replace(/^https?:\/\//, "")}
        </a>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    case "currency":
      return <span className="font-medium tabular-nums">{formatCurrency(value)}</span>;
    case "percentage":
      return value == null || value === "" ? (
        <span className="text-muted-foreground">-</span>
      ) : (
        <span className="tabular-nums">{Number(value)}%</span>
      );
    case "date":
      return <span className="text-muted-foreground">{formatDate(value)}</span>;
    case "time":
      return <span className="text-muted-foreground">{formatTime(value)}</span>;
    case "datetime":
      return <span className="text-muted-foreground">{formatDateTime(value)}</span>;
    case "checkbox":
    case "toggle":
      return value === true || value === "true" ? (
        <CheckCircle2 className="h-4 w-4 text-primary" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground/40" />
      );
    case "tags":
    case "multi-select":
    case "checkbox-group":
      return renderArray(value);
    case "image":
    case "avatar":
      return value ? (
        <img src={String(value)} alt="" className="h-8 w-8 rounded-md border object-cover" />
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    case "address":
    case "json":
      return <span className="text-muted-foreground">{value ? "JSON" : "-"}</span>;
    default: {
      const text = value == null || value === "" ? "-" : String(value);
      return <span className={cn(text === "-" && "text-muted-foreground")}>{text}</span>;
    }
  }
}

export function buildColumns(module: GeneratedModule): ColumnDef<Row, unknown>[] {
  const fieldMap = new Map(module.fields.map((field) => [field.key, field]));
  const sortable = module.tableFeatures.sort;

  return module.listColumns.map((key) => {
    const field = fieldMap.get(key);
    return {
      accessorKey: key,
      header: field?.label ?? humanize(key),
      enableSorting: sortable,
      cell: ({ getValue }) =>
        field ? renderCell(field, getValue()) : String(getValue() ?? "-"),
    } satisfies ColumnDef<Row, unknown>;
  });
}

export function searchColumns(module: GeneratedModule): string[] {
  const fieldMap = new Map(module.fields.map((field) => [field.key, field]));
  const searchableColumn = module.listColumns
    .map((key) => fieldMap.get(key))
    .find((field) => field && searchableTypes.has(field.type));

  return searchableColumn ? [searchableColumn.key] : [];
}
