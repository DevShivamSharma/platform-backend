import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function PercentageInput({ id, value, onChange, config, error }: FieldComponentProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={config.placeholder || "0"}
        disabled={config.disabled}
        value={(value as string | number) ?? ""}
        onKeyDown={(e) => {
          if (
            !/[\d.]/.test(e.key) &&
            !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) &&
            !e.ctrlKey && !e.metaKey
          ) {
            e.preventDefault();
          }
        }}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") { onChange(""); return; }
          // Allow up to 2 decimal places
          if (!/^\d*\.?\d{0,2}$/.test(v)) return;
          const n = Number(v);
          if (n > 100) return;
          onChange(v.includes(".") ? v : (v === "" ? "" : n));
        }}
        onBlur={() => {
          if (value === "" || value == null) return;
          const n = Math.min(100, Math.max(0, Number(value)));
          onChange(Number.isNaN(n) ? "" : n);
        }}
        className={cn("pr-9 transition-shadow focus-visible:ring-2", error && "border-destructive")}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        %
      </span>
    </div>
  );
}
