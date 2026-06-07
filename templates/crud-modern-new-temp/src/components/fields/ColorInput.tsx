import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function ColorInput({ id, value, onChange, config, error }: FieldComponentProps) {
  const color = (value as string) || "#000000";

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type="color"
        disabled={config.disabled}
        value={color}
        onChange={(event) => onChange(event.target.value)}
        className={cn("h-9 w-12 shrink-0 p-1", error && "border-destructive")}
      />
      <Input
        type="text"
        disabled={config.disabled}
        value={(value as string) ?? ""}
        placeholder={config.placeholder || "#000000"}
        onChange={(event) => onChange(event.target.value)}
        className={cn("transition-shadow focus-visible:ring-2", error && "border-destructive")}
      />
    </div>
  );
}
