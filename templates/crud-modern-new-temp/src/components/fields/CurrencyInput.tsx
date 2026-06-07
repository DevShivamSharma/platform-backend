import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

const SYMBOLS: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

function formatDisplay(num: number | string, format: string): string {
  const n = Number(num);
  if (num === "" || num == null || Number.isNaN(n)) return "";
  return format === "INR"
    ? n.toLocaleString("en-IN")
    : n.toLocaleString("en-US");
}

export function CurrencyInput({ id, value, onChange, config, error }: FieldComponentProps) {
  const format = config.displayFormat ?? "INR";
  const symbol = SYMBOLS[format] ?? "₹";
  const [focused, setFocused] = useState(false);
  const raw = value ?? "";
  const display = focused ? String(raw) : formatDisplay(raw as number | string, format);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        {symbol}
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={config.placeholder || "0"}
        disabled={config.disabled}
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^\d.]/g, "");
          // Allow only one decimal point
          const parts = cleaned.split(".");
          const safe = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
          onChange(safe === "" ? "" : Number(safe));
        }}
        className={cn("pl-8 transition-shadow focus-visible:ring-2", error && "border-destructive")}
      />
    </div>
  );
}
