import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ProtectedRoute } from "@/core/auth/auth.guard";
import { useAuth } from "@/core/auth/auth.context";
import { AuthRenderer } from "@/engine/AuthRenderer";
import { DashboardRenderer } from "@/engine/DashboardRenderer";
import { ProfileRenderer } from "@/engine/ProfileRenderer";
import { CrudListRenderer } from "@/engine/CrudListRenderer";
import { CrudFormRenderer } from "@/engine/CrudFormRenderer";
import { CrudDetailRenderer } from "@/engine/CrudDetailRenderer";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getDeletePermission,
  getGeneratedModules,
  getHomePath,
  getReadPermission,
  getWritePermission,
  appRelativePath,
  isDashboardEnabled,
  isProfileEnabled,
  routes,
} from "@/lib/config";

function PermissionGate({
  permission,
  children,
}: {
  permission?: string;
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return <EmptyState title="Access unavailable" description="Your role does not include this permission." />;
  }
  return <>{children}</>;
}

export function AppRoutes() {
  const modules = getGeneratedModules();
  const home = getHomePath();

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path={routes.loginPath} element={<AuthRenderer />} />
      </Route>

      <Route
        path={routes.appBasePath}
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {isDashboardEnabled() && (
          <Route path={appRelativePath(routes.dashboardPath)} element={<DashboardRenderer />} />
        )}
        {isProfileEnabled() && <Route path={appRelativePath(routes.profilePath)} element={<ProfileRenderer />} />}

        {modules.map((module) => (
          <Route key={module.id} path={module.id}>
            <Route
              index
              element={
                <PermissionGate permission={getReadPermission(module)}>
                  <CrudListRenderer module={module} />
                </PermissionGate>
              }
            />
            <Route
              path="add"
              element={
                <PermissionGate permission={getWritePermission(module)}>
                  <CrudFormRenderer module={module} mode="add" />
                </PermissionGate>
              }
            />
            <Route
              path="edit/:id"
              element={
                <PermissionGate permission={getWritePermission(module)}>
                  <CrudFormRenderer module={module} mode="edit" />
                </PermissionGate>
              }
            />
            <Route
              path=":id"
              element={
                <PermissionGate permission={getReadPermission(module)}>
                  <CrudDetailRenderer module={module} />
                </PermissionGate>
              }
            />
            <Route
              path=":id/delete"
              element={
                <PermissionGate permission={getDeletePermission(module)}>
                  <Navigate to=".." replace />
                </PermissionGate>
              }
            />
          </Route>
        ))}
      </Route>

      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}
