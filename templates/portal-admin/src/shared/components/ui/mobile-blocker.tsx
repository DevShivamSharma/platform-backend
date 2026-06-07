import { useState, useEffect } from "react"
import { Smartphone, Monitor } from "lucide-react"
import { Logo } from "./logo"
import { shouldBlockMobile } from "@/lib/portal-config"

const MOBILE_BREAKPOINT = 768

export function MobileBlocker({ children }: { children: React.ReactNode }) {
    const [isMobile, setIsMobile] = useState(false)
    const blockMobile = shouldBlockMobile()

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    if (blockMobile && isMobile) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="text-center max-w-md animate-fade-in">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                            <Smartphone className="w-12 h-12 text-primary" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 left-1/2 ml-4">
                            <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center border border-destructive/25">
                                <span className="text-destructive text-xl">✕</span>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-foreground mb-3">
                        Mobile Not Supported
                    </h1>

                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        This application is optimized for desktop and tablet devices.
                        Please switch to a larger screen for the best experience.
                    </p>

                    <div className="bg-muted/50 backdrop-blur-sm rounded-2xl p-6 border border-border">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Monitor className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Recommended: Desktop or Tablet
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Minimum width: 768px
                        </p>
                    </div>

                    <div className="mt-10 flex items-center justify-center opacity-50">
                        <Logo size="sm" />
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
