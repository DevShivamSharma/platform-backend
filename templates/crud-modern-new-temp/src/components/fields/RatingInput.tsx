import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

export function RatingInput({ value, onChange, config }: FieldComponentProps) {
  const rating = Number(value || 0);

  return (
    <div className="flex h-9 items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const score = index + 1;
        const active = score <= rating;
        return (
          <button
            key={score}
            type="button"
            disabled={config.disabled}
            onClick={() => onChange(score)}
            className={cn("rounded p-1 text-muted-foreground transition-colors", active && "text-primary")}
          >
            <Star className={cn("h-5 w-5", active && "fill-current")} />
          </button>
        );
      })}
    </div>
  );
}
