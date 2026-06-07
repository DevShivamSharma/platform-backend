import { Navigate, useLocation } from "react-router-dom";
import { Loader2, Settings } from "lucide-react";
import { useAuth } from "./auth.context";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { routes } from "@/lib/config";

function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Settings className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold">Supabase configuration required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before accessing protected routes.
        </p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!isSupabaseConfigured) return <SetupRequired />;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`${routes.loginPath}?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}
