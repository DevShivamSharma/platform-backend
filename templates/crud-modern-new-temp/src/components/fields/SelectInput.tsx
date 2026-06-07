import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { humanize } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function SelectInput({ id, value, onChange, config, error }: FieldComponentProps) {
  return (
    <Select value={(value as string) ?? ""} onValueChange={onChange} disabled={config.disabled}>
      <SelectTrigger id={id} className={cn("w-full", error && "border-destructive")}>
        <SelectValue placeholder={config.placeholder || `Select ${config.label}`} />
      </SelectTrigger>
      <SelectContent>
        {(config.options ?? []).map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {humanize(opt.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
