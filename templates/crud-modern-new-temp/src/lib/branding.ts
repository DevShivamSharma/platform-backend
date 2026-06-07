import { config } from "./config";

/** Build a rounded-square SVG favicon with initials on the brand color. */
function faviconSvg(initials: string, brand: string): string {
  const text = (initials || "A").slice(0, 2).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${brand}"/>
  <text x="50%" y="50%" dy="2" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="30" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${text}</text>
</svg>`;
}

/** App name used as the base tab title. */
export const appTitle = config.appName || config.portalName || "App";

/** Set <title> and favicon from the portal config. Safe to call once at startup. */
export function applyBranding(): void {
  if (typeof document === "undefined") return;

  document.title = appTitle;

  const href = config.logo
    ? config.logo
    : `data:image/svg+xml,${encodeURIComponent(
        faviconSvg(config.logoInitials, config.theme.primary)
      )}`;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = href;
}

/** Compose a page-specific tab title, e.g. "Contacts · Acme CRM". */
export function setPageTitle(page?: string): void {
  if (typeof document === "undefined") return;
  document.title = page ? `${page} · ${appTitle}` : appTitle;
}
