import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner (shadcn standard). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/** Format a number as currency. Compact Indian-style for large values. */
export function formatCurrency(value: unknown, format = "USD"): string {
  const num = typeof value === "number" ? value : Number(value);
  if (value == null || value === "" || Number.isNaN(num)) return "—";
  const symbol = CURRENCY_SYMBOLS[format] ?? "";
  if (format === "INR") {
    if (num >= 1e7) return `${symbol}${(num / 1e7).toFixed(2)}Cr`;
    if (num >= 1e5) return `${symbol}${(num / 1e5).toFixed(2)}L`;
    return `${symbol}${num.toLocaleString("en-IN")}`;
  }
  return `${symbol}${num.toLocaleString()}`;
}

/** Format an ISO/date string as a short readable date. */
export function formatDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(value: unknown): string {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

export function formatDateTime(value: unknown): string {
  if (!value) return "-";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative "time ago" label for recent-activity lists. */
export function timeAgo(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as string).getTime();
  if (Number.isNaN(d)) return "";
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

/** Title-case a snake/kebab/lower string for display. */
export function humanize(value: string): string {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Initials from a name string. */
export function initials(name: string): string {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
