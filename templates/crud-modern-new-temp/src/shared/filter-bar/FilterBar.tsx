import {useEffect, useMemo, useState} from "react";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Search, Filter} from "lucide-react";
import {cn} from "@/lib/utils";
import {Badge} from "@/components/ui/badge";
import {DatePicker} from "@/components/ui/date-picker";
import {DateRangePicker} from "@/components/ui/date-range-picker";
import {AnimatedFilterContainer} from "./AnimatedFilterContainer";
import {FilterPill} from "./FilterPill";
import type {FilterField} from "./filter-bar.types";
import type {ReactNode} from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface FilterBarProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
  children?: ReactNode;
  resultCount?: number;
  sidePanel?: boolean;
  sidePanelTitle?: string;
}

export function FilterBar({
  fields,
  values,
  onChange,
  onClear,
  children,
  resultCount,
  sidePanel = false,
  sidePanelTitle = "Filters",
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValues, setDraftValues] =
    useState<Record<string, string>>(values);

  useEffect(() => {
    if (!sidePanel) return;
    if (isOpen) setDraftValues(values);
  }, [values, isOpen, sidePanel]);

  // Calculate active filters count (excluding empty values)
  const activeFilters = Object.entries(values).filter(
    ([_, v]) => v && v.trim() !== "",
  );
  const hasActiveFilters = activeFilters.length > 0;
  const activeCount = activeFilters.length;

  const allFilterKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const f of fields) {
      if (f.type === "date-range") {
        keys.add(f.fromKey || `${f.key}_from`);
        keys.add(f.toKey || `${f.key}_to`);
      } else {
        keys.add(f.key);
      }
    }
    // include any existing keys in `values` so we can clear them on apply if needed
    for (const k of Object.keys(values)) keys.add(k);
    return Array.from(keys);
  }, [fields, values]);

  const handleDraftChange = (key: string, value: string) => {
    setDraftValues((prev) => ({...prev, [key]: value}));
  };

  const applyDraft = () => {
    // Apply in a stable order to avoid subtle state overwrite issues
    for (const key of allFilterKeys) {
      const next = (draftValues[key] ?? "").toString();
      const prev = (values[key] ?? "").toString();
      if (next !== prev) onChange(key, next);
    }
    setIsOpen(false);
  };

  const clearDraft = () => {
    onClear();
    setDraftValues({});
    setIsOpen(false);
  };

  const renderedFields = (
    currentValues: Record<string, string>,
    changeFn: (key: string, value: string) => void,
  ) => (
    <div className="grid grid-cols-1 gap-5 py-3 lg:grid-cols-5">
      {fields.map((field) => {
        if (field.type === "text") {
          return (
            <div
              key={field.key}
              className={cn("space-y-1.5", field.className)}>
              <label className="text-xs font-semibold text-muted-foreground/70">
                {field.label}
              </label>
              <Input
                placeholder={field.placeholder || field.label}
                value={currentValues[field.key] || ""}
                onChange={(e) => changeFn(field.key, e.target.value)}
                className="h-10 border-neutral-200 bg-neutral-50 px-3 transition-colors focus:border-primary focus:bg-white"
              />
            </div>
          );
        }

        if (field.type === "select") {
          return (
            <div
              key={field.key}
              className={cn("space-y-1.5", field.className)}>
              <label className="text-xs font-semibold text-muted-foreground/70">
                {field.label}
              </label>
              <Select
                value={currentValues[field.key] || ""}
                onValueChange={(v) =>
                  changeFn(field.key, v === "__all__" ? "" : v)
                }>
                <SelectTrigger className="h-10 border-neutral-200 bg-neutral-50 px-3 transition-colors focus:border-primary focus:bg-white">
                  <SelectValue
                    placeholder={field.placeholder || `All ${field.label}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  {field.options?.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (field.type === "date") {
          return (
            <div
              key={field.key}
              className={cn("space-y-1.5", field.className)}>
              <label className="text-xs font-semibold text-muted-foreground/70">
                {field.label}
              </label>
              <DatePicker
                value={currentValues[field.key] || ""}
                onChange={(v) => changeFn(field.key, v)}
                buttonClassName="h-10 border-neutral-200 bg-neutral-50 px-3 transition-colors hover:bg-white"
              />
            </div>
          );
        }

        if (field.type === "date-range") {
          return (
            <div
              key={field.key}
              className={cn("space-y-1.5", field.className)}>
              <label className="text-xs font-semibold text-muted-foreground/70">
                {field.label} Range
              </label>
              <DateRangePicker
                value={{
                  from:
                    currentValues[field.fromKey || `${field.key}_from`] || "",
                  to: currentValues[field.toKey || `${field.key}_to`] || "",
                }}
                onChange={({from, to}) => {
                  changeFn(field.fromKey || `${field.key}_from`, from || "");
                  changeFn(field.toKey || `${field.key}_to`, to || "");
                }}
                buttonClassName="h-10 border-neutral-200 bg-neutral-50 px-3 transition-colors hover:bg-white"
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-0 transition-all">
      {/* Top Bar: Controls & Actions */}
      <div className="flex items-center justify-between gap-4 py-2">
        {/* Left: Search & Filter Toggle */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted/50">
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "h-9 gap-2 rounded-lg px-3 font-medium transition-all hover:bg-muted/50",
              isOpen && "bg-muted text-foreground",
            )}>
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-0.5 h-5 min-w-5 px-1 text-[10px] font-bold">
                {activeCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">{children}</div>
      </div>

      {/* Filters UI: Collapsible panel (default) OR side panel sheet */}
      {!sidePanel ? (
        <AnimatedFilterContainer isOpen={isOpen}>
          {renderedFields(values, onChange)}
        </AnimatedFilterContainer>
      ) : (
        <Sheet
          open={isOpen}
          onOpenChange={setIsOpen}>
          <SheetContent
            side="right"
            className="flex h-full w-[520px] flex-col p-0 sm:max-w-[520px]">
            <SheetHeader className="shrink-0 border-b">
              <SheetTitle>{sidePanelTitle}</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {renderedFields(draftValues, handleDraftChange)}
            </div>
            <SheetFooter className="shrink-0 border-t">
              <div className="flex w-full items-center justify-between gap-2">
                <Button
                  variant="clear"
                  onClick={clearDraft}>
                  Clear all
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="clear"
                    onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={applyDraft}>Apply</Button>
                </div>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* Active Filters Row (Outside Panel) */}
      <div
        aria-hidden={!hasActiveFilters}
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out",
          hasActiveFilters
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}>
        <div className="min-h-0 ">
          {/* Two-zone row: scrollable pills LEFT, fixed actions RIGHT */}
          <div
            className={cn(
              "flex items-center gap-3 py-2",
              !hasActiveFilters && "pointer-events-none",
            )}>
            {/* Scrollable pills zone — grows but never overflows */}
            <div
              className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{scrollbarWidth: "none"}}>
              {activeFilters.map(([key, value]) => {
                const field = fields.find(
                  (f) =>
                    f.key === key ||
                    (f.type === "date-range" &&
                      (f.fromKey === key ||
                        f.toKey === key ||
                        `${f.key}_from` === key ||
                        `${f.key}_to` === key)),
                );

                let displayValue = value;
                if (field?.type === "select" && field.options) {
                  const option = field.options.find((o) => o.value === value);
                  if (option) displayValue = option.label;
                }

                return (
                  <FilterPill
                    key={key}
                    label={field?.label || key}
                    value={displayValue}
                    onRemove={() => onChange(key, "")}
                  />
                );
              })}
            </div>

            {/* Fixed actions — always visible on the right */}
            <div className="flex shrink-0 items-center gap-3">
              {resultCount !== undefined && (
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {resultCount} results
                </span>
              )}
              <Button
                variant="clear"
                size="sm"
                onClick={onClear}
                className="h-auto whitespace-nowrap p-0 text-xs font-medium text-muted-foreground hover:text-foreground">
                Clear all
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
