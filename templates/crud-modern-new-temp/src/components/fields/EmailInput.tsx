import { useState, useMemo } from "react";
import { Mail, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailInput({ id, value, onChange, config, error }: FieldComponentProps) {
  const text = (value as string) ?? "";
  const [touched, setTouched] = useState(false);
  const isValid = useMemo(() => EMAIL_RE.test(text), [text]);
  const showValid = touched && text.length > 0;

  return (
    <div className="relative">
      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type="email"
        placeholder={config.placeholder || "name@example.com"}
        disabled={config.disabled}
        value={text}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        onBlur={() => setTouched(true)}
        className={cn(
          "pl-9 pr-9 transition-shadow focus-visible:ring-2",
          error && "border-destructive",
          showValid && isValid && "border-emerald-500/50",
          showValid && !isValid && "border-destructive/50"
        )}
      />
      {showValid && (
        <span className={cn(
          "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2",
          isValid ? "text-emerald-500" : "text-destructive"
        )}>
          {isValid ? <Check className="h-4 w-4" /> : <span className="text-xs">✕</span>}
        </span>
      )}
    </div>
  );
}
