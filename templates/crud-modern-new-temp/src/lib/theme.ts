import { theme } from "./config";

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (x: number) => Math.max(0, Math.min(255, Math.round(x)));
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, "0")).join("")}`;
}

function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return rgbToHex(r + (target - r) * p, g + (target - g) * p, b + (target - b) * p);
}

function readableForeground(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0a0a0a" : "#ffffff";
}

export function applyThemeColor(configuredTheme = theme) {
  if (typeof document === "undefined" || !configuredTheme?.primary) return;

  const primary = configuredTheme.primary;
  const primaryHover = configuredTheme.primaryHover ?? shade(primary, -0.14);
  const primaryLight = configuredTheme.primaryLight ?? shade(primary, 0.82);
  const accent = configuredTheme.accent ?? primaryHover;
  const root = document.documentElement;

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-hover", primaryHover);
  root.style.setProperty("--primary-light", primaryLight);
  root.style.setProperty("--primary-foreground", readableForeground(primary));
  root.style.setProperty("--primary-gradient", `linear-gradient(135deg, ${primary}, ${primaryHover})`);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--accent", primaryLight);
  root.style.setProperty("--accent-foreground", "#0f172a");
  root.style.setProperty("--brand-accent", accent);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-ring", primary);
  root.style.setProperty("--chart-1", primary);
  root.style.setProperty("--chart-2", accent);
  root.style.setProperty("--chart-3", primaryHover);
  root.style.setProperty("--chart-4", primaryLight);
  root.style.setProperty("--chart-5", shade(accent, -0.12));
}

export const themeTokens = {
  primary: () => theme.primary,
  primaryHover: () => theme.primaryHover ?? shade(theme.primary, -0.14),
  primaryLight: () => theme.primaryLight ?? shade(theme.primary, 0.82),
  accent: () => theme.accent ?? theme.primary,
};
