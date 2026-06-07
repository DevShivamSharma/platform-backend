import { Users, Wallet, CheckCircle2, TrendingUp, type LucideIcon } from "lucide-react";

export type WidgetKind = "count" | "currencySum" | "statusCount" | "growth";

export interface StatWidget {
  kind: WidgetKind;
  label: string;
  icon: LucideIcon;
  /** crud module key the widget reads from. */
  moduleKey: string;
  /** field key for currencySum / statusCount. */
  fieldKey?: string;
  /** value to match for statusCount. */
  match?: string;
}

export const WIDGET_ICONS = {
  count: Users,
  currencySum: Wallet,
  statusCount: CheckCircle2,
  growth: TrendingUp,
} satisfies Record<WidgetKind, LucideIcon>;
