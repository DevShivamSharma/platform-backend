import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedFilterContainerProps {
  children: ReactNode;
  isOpen: boolean;
  /** Top padding for inner content (default pt-4 for FilterBar; use pt-0 when parent has its own spacing) */
  contentClassName?: string;
}

export function AnimatedFilterContainer({
  children,
  isOpen,
  contentClassName = "pt-4",
}: AnimatedFilterContainerProps) {
  return (
    <div
      aria-hidden={!isOpen}
      data-open={isOpen}
      className={cn(
        "grid overflow-x-auto filter-panel-reveal",
        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div className="min-h-0">
        <div className={cn(contentClassName, !isOpen && "pointer-events-none")}>{children}</div>
      </div>
    </div>
  );
}
