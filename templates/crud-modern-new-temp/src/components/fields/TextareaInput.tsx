import { useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function TextareaInput({ id, value, onChange, config, error }: FieldComponentProps) {
  const text = (value as string) ?? "";
  const maxLen = (config as any).validation?.maxLength as number | undefined;
  const ref = useRef<HTMLTextAreaElement>(null);

  const autoGrow = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        id={id}
        rows={config.rows ?? 3}
        maxLength={maxLen}
        placeholder={config.placeholder || config.label}
        disabled={config.disabled}
        value={text}
        onChange={(e) => {
          onChange(e.target.value);
          autoGrow();
        }}
        className={cn("resize-y transition-shadow focus-visible:ring-2", error && "border-destructive")}
      />
      <span className="pointer-events-none absolute bottom-1.5 right-2 text-[10px] text-muted-foreground">
        {maxLen ? `${text.length} / ${maxLen}` : text.length}
      </span>
    </div>
  );
}
