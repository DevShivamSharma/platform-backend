import { useState } from "react"
import { cn } from "@/lib/utils"
import { getPortalDisplayName, getPortalLogoText, portalConfig } from "@/lib/portal-config"

interface LogoProps {
    size?: "sm" | "md" | "lg"
    showText?: boolean
    variant?: "default" | "light"
    className?: string
}

const sizeConfig = {
    sm: { text: "text-sm", mark: "h-8 w-8", image: "h-8 w-8" },
    md: { text: "text-base", mark: "h-9 w-9", image: "h-9 w-9" },
    lg: { text: "text-xl", mark: "h-11 w-11", image: "h-11 w-11" },
}

export function Logo({ size = "md", showText = true, variant = "default", className }: LogoProps) {
    const [imageFailed, setImageFailed] = useState(false)
    const config = sizeConfig[size]
    const displayName = getPortalDisplayName()
    const logoText = getPortalLogoText()
    const logoSrc = portalConfig.logo?.src
    const textColor = variant === "light" ? "text-primary-foreground" : "text-foreground"

    return (
        <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
            {logoSrc && !imageFailed ? (
                <img
                    src={logoSrc}
                    alt={portalConfig.logo?.alt || displayName}
                    className={cn("shrink-0 rounded-lg object-contain", config.image)}
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <div
                    className={cn(
                        "flex shrink-0 items-center justify-center rounded-lg bg-brand text-primary-foreground shadow-sm shadow-brand/20",
                        config.mark,
                    )}
                    aria-hidden="true"
                >
                    <span className="text-xs font-bold uppercase tracking-wide">
                        {logoText.slice(0, 3)}
                    </span>
                </div>
            )}
            {showText && (
                <span className={cn("min-w-0 truncate font-bold tracking-normal", config.text, textColor)}>
                    {displayName}
                </span>
            )}
        </div>
    )
}
