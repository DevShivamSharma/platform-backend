import rawConfig from "@/portal-config.json";
import type { GeneratedModule, PortalConfig } from "./config.types";

export const config = rawConfig as PortalConfig;

export const routes = config.routes;
export const theme = config.theme;

export function getGeneratedModules(): GeneratedModule[] {
  return config.generatedModules ?? [];
}

export function getModule(moduleId: string): GeneratedModule | undefined {
  return getGeneratedModules().find((module) => module.id === moduleId);
}

export function isDashboardEnabled(): boolean {
  return config.dashboard?.enabled !== false;
}

export function isProfileEnabled(): boolean {
  return config.featureFlags?.profile !== false;
}

export function hasSignup(): boolean {
  return config.featureFlags?.signup === true;
}

export function modulePath(module: GeneratedModule): string {
  return `${routes.appBasePath}/${module.id}`;
}

export function appRelativePath(path: string): string {
  const base = routes.appBasePath.replace(/\/$/, "");
  const normalized = path.replace(/\/$/, "");
  if (normalized === base) return "";
  if (normalized.startsWith(`${base}/`)) return normalized.slice(base.length + 1);
  return normalized.replace(/^\//, "");
}

export function addPath(module: GeneratedModule): string {
  return `${modulePath(module)}/add`;
}

export function editPath(module: GeneratedModule, id: string): string {
  return `${modulePath(module)}/edit/${id}`;
}

export function detailPath(module: GeneratedModule, id: string): string {
  return `${modulePath(module)}/${id}`;
}

export function getHomePath(): string {
  if (isDashboardEnabled()) return routes.dashboardPath;
  const first = getGeneratedModules()[0];
  if (first) return modulePath(first);
  return isProfileEnabled() ? routes.profilePath : routes.loginPath;
}

export function getReadPermission(module: GeneratedModule): string {
  return module.permissions.read;
}

export function getWritePermission(module: GeneratedModule): string {
  return module.permissions.write;
}

export function getDeletePermission(module: GeneratedModule): string {
  return module.permissions.delete;
}
