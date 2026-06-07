import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function DateTimeInput({ id, value, onChange, config, error }: FieldComponentProps) {
  return (
    <Input
      id={id}
      type="datetime-local"
      disabled={config.disabled}
      value={(value as string) ?? ""}
      onChange={(event) => onChange(event.target.value)}
      className={cn("transition-shadow focus-visible:ring-2", error && "border-destructive")}
    />
  );
}
