import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { initials, timeAgo } from "@/lib/utils";

export interface RecentItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
}

export function RecentList({ title, items }: { title: string; items: RecentItem[] }) {
  return (
    <Card className="flex h-full flex-col rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-0">
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState title="Nothing here yet" />
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 py-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
                  style={{ background: "var(--primary)" }}
                >
                  {initials(it.title)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{it.title}</p>
                  {it.subtitle && <p className="truncate text-xs text-muted-foreground">{it.subtitle}</p>}
                </div>
                {it.timestamp && (
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(it.timestamp)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
