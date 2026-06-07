import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

function stringifyValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function JsonInput({ id, value, onChange, config, error }: FieldComponentProps) {
  return (
    <Textarea
      id={id}
      rows={4}
      placeholder={config.placeholder || "{}"}
      disabled={config.disabled}
      value={stringifyValue(value)}
      onChange={(event) => onChange(event.target.value)}
      className={cn("font-mono text-xs transition-shadow focus-visible:ring-2", error && "border-destructive")}
    />
  );
}
