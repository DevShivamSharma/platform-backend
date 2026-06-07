import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "@/core/theme/theme.context";
import { AuthProvider } from "@/core/auth/auth.context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { applyThemeColor } from "@/lib/theme";

/** Applies configured theme tokens once on mount. */
function ThemeColorBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyThemeColor();
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeColorBootstrap>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </TooltipProvider>
        </AuthProvider>
      </ThemeColorBootstrap>
    </ThemeProvider>
  );
}
