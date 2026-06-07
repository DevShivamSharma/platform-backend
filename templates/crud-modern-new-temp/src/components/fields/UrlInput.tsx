import { LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function UrlInput({ id, value, onChange, config, error }: FieldComponentProps) {
  return (
    <div className="relative">
      <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type="url"
        placeholder={config.placeholder || "https://example.com"}
        disabled={config.disabled}
        value={(value as string) ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className={cn("pl-9 transition-shadow focus-visible:ring-2", error && "border-destructive")}
      />
    </div>
  );
}
