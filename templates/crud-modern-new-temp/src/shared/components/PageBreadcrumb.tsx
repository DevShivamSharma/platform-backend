import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Standardized breadcrumb navigation used across all Add/Edit pages.
 * Matches the reference design: Home icon → Parent links → Bold current page.
 */
export function PageBreadcrumb({ items }: PageBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-sm pb-4 shrink-0"
    >
      {/* Home icon — always first */}
      <Home className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-150"
              >
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
