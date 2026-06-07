import { Checkbox } from "@/components/ui/checkbox";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function CheckboxInput({ id, value, onChange, config }: FieldComponentProps) {
  return (
    <div className="flex h-9 items-center">
      <Checkbox
        id={id}
        checked={value === true || value === "true"}
        onCheckedChange={(c) => onChange(c === true)}
        disabled={config.disabled}
      />
    </div>
  );
}
