import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@/engine/AppShell";
import { setPageTitle } from "@/lib/branding";
import {
  config,
  getGeneratedModules,
  isDashboardEnabled,
  isProfileEnabled,
  modulePath,
  routes,
} from "@/lib/config";

/** Resolve a human page name from the current pathname for the tab title. */
function pageNameFor(pathname: string): string | undefined {
  if (isDashboardEnabled() && pathname.startsWith(routes.dashboardPath)) {
    return config.dashboard.label;
  }
  if (isProfileEnabled() && pathname.startsWith(routes.profilePath)) {
    return "Profile";
  }
  const module = getGeneratedModules().find((m) =>
    pathname.startsWith(modulePath(m))
  );
  return module?.pluralName;
}

/** Top navbar + scrollable content. Extra bottom padding clears the mobile tab bar. */
export function AppLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    setPageTitle(pageNameFor(pathname));
  }, [pathname]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background">
      <div className="shrink-0">
        <AppShell />
      </div>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
