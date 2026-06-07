import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterPillProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function FilterPill({ label, value, onRemove }: FilterPillProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const removeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setIsMounted(true));
    return () => {
      window.cancelAnimationFrame(id);
      if (removeTimeoutRef.current !== null) {
        window.clearTimeout(removeTimeoutRef.current);
      }
    };
  }, []);

  function handleRemove() {
    if (isRemoving) return;
    setIsRemoving(true);
    removeTimeoutRef.current = window.setTimeout(() => {
      onRemove();
    }, 180);
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1 text-sm font-medium text-white shadow-sm transition-all hover:bg-neutral-800",
        "transition-[transform,opacity] duration-200 ease-out",
        !isMounted && "scale-95 opacity-0",
        isMounted && "scale-100 opacity-100",
        isRemoving && "scale-95 opacity-0"
      )}
    >
      <span className="text-neutral-300">{label}:</span>
      <span className="text-white">{value}</span>
      <span className="ml-1 rounded-full p-0.5 text-neutral-400 transition-colors group-hover:bg-neutral-700 group-hover:text-white">
        <X className="h-3 w-3" />
      </span>
    </button>
  );
}
