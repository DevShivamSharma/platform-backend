import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldComponentProps } from "@/shared/components/form/form.types";

/** Image picker with live preview. Stores a selected file name for persistence. */
export function ImageInput({ id, value, onChange, config }: FieldComponentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>((value as string) ?? "");

  const handle = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file.name);
  };

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={config.disabled}
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="preview" className="h-28 w-28 rounded-xl border object-cover" />
          <button
            type="button"
            onClick={() => {
              setPreview("");
              onChange("");
            }}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/40"
          )}
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs">Upload</span>
        </button>
      )}
    </div>
  );
}
