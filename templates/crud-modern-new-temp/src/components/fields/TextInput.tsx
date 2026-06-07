import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function TextInput({ id, value, onChange, config, error }: FieldComponentProps) {
  return (
    <Input
      id={id}
      type="text"
      placeholder={config.placeholder || config.label}
      disabled={config.disabled}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={cn("transition-shadow focus-visible:ring-2", error && "border-destructive")}
    />
  );
}
