import { STC_CODE_OPTIONS } from "@/constants"

interface StcCodeBadgesProps {
    codes: string[] | undefined | null
    maxVisible?: number
}

export function StcCodeBadges({ codes, maxVisible = 3 }: StcCodeBadgesProps) {
    if (!codes || codes.length === 0) {
        return <span className="text-muted-foreground">--</span>
    }

    const visible = codes.slice(0, maxVisible)
    const overflow = codes.length - maxVisible

    const overflowLabels = overflow > 0
        ? codes.slice(maxVisible).map(c => {
            const opt = STC_CODE_OPTIONS.find(o => o.value === c.trim())
            return opt?.label ?? c
        }).join(", ")
        : ""

    return (
        <div className="flex flex-wrap gap-1">
            {visible.map((code) => {
                const option = STC_CODE_OPTIONS.find(o => o.value === code.trim())
                return (
                    <span
                        key={code}
                        className="inline-flex whitespace-nowrap items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary dark:text-primary border border-primary/20"
                    >
                        {option?.label ?? code}
                    </span>
                )
            })}
            {overflow > 0 && (
                <span
                    title={overflowLabels}
                    className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border cursor-default"
                >
                    +{overflow}
                </span>
            )}
        </div>
    )
}
