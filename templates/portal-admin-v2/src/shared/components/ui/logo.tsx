import { cn } from "@/lib/utils"

interface LogoProps {
    size?: "sm" | "md" | "lg"
    showText?: boolean
    variant?: "default" | "light"
    className?: string
}

const sizeConfig = {
    sm: { text: "text-sm", svg: { width: 28, height: 8 } },
    md: { text: "text-lg", svg: { width: 36, height: 10 } },
    lg: { text: "text-xl", svg: { width: 46, height: 13 } },
}

export function Logo({ size = "md", showText = true, variant = "default", className }: LogoProps) {
    const config = sizeConfig[size]

    const dotColor = variant === "light" ? "bg-primary-foreground" : "bg-brand"

    const DotI = () => (
        <span className="relative inline-block">
            ı
            <span
                className={cn(
                    "absolute left-1/2 -translate-x-1/2 rounded-full",
                    "w-[0.27em] h-[0.27em] top-[0.05em]",
                    dotColor
                )}
            />
        </span>
    )

    return (
        <div className={cn("flex items-center gap-0", className)}>
            <div className="flex flex-col items-center leading-none">
                {showText && (
                    <span className={cn(
                        "font-bold tracking-tight",
                        config.text,
                        variant === "light" ? "text-primary-foreground" : "text-foreground"
                    )}>
                        A<DotI />d<DotI />N
                    </span>
                )}
                <svg
                    width={config.svg.width}
                    height={config.svg.height}
                    viewBox="0 0 38 10"
                    aria-hidden="true"
                    fill="none"
                    className="block"
                >
                    <path
                        d="M3 1.5C8 9 30 9 35 1.5"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        className={cn(
                            variant === "light" ? "stroke-primary-foreground" : "stroke-brand"
                        )}
                    />
                </svg>
            </div>
        </div>
    )
}
