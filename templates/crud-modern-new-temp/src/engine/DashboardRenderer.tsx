import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/widgets/StatCard";
import { RecentList, type RecentItem } from "@/components/widgets/RecentList";
import { QuickActions } from "@/components/widgets/QuickActions";
import { useAuth } from "@/core/auth/auth.context";
import { config, getGeneratedModules, getReadPermission } from "@/lib/config";
import {
  countRecords,
  getBreakdown,
  getCreatedAtTrend,
  getRecords,
  sumColumn,
  type BreakdownItem,
  type TrendPoint,
} from "@/lib/dataStore";
import { formatCurrency } from "@/lib/utils";
import { getIcon } from "./icons";
import { WIDGET_ICONS } from "./widgetRegistry";

interface StatData {
  label: string;
  value: string | number;
  icon: typeof WIDGET_ICONS.count;
  spark?: number[];
  trend?: number;
}

interface BreakdownData {
  title: string;
  items: BreakdownItem[];
}

interface TrendData {
  title: string;
  points: TrendPoint[];
}

function trendPercent(points: TrendPoint[]): number | undefined {
  if (points.length < 2) return undefined;
  const previous = points[points.length - 2].count;
  const current = points[points.length - 1].count;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function BreakdownCard({ data }: { data: BreakdownData }) {
  const max = Math.max(1, ...data.items.map((item) => item.count));

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" />
          {data.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {data.items.length === 0 ? (
          <EmptyState title="No breakdown data" />
        ) : (
          data.items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function TrendCard({ data }: { data: TrendData }) {
  const max = Math.max(1, ...data.points.map((point) => point.count));

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4 text-primary" />
          {data.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-44 items-end gap-1 pt-0">
        {data.points.length === 0 ? (
          <EmptyState title="No trend data" />
        ) : (
          data.points.map((point) => (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/70"
                style={{ height: `${Math.max(6, (point.count / max) * 120)}px` }}
                title={`${point.label}: ${point.count}`}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardRenderer() {
  const { hasPermission } = useAuth();
  const modules = useMemo(
    () => getGeneratedModules().filter((module) => hasPermission(getReadPermission(module))),
    [hasPermission]
  );
  const enabledWidgets = useMemo(() => config.dashboard.widgets ?? [], []);
  const [stats, setStats] = useState<StatData[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      const nextStats: StatData[] = [];
      let nextBreakdown: BreakdownData | null = null;
      let nextTrend: TrendData | null = null;

      if (enabledWidgets.includes("module-counts")) {
        for (const module of modules) {
          const count = await countRecords(module.tableName).catch(() => 0);
          nextStats.push({
            label: module.pluralName,
            value: count,
            icon: getIcon(module.icon),
          });
        }
      }

      if (enabledWidgets.includes("currency-sum")) {
        for (const module of modules) {
          const currencyField = module.fields.find((field) => field.type === "currency");
          if (currencyField) {
            const total = await sumColumn(module.tableName, currencyField.key).catch(() => 0);
            nextStats.push({
              label: `Total ${currencyField.label}`,
              value: formatCurrency(total),
              icon: WIDGET_ICONS.currencySum,
            });
            break;
          }
        }
      }

      if (enabledWidgets.includes("status-breakdown")) {
        for (const module of modules) {
          const statusField = module.fields.find((field) => field.type === "select" || field.type === "radio");
          if (statusField) {
            nextBreakdown = {
              title: `${module.pluralName} by ${statusField.label}`,
              items: await getBreakdown(module.tableName, statusField.key, statusField.options).catch(() => []),
            };
            break;
          }
        }
      }

      if (enabledWidgets.includes("created-trend")) {
        for (const module of modules) {
          const points = await getCreatedAtTrend(module.tableName).catch(() => []);
          nextTrend = {
            title: `New ${module.pluralName} Over Time`,
            points,
          };
          const existing = nextStats.find((stat) => stat.label === module.pluralName);
          if (existing) {
            existing.spark = points.map((point) => point.count);
            existing.trend = trendPercent(points);
          }
          break;
        }
      }

      let recentItems: RecentItem[] = [];
      if (modules[0]) {
        const module = modules[0];
        const res = await getRecords(module.tableName, { page: 1, pageSize: 5 }).catch(() => ({ data: [] as Record<string, unknown>[] }));
        const titleKey = module.fields[0]?.key ?? "id";
        const subKey = module.fields[1]?.key;
        recentItems = (res.data as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          title: String(row[titleKey] ?? "-"),
          subtitle: subKey ? String(row[subKey] ?? "") : undefined,
          timestamp: row.created_at as string | undefined,
        }));
      }

      if (!active) return;
      setStats(nextStats.slice(0, 4));
      setBreakdown(nextBreakdown);
      setTrend(nextTrend);
      setRecent(recentItems);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [enabledWidgets, modules]);

  const hasDashboardContent = modules.length > 0 && enabledWidgets.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{config.dashboard.title}</h1>
        <p className="text-sm text-muted-foreground">{config.dashboard.description}</p>
      </div>

      {!hasDashboardContent ? (
        <EmptyState title="No dashboard widgets configured" description="Add modules or dashboard widgets in portal-config.json." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-36 rounded-2xl" />
                ))
              : stats.map((stat, index) => (
                  <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    icon={stat.icon}
                    spark={stat.spark}
                    trend={stat.trend}
                    index={index}
                  />
                ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentList title={`Recent ${modules[0]?.pluralName ?? "Records"}`} items={recent} />
            </div>
            <QuickActions modules={modules} />
          </div>

          {(breakdown || trend) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {breakdown && <BreakdownCard data={breakdown} />}
              {trend && <TrendCard data={trend} />}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
