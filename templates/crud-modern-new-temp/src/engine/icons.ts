import * as LucideIcons from "lucide-react";
import { Box, type LucideIcon } from "lucide-react";

const iconBag = LucideIcons as unknown as Record<string, unknown>;

function normalizeIconName(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function getIcon(name?: string): LucideIcon {
  if (!name) return Box;
  const direct = iconBag[name];
  const normalized = iconBag[normalizeIconName(name)];
  return ((direct || normalized) as LucideIcon | undefined) ?? Box;
}
