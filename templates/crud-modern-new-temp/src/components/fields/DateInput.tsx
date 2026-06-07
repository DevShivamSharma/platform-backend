import { DatePicker } from "@/components/ui/date-picker";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function DateInput({ value, onChange, config }: FieldComponentProps) {
  return (
    <DatePicker
      value={(value as string) ?? ""}
      onChange={(v) => onChange(v)}
      disabled={config.disabled}
    />
  );
}
