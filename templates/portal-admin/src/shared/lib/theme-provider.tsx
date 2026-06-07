import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
    theme: Theme
    resolvedTheme: "light" | "dark"
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): "light" | "dark" {
    if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return "light"
}

function getStoredTheme(): Theme {
    if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem("theme") as Theme | null
        if (stored && ["light", "dark", "system"].includes(stored)) {
            return stored
        }
    }
    return "system"
}

interface ThemeProviderProps {
    children: React.ReactNode
    defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = "system" }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() || defaultTheme)
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
        const stored = getStoredTheme()
        return stored === "system" ? getSystemTheme() : stored === "dark" ? "dark" : "light"
    })

    useEffect(() => {
        const root = window.document.documentElement

        // Remove existing theme classes
        root.classList.remove("light", "dark")

        // Determine the actual theme to apply
        let effectiveTheme: "light" | "dark"
        if (theme === "system") {
            effectiveTheme = getSystemTheme()
        } else {
            effectiveTheme = theme
        }

        // Apply the theme class
        root.classList.add(effectiveTheme)
        setResolvedTheme(effectiveTheme)

        // Store the preference
        sessionStorage.setItem("theme", theme)
    }, [theme])

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

        const handleChange = () => {
            if (theme === "system") {
                const newTheme = getSystemTheme()
                const root = window.document.documentElement
                root.classList.remove("light", "dark")
                root.classList.add(newTheme)
                setResolvedTheme(newTheme)
            }
        }

        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
    }

    const toggleTheme = () => {
        setThemeState((prev) => {
            if (prev === "light") return "dark"
            if (prev === "dark") return "light"
            // If system, toggle to opposite of current resolved theme
            return resolvedTheme === "light" ? "dark" : "light"
        })
    }

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}
