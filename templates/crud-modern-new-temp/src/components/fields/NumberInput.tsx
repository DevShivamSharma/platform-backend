import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function NumberInput({ id, value, onChange, config, error }: FieldComponentProps) {
  const num = value === "" || value == null ? "" : Number(value);
  const min = (config as any).validation?.min;
  const max = (config as any).validation?.max;

  const step = (delta: number) => {
    const current = typeof num === "number" ? num : 0;
    let next = current + delta;
    if (min != null && next < min) next = min;
    if (max != null && next > max) next = max;
    onChange(next);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        tabIndex={-1}
        disabled={config.disabled || (min != null && typeof num === "number" && num <= min)}
        onClick={() => step(-1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder={config.placeholder || config.label}
        disabled={config.disabled}
        value={num}
        onKeyDown={(e) => {
          // Allow: digits, decimal, backspace, delete, tab, arrows, minus
          if (
            !/[\d.\-]/.test(e.key) &&
            !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key) &&
            !e.ctrlKey && !e.metaKey
          ) {
            e.preventDefault();
          }
        }}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || v === "-") { onChange(v === "" ? "" : v); return; }
          const n = Number(v);
          if (!Number.isNaN(n)) onChange(n);
        }}
        className={cn("text-center transition-shadow focus-visible:ring-2", error && "border-destructive")}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={config.disabled || (max != null && typeof num === "number" && num >= max)}
        onClick={() => step(1)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
