import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function ToggleInput({ id, value, onChange, config }: FieldComponentProps) {
  const on = value === true || value === "true";
  const labels = config.options?.length === 2
    ? [config.options[1].label, config.options[0].label]
    : ["Active", "Inactive"];

  return (
    <div className="flex items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        disabled={config.disabled}
        onClick={() => onChange(!on)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50",
          on ? "bg-primary" : "bg-muted-foreground/30"
        )}
        style={on ? { background: "var(--primary)" } : undefined}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
            on ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
      <span className={cn("text-sm font-medium", on ? "text-foreground" : "text-muted-foreground")}>
        {on ? labels[0] : labels[1]}
      </span>
    </div>
  );
}
