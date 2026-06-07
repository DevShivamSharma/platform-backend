import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIcon } from "@/engine/icons";
import type { GeneratedModule } from "@/lib/config.types";
import { addPath } from "@/lib/config";

export function QuickActions({ modules }: { modules: GeneratedModule[] }) {
  const navigate = useNavigate();
  return (
    <Card className="flex h-full flex-col rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid flex-1 auto-rows-min grid-cols-2 gap-3 pt-0 sm:grid-cols-3">
        {modules.map((m) => {
          const Icon = getIcon(m.icon);
          return (
            <button
              key={m.id}
              onClick={() => navigate(addPath(m))}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground"
                style={{ background: "var(--primary)" }}
              >
                <Icon className="h-5 w-5" />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
                  <Plus className="h-3 w-3" style={{ color: "var(--primary)" }} />
                </span>
              </span>
              <span className="text-xs font-medium text-foreground">New {m.singularName}</span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
