import { useRef, useState } from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

/**
 * Drag-drop file zone. Stores the file name (string) so the value is
 * persistable. Wire real uploads to Supabase Storage in dataStore if needed.
 */
export function FileInput({ id, value, onChange, config }: FieldComponentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const fileName = (value as string) ?? "";

  const pick = (file?: File) => {
    if (file) onChange(file.name);
  };

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        className="hidden"
        disabled={config.disabled}
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {fileName ? (
        <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 truncate">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            {fileName}
          </span>
          <button type="button" onClick={() => onChange("")} className="text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
          )}
        >
          <UploadCloud className="h-6 w-6" />
          <span>Drag & drop or <span className="font-medium text-foreground">browse</span></span>
        </button>
      )}
    </div>
  );
}
