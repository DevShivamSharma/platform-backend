"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GlobalFilterConfig, GlobalFilterField } from "./global-filter.types";
import type { FilterFieldOption } from "./filter-bar.types";

// Custom CirclePlus icon
function CirclePlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

/** Normalize stored date (ISO or YYYY-MM-DD) to yyyy-mm-dd for input[type="date"]. */
function toDateInputValue(value: string): string {
  if (!value || typeof value !== "string") return "";
  const datePart = value.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function splitCsv(value: string): string[] {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function joinCsv(values: string[]): string {
  return values.map((v) => v.trim()).filter(Boolean).join(",");
}

function toggleCsvValue(current: string, value: string): string {
  const values = splitCsv(current);
  const isSelected = values.includes(value);
  const nextValues = isSelected
    ? values.filter((item) => item !== value)
    : [...values, value];
  return joinCsv(nextValues);
}

const chipBase =
  "inline-flex shrink-0 max-h-[37px] items-center gap-2 rounded-[calc(0.75rem-2px)] border border-dashed border-border bg-background px-3 py-2 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:bg-muted/50";

// ─── Multi-select dropdown with inline search ─────────────────────────────────

interface MultiSelectDropdownProps {
  field: GlobalFilterField & { options: FilterFieldOption[] };
  value: string;
  onChange: (key: string, value: string) => void;
}

function MultiSelectDropdown({ field, value, onChange }: MultiSelectDropdownProps) {
  const [search, setSearch] = useState("");
  const options = field.options;
  const selectedValues = splitCsv(value);
  const selectedLabels = options
    .filter((o) => selectedValues.includes(o.value))
    .map((o) => o.label);

  const displayLabel =
    selectedLabels.length === 0
      ? field.label
      : selectedLabels.length === 1
      ? selectedLabels[0]
      : `${field.label} (${selectedLabels.length})`;

  const filteredOptions = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <DropdownMenu onOpenChange={(open) => !open && setSearch("")}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            chipBase,
            "w-auto justify-start border-dashed",
            selectedValues.length > 0 && "border-primary/40 bg-primary/5"
          )}
        >
          <CirclePlusIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="max-w-[190px] truncate">{displayLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 rounded-xl border border-border/50 bg-background p-0 shadow-lg">
        {/* Search input */}
        <div className="p-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm shadow-none placeholder:text-muted-foreground/60 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        {/* Scrollable options list */}
        <div className="max-h-52 overflow-y-auto px-1 pb-1">
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground/70">No results found</p>
          ) : (
            filteredOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={`${field.key}-${option.value}`}
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() =>
                  onChange(field.key, toggleCsvValue(value, option.value))
                }
                onSelect={(e) => e.preventDefault()}
                className="rounded-md text-sm"
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </div>
        {/* Clear button */}
        <div className="border-t border-border/50 p-1.5">
          <DropdownMenuItem
            disabled={selectedValues.length === 0}
            onSelect={() => onChange(field.key, "")}
            className="justify-center rounded-md py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-[#FFEDEC] hover:bg-[#FFEDEC]/90"
          >
            Clear
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Single-select dropdown with inline search ────────────────────────────────

interface SingleSelectDropdownProps {
  field: GlobalFilterField & { options: FilterFieldOption[] };
  value: string;
  onChange: (key: string, value: string) => void;
}

function SingleSelectDropdown({ field, value, onChange }: SingleSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const options = field.options;
  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (v: string) => {
    onChange(field.key, v);
    setOpen(false);
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            chipBase,
            "w-auto justify-start border-dashed",
            value && "border-primary/40 bg-primary/5"
          )}
        >
          <CirclePlusIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="max-w-[190px] truncate">
            {selectedOption?.label ?? field.label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 rounded-xl border border-border/50 bg-background p-0 shadow-lg">
        {/* Search input */}
        <div className="p-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm shadow-none placeholder:text-muted-foreground/60 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
        {/* Options list */}
        <div className="max-h-52 overflow-y-auto px-1 pb-2">
          <DropdownMenuItem
            onSelect={() => handleSelect("")}
            className={cn("rounded-md text-sm", !value && "font-medium")}
          >
            All {field.label}
          </DropdownMenuItem>
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground/70">No results found</p>
          ) : (
            filteredOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => handleSelect(opt.value)}
                className={cn("rounded-md text-sm", opt.value === value && "font-medium")}
              >
                {opt.label}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface GlobalFilterBarProps<F extends Record<string, string> = Record<string, string>> {
  config: GlobalFilterConfig<F>;
  values: F;
  /** Called once when user clicks "Apply Filters" — batch update, single API call. */
  onApply: (values: F) => void;
  onClear: () => void;
  resultCount?: number;
  className?: string;
}

export function GlobalFilterBar<F extends Record<string, string>>({
  config,
  values,
  onApply,
  onClear,
  className,
}: GlobalFilterBarProps<F>) {
  const { filterFields } = config;

  // Draft state — controls update this locally; API fires only on Apply.
  const [draftValues, setDraftValues] = useState<F>({ ...values });

  // Sync draft when external values change (e.g. after apply or clear).
  useEffect(() => {
    setDraftValues({ ...values });
  }, [values]);

  const handleDraftChange = (key: string, value: string) => {
    setDraftValues((prev) => ({ ...prev, [key]: value } as F));
  };

  return (
    <div className={cn("flex flex-nowrap items-center gap-2", className)}>
      {filterFields.map((field) => {
        const fromKey = field.fromKey ?? `${field.key}_from`;
        const toKey = field.toKey ?? `${field.key}_to`;
        const fromVal = draftValues[fromKey] ?? "";
        const toVal = draftValues[toKey] ?? "";
        const singleVal = draftValues[field.key] ?? "";

        if (field.type === "text") {
          // Primary search input — fixed width so other filters stay on same row
          if (field.key === "filter") {
            return (
              <div key={field.key} className="min-w-[140px] w-[180px] shrink-0">
                <Input
                  type="text"
                  placeholder={field.placeholder ?? field.label}
                  value={singleVal}
                  onChange={(e) => handleDraftChange(field.key, e.target.value)}
                  className="h-11 rounded-2xl border border-input bg-background px-4 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-ring/30"
                  aria-label={field.label}
                />
              </div>
            );
          }

          // Other text filters — chip style
          return (
            <div key={field.key} className={cn(chipBase, "gap-2 overflow-hidden")}>
              <CirclePlusIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <Input
                type="text"
                placeholder={field.placeholder ?? field.label}
                value={singleVal}
                onChange={(e) => handleDraftChange(field.key, e.target.value)}
                className="h-7 w-36 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                aria-label={field.label}
              />
            </div>
          );
        }

        if (field.type === "select") {
          const options = field.options ?? [];
          if (field.multi) {
            return (
              <MultiSelectDropdown
                key={field.key}
                field={{ ...field, options }}
                value={singleVal}
                onChange={handleDraftChange}
              />
            );
          }
          return (
            <SingleSelectDropdown
              key={field.key}
              field={{ ...field, options }}
              value={singleVal}
              onChange={handleDraftChange}
            />
          );
        }

        if (field.type === "date-range") {
          return (
            <DateRangePicker
              key={field.key}
              value={{
                from: toDateInputValue(fromVal),
                to: toDateInputValue(toVal),
              }}
              onChange={(range) => {
                handleDraftChange(fromKey, range.from || "");
                handleDraftChange(toKey, range.to || "");
              }}
              emptyLabel={field.label}
              buttonClassName={cn(
                chipBase,
                "w-auto min-w-[160px] shrink-0 justify-between border-dashed px-3 font-medium",
                (fromVal || toVal) && "border-primary/40 bg-primary/5"
              )}
            />
          );
        }

        if (field.type === "date") {
          return (
            <DatePicker
              key={field.key}
              value={toDateInputValue(singleVal)}
              onChange={(value) => handleDraftChange(field.key, value || "")}
              placeholder={field.label}
              buttonClassName={cn(
                chipBase,
                "w-auto min-w-[170px] justify-between border-dashed px-4 font-medium",
                singleVal && "border-primary/40 bg-primary/5"
              )}
            />
          );
        }

        return null;
      })}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          variant="clear"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDraftValues({ ...config.defaultValues } as F);
            onClear();
          }}
        >
          Clear
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={() => onApply(draftValues)}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
