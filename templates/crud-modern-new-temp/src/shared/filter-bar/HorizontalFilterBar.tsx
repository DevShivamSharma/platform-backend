"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GlobalFilterConfig, GlobalFilterField } from "./global-filter.types";
import type { FilterFieldOption } from "./filter-bar.types";

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

// Filter chip: unselected = dashed border (no black), selected = light green-tint bg + subtle solid border
const filterChipBase =
  "inline-flex h-auto shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-dashed border-muted-foreground/50 bg-background px-3 py-2 text-sm font-medium text-foreground shadow-none transition-colors hover:border-muted-foreground/60 hover:bg-muted/30 hover:text-foreground dark:bg-background dark:hover:bg-muted/30";

const filterChipActive =
  "border-solid border-primary/40 bg-primary/10";

/** Shared chip trigger content: circle with plus + label (Role-style add-filter look) */
function FilterChipTriggerContent({
  label,
  hasValue,
  displayValue,
}: {
  label: string;
  hasValue?: boolean;
  displayValue?: string;
}) {
  return (
    <>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Plus className="h-3.5 w-3.5" />
      </span>
      <span className="max-w-[140px] truncate">
        {hasValue && displayValue ? `${label}: ${displayValue}` : label}
      </span>
    </>
  );
}

// ─── Multi-select dropdown filter pill ─────────────────────────────────────────

interface MultiSelectPillProps {
  field: GlobalFilterField & { options: FilterFieldOption[] };
  value: string;
  onChange: (key: string, value: string) => void;
}

