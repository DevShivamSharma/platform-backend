import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Values for the mini sparkline. */
  spark?: number[];
  /** e.g. +12 or -4; controls the trend arrow. */
  trend?: number;
  index?: number;
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 100;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatCard({ label, value, icon: Icon, spark, trend, index = 0 }: StatCardProps) {
  const TrendIcon = trend == null || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
      style={{ background: "var(--primary-gradient, var(--primary))" }}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
      <div className="relative flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
          <Icon className="h-5 w-5" />
        </div>
        {trend != null && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", trend < 0 ? "opacity-80" : "")}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trend > 0 ? `+${trend}` : trend}%
          </span>
        )}
      </div>
      <div className="relative mt-4 text-3xl font-bold tabular-nums">{value}</div>
      <div className="relative text-sm text-white/80">{label}</div>
      {spark && spark.length > 1 && (
        <div className="relative mt-2">
          <Sparkline data={spark} />
        </div>
      )}
    </motion.div>
  );
}
