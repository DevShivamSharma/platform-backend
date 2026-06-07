import { memo } from "react"
import { cn } from "@/lib/utils"
import { statusConfig } from "@/constants/badge-configs"

export interface BadgeConfig {
    label: string
    className: string
    dotClassName?: string
}

interface StatusBadgeProps {
    status: string
    config?: Record<string, BadgeConfig>
    className?: string
}

export const StatusBadge = memo(function StatusBadge({
    status,
    config = statusConfig,
    className,
}: StatusBadgeProps) {
    let statusValue = status?.toLocaleLowerCase()
    const cfg = config[statusValue] ?? {
        label: status,
        className: "bg-muted text-muted-foreground border border-border",
        dotClassName: "bg-muted-foreground/50",
    }

    return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide", cfg.className, className)}>
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dotClassName ?? "bg-current")} />
            {cfg.label}
        </span>
    )
})