function MultiSelectPill({ field, value, onChange }: MultiSelectPillProps) {
  const [search, setSearch] = useState("");
  const options = field.options;
  const selectedValues = splitCsv(value);
  const selectedLabels = options
    .filter((o) => selectedValues.includes(o.value))
    .map((o) => o.label);

  const displayValue =
    selectedLabels.length === 0
      ? "Select"
      : selectedLabels.length === 1
      ? selectedLabels[0]
      : String(selectedLabels.length);

  const filteredOptions = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const hasValue = selectedValues.length > 0;

  return (
    <DropdownMenu onOpenChange={(open) => !open && setSearch("")}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(filterChipBase, hasValue && filterChipActive)}
        >
          <FilterChipTriggerContent
            label={field.label}
            hasValue={hasValue}
            displayValue={displayValue !== "Select" ? displayValue : undefined}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 rounded-xl border border-border/50 bg-background p-0 shadow-lg"
      >
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
            <p className="px-3 py-3 text-center text-xs text-muted-foreground/70">
              No results found
            </p>
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
        {hasValue && (
          <div className="border-t border-border/50 p-1.5">
            <DropdownMenuItem
              onSelect={() => onChange(field.key, "")}
              className="justify-center rounded-md py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-[#FFEDEC] hover:bg-[#FFEDEC]/90"
            >
              Clear
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Single-select dropdown filter pill ────────────────────────────────────────

interface SingleSelectPillProps {
  field: GlobalFilterField & { options: FilterFieldOption[] };
  value: string;
  onChange: (key: string, value: string) => void;
}

function SingleSelectPill({ field, value, onChange }: SingleSelectPillProps) {
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

  const hasValue = !!value;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(filterChipBase, hasValue && filterChipActive)}
        >
          <FilterChipTriggerContent
            label={field.label}
            hasValue={hasValue}
            displayValue={selectedOption?.label}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 rounded-xl border border-border/50 bg-background p-0 shadow-lg"
      >
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
            All
          </DropdownMenuItem>
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-muted-foreground/70">
              No results found
            </p>
          ) : (
            filteredOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={() => handleSelect(opt.value)}
                className={cn(
                  "rounded-md text-sm",
                  opt.value === value && "font-medium"
                )}
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

// ─── Text input filter pill ────────────────────────────────────────────────────

interface TextInputPillProps {
  field: GlobalFilterField;
  value: string;
  onChange: (key: string, value: string) => void;
}

function TextInputPill({ field, value, onChange }: TextInputPillProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const hasValue = !!value;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(filterChipBase, hasValue && filterChipActive)}
        >
          <FilterChipTriggerContent
            label={field.label}
            hasValue={hasValue}
            displayValue={value || undefined}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 rounded-xl border border-border/50 bg-background p-3 shadow-lg"
      >
        <Input
          placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}...`}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="h-9 rounded-lg border border-border/60 bg-muted/30 px-3 text-sm shadow-none placeholder:text-muted-foreground/60 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onChange(field.key, localValue);
              setIsOpen(false);
            }
          }}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button
            variant="clear"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setLocalValue("");
              onChange(field.key, "");
              setIsOpen(false);
            }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              onChange(field.key, localValue);
              setIsOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Date range filter pill ────────────────────────────────────────────────────

interface DateRangePillProps {
  field: GlobalFilterField;
  fromValue: string;
  toValue: string;
  onChange: (fromKey: string, toKey: string, from: string, to: string) => void;
}

function DateRangePill({ field, fromValue, toValue, onChange }: DateRangePillProps) {
  const fromKey = field.fromKey ?? `${field.key}_from`;
  const toKey = field.toKey ?? `${field.key}_to`;
  const hasValue = !!fromValue || !!toValue;

  return (
    <DateRangePicker
      value={{
        from: toDateInputValue(fromValue),
        to: toDateInputValue(toValue),
      }}
      onChange={(range) => {
        onChange(fromKey, toKey, range.from || "", range.to || "");
      }}
      emptyLabel={field.label}
      triggerStyle="chip"
      buttonClassName={cn(
        filterChipBase,
        "h-auto w-auto",
        hasValue && filterChipActive
      )}
    />
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export interface HorizontalFilterBarProps<
  F extends Record<string, string> = Record<string, string>
> {
  config: GlobalFilterConfig<F>;
  values: F;
  onApply: (values: F) => void;
  onClear: () => void;
  /** Exclude certain filter keys from display (e.g., "filter" for search) */
  excludeKeys?: string[];
  /** When set (e.g. search field), Clear button shows even if no other filters are active */
  searchValue?: string;
  className?: string;
}

export function HorizontalFilterBar<F extends Record<string, string>>({
  config,
  values,
  onApply,
  onClear,
  excludeKeys = [],
  searchValue,
  className,
}: HorizontalFilterBarProps<F>) {
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

  const handleDateRangeChange = (
    fromKey: string,
    toKey: string,
    from: string,
    to: string
  ) => {
    setDraftValues((prev) => ({ ...prev, [fromKey]: from, [toKey]: to } as F));
  };

  // Filter out excluded keys
  const visibleFields = filterFields.filter(
    (field) => !excludeKeys.includes(field.key)
  );

  // Check if any filters have values
  const hasActiveFilters = visibleFields.some((field) => {
    if (field.type === "date-range") {
      const fromKey = field.fromKey ?? `${field.key}_from`;
      const toKey = field.toKey ?? `${field.key}_to`;
      return !!(draftValues[fromKey] || draftValues[toKey]);
    }
    return !!draftValues[field.key];
  });

  // Show Clear when any filter is active OR when search (excluded field) has value
  const hasSearchValue = (searchValue ?? "").trim().length > 0;
  const showClearButton = hasActiveFilters || hasSearchValue;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Scrollable filter pills — hidden scrollbar */}
      <div
        className="flex flex-1 items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {visibleFields.map((field) => {
          const fromKey = field.fromKey ?? `${field.key}_from`;
          const toKey = field.toKey ?? `${field.key}_to`;
          const fromVal = draftValues[fromKey] ?? "";
          const toVal = draftValues[toKey] ?? "";
          const singleVal = draftValues[field.key] ?? "";

          if (field.type === "text") {
            return (
              <TextInputPill
                key={field.key}
                field={field}
                value={singleVal}
                onChange={handleDraftChange}
              />
            );
          }

          if (field.type === "select") {
            const options = field.options ?? [];
            if (field.multi) {
              return (
                <MultiSelectPill
                  key={field.key}
                  field={{ ...field, options }}
                  value={singleVal}
                  onChange={handleDraftChange}
                />
              );
            }
            return (
              <SingleSelectPill
                key={field.key}
                field={{ ...field, options }}
                value={singleVal}
                onChange={handleDraftChange}
              />
            );
          }

          if (field.type === "date-range") {
            return (
              <DateRangePill
                key={field.key}
                field={field}
                fromValue={fromVal}
                toValue={toVal}
                onChange={handleDateRangeChange}
              />
            );
          }

          if (field.type === "date") {
            const hasValue = !!singleVal;
            return (
              <DatePicker
                key={field.key}
                value={toDateInputValue(singleVal)}
                onChange={(value) => handleDraftChange(field.key, value || "")}
                placeholder={field.label}
                triggerStyle="chip"
                buttonClassName={cn(filterChipBase, hasValue && filterChipActive)}
              />
            );
          }

          return null;
        })}
      </div>

      {/* Action buttons - Clear when any filter or search has value; Apply always */}
      <div className="flex shrink-0 items-center gap-1.5 border-l border-border/40 pl-3">
        {showClearButton && (
          <Button
            variant="clear"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setDraftValues({ ...config.defaultValues } as F);
              onClear();
            }}
          >
            Clear
          </Button>
        )}
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => onApply(draftValues)}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
