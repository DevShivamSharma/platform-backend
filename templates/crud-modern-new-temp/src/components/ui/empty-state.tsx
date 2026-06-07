import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Friendly empty state with an inline SVG illustration. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none" className="mb-6">
        <defs>
          <linearGradient id="es-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <rect x="24" y="20" width="112" height="80" rx="12" fill="url(#es-grad)" />
        <rect x="40" y="38" width="80" height="8" rx="4" fill="var(--primary)" fillOpacity="0.35" />
        <rect x="40" y="54" width="58" height="8" rx="4" fill="var(--primary)" fillOpacity="0.22" />
        <rect x="40" y="70" width="68" height="8" rx="4" fill="var(--primary)" fillOpacity="0.22" />
        <circle cx="120" cy="86" r="18" fill="var(--primary)" fillOpacity="0.9" />
        <path d="M120 79v14M113 86h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
