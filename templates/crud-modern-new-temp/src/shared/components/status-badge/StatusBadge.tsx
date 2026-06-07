import { Badge } from "@/components/ui/badge";
import { cn, humanize } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  colorMap?: Record<string, string>;
}

export function StatusBadge({ status, className, colorMap }: StatusBadgeProps) {
  const colorClass =
    colorMap?.[status] ??
    "border-primary/25 bg-primary/10 text-foreground dark:border-primary/30 dark:bg-primary/15";

  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-medium", colorClass, className)}
    >
      {humanize(status)}
    </Badge>
  );
}
