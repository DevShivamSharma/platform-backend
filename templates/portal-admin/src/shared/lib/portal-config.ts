/**
 * @fileoverview Portal configuration loader.
 *
 * `src/portal-config.json` is the single swappable file that re-skins this
 * template for a new customer (equivalent to landing-modern's content.json).
 * The platform scaffolder copies the template, replaces ONLY this JSON (and the
 * Supabase credentials in .env), then deploys.
 *
 * This module reads the JSON and applies the parts that are wired live:
 *   - portalName  -> document.title
 *   - theme.tokens -> CSS custom properties on :root (drives the whole palette,
 *                     since src/shared/index.css derives every color from them)
 *
 * `navigation`, `dashboard` and `entities` are the documented config contract
 * consumed by the sidebar/dashboard and the api.service route registry; see
 * README "Config-driven" section.
 *
 * @module lib/portal-config
 */

import config from "../../portal-config.json"

export interface PortalConfig {
  appName?: string
  portalName: string
  industry?: string
  logo: { src?: string; alt?: string; text?: string; width?: number }
  theme: {
    mode?: "light" | "dark" | "system"
    name?: string
    primary?: string
    primaryHover?: string
    primaryLight?: string
    accent?: string
    tokens?: Record<string, string>
  }
  runtime?: {
    legacyRoutesEnabled?: boolean
    blockMobile?: boolean
  }
  loginPage?: {
    portalName?: string
    badge?: string
    headline?: string
    highlightText?: string
    description?: string
    features?: Array<{ title: string; description: string; icon?: string }>
    footerText?: string
  }
  footer?: { text?: string }
  company?: {
    name?: string
    website?: string
    supportEmail?: string
    address?: string
  }
  dashboard?: Record<string, unknown>
  navigation?: unknown[]
  entities?: unknown[]
  generatedModules?: GeneratedModule[]
}

export interface GeneratedField {
  key: string
  label: string
  type: string
  required?: boolean
  options?: string[]
  width?: "full" | "half" | "third"
  placeholder?: string
  helpText?: string
}

export interface GeneratedModule {
  id: string
  tableName?: string
  singularName: string
  pluralName: string
  icon?: string
  fields: GeneratedField[]
  listColumns?: string[]
  tableFeatures?: {
    sort?: boolean
    filter?: boolean
    search?: boolean
    pagination?: boolean
  }
}

export const portalConfig = config as unknown as PortalConfig

export function getPortalDisplayName(): string {
  return portalConfig.appName || portalConfig.portalName || "Portal"
}

export function getPortalLogoText(): string {
  if (portalConfig.logo?.text) return portalConfig.logo.text
  const words = getPortalDisplayName()
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return "AP"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase()
}

export function getPortalFooterText(): string {
  return portalConfig.footer?.text || portalConfig.loginPage?.footerText || `Powered by ${getPortalDisplayName()}`
}

export function legacyRoutesEnabled(): boolean {
  return portalConfig.runtime?.legacyRoutesEnabled !== false
}

export function shouldBlockMobile(): boolean {
  return portalConfig.runtime?.blockMobile !== false
}

/** Apply branding + theme tokens from portal-config.json. Call once at startup. */
export function applyPortalConfig(): void {
  if (typeof document === "undefined") return

  const title = getPortalDisplayName()
  if (title) {
    document.title = title
  }

  const tokens = portalConfig.theme?.tokens
  if (tokens) {
    const root = document.documentElement
    for (const [key, value] of Object.entries(tokens)) {
      // tokens are written without the leading "--" in JSON for readability
      root.style.setProperty(`--${key}`, value)
    }
  }

  applyFavicon()
}

/** Drive the favicon from portal config: the logo if set, else a generated
 *  rounded-square SVG with the portal initials on the brand color. */
function applyFavicon(): void {
  const brand = portalConfig.theme?.tokens?.["brand-primary"] || "#2563EB"
  const initials = getPortalLogoText()
  const href = portalConfig.logo?.src
    ? portalConfig.logo.src
    : `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${brand}"/><text x="50%" y="54%" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`
      )}`

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement("link")
    link.rel = "icon"
    document.head.appendChild(link)
  }
  link.removeAttribute("type") // let the browser detect (webp / svg / png)
  link.href = href
}
