import { useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

/** Animated tag add/remove. Stores string[]. */
export function TagsInput({ id, value, onChange, config, error }: FieldComponentProps) {
  const [draft, setDraft] = useState("");
  const tags = Array.isArray(value) ? (value as string[]) : [];

  const add = (raw: string) => {
    const t = raw.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft("");
  };

  const remove = (t: string) => onChange(tags.filter((x) => x !== t));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring",
        error && "border-destructive"
      )}
    >
      <AnimatePresence>
        {tags.map((t) => (
          <motion.span
            key={t}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-foreground"
          >
            {t}
            <X className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100" onClick={() => remove(t)} />
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        id={id}
        value={draft}
        disabled={config.disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          if (pasted.includes(",")) {
            e.preventDefault();
            const newTags = pasted.split(",").map((s) => s.trim()).filter(Boolean);
            const unique = newTags.filter((t) => !tags.includes(t));
            if (unique.length) onChange([...tags, ...unique]);
          }
        }}
        onBlur={() => draft && add(draft)}
        placeholder={tags.length ? "" : config.placeholder || "Add tag…"}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
