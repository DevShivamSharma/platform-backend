import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

type ResolvedTheme = NonNullable<ToasterProps["theme"]>

function resolveTheme(): ResolvedTheme {
  if (typeof document === "undefined") return "system"

  const root = document.documentElement
  if (root.classList.contains("dark")) return "dark"
  if (root.classList.contains("light")) return "light"

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
  return prefersDark ? "dark" : "light"
}

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme())

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setTheme(resolveTheme()))
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)")
    const onMqlChange = () => setTheme(resolveTheme())
    mql?.addEventListener?.("change", onMqlChange)

    return () => {
      observer.disconnect()
      mql?.removeEventListener?.("change", onMqlChange)
    }
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
