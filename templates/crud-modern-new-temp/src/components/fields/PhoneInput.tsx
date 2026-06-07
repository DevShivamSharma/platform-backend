import { useState } from "react";
import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 5) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7, 12)}`;
}

export function PhoneInput({ id, value, onChange, config, error }: FieldComponentProps) {
  const raw = (value as string) ?? "";
  const [focused, setFocused] = useState(false);
  const display = focused ? raw : formatPhone(raw);

  return (
    <div className="relative">
      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        maxLength={14}
        placeholder={config.placeholder || "+91 98765 43210"}
        disabled={config.disabled}
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/[^\d+]/g, "").slice(0, 12))}
        className={cn("pl-9 transition-shadow focus-visible:ring-2", error && "border-destructive")}
      />
    </div>
  );
}
