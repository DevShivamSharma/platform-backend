import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fieldRegistry } from "@/engine/fieldRegistry";
import type { FieldComponentProps } from "./form.types";

/**
 * Label chrome + dispatch to the registered field component. Keeps the visual
 * frame (label, required mark) consistent for every field type.
 */
export function FormFieldComponent({ id, config, value, onChange, error }: FieldComponentProps) {
  const Component = fieldRegistry[config.type];

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className={cn(
          "text-[13px] font-medium",
          error ? "text-destructive" : "text-foreground/80 dark:text-slate-300"
        )}
      >
        <span className="inline-flex items-center gap-1 align-middle">
          <span>{config.label}</span>
          {config.required && <span className="leading-none text-primary align-middle">*</span>}
        </span>
      </Label>

      {Component ? (
        <Component id={id} config={config} value={value} onChange={onChange} error={error} />
      ) : (
        // Fallback for password / datetime-local
        <Input
          id={id}
          type={config.type === "password" ? "password" : "text"}
          placeholder={config.placeholder || config.label}
          disabled={config.disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={cn(error && "border-destructive")}
        />
      )}
    </div>
  );
}
