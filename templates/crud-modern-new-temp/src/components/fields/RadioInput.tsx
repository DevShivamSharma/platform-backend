import { Check } from "lucide-react";
import { cn, humanize } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

/** Card-style radio options. */
export function RadioInput({ value, onChange, config }: FieldComponentProps) {
  const current = (value as string) ?? "";
  return (
    <div className="flex flex-wrap gap-2">
      {(config.options ?? []).map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={config.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-all",
              active
                ? "border-primary bg-primary/10 font-medium text-foreground shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            )}
            style={active ? { borderColor: "var(--primary)" } : undefined}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border",
                active ? "border-primary" : "border-muted-foreground/40"
              )}
              style={active ? { borderColor: "var(--primary)" } : undefined}
            >
              {active && <Check className="h-3 w-3" style={{ color: "var(--primary)" }} />}
            </span>
            {humanize(opt.label)}
          </button>
        );
      })}
    </div>
  );
}
