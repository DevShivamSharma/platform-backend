import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { User, LogOut, ChevronDown } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

interface UserMenuProps {
    user: { firstName?: string; lastName?: string; email?: string } | null
    onLogout: () => void
    profileRoute: string
}

const MENU_ITEMS_COUNT = 2

export function UserMenu({ user, onLogout, profileRoute }: UserMenuProps) {
    const [open, setOpen] = useState(false)
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const [coords, setCoords] = useState({ top: 0, right: 0 })

    const initials = user
        ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"
        : "U"

    const fullName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : null

    // Position calculation
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        setCoords({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
        })
    }, [])

    // Reposition on scroll/resize
    useEffect(() => {
        if (!open) return
        updatePosition()
        window.addEventListener("scroll", updatePosition, true)
        window.addEventListener("resize", updatePosition)
        return () => {
            window.removeEventListener("scroll", updatePosition, true)
            window.removeEventListener("resize", updatePosition)
        }
    }, [open, updatePosition])

    // Outside click
    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                panelRef.current && !panelRef.current.contains(target)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [open])

    // Focus panel & set initial focused index on open; reset on close
    useEffect(() => {
        if (open) {
            setFocusedIndex(0)
            requestAnimationFrame(() => panelRef.current?.focus())
        } else {
            setFocusedIndex(-1)
        }
    }, [open])

    // Keyboard handling on the panel
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case "ArrowDown": {
                e.preventDefault()
                setFocusedIndex(prev => (prev + 1) % MENU_ITEMS_COUNT)
                break
            }
            case "ArrowUp": {
                e.preventDefault()
                setFocusedIndex(prev => (prev <= 0 ? MENU_ITEMS_COUNT - 1 : prev - 1))
                break
            }
            case "Enter": {
                e.preventDefault()
                if (focusedIndex === 0) {
                    setOpen(false)
                    navigate(profileRoute)
                } else if (focusedIndex === 1) {
                    setOpen(false)
                    onLogout()
                }
                break
            }
            case "Escape": {
                e.preventDefault()
                setOpen(false)
                triggerRef.current?.focus()
                break
            }
            case "Tab": {
                setOpen(false)
                break
            }
        }
    }, [focusedIndex, navigate, profileRoute, onLogout])

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="User menu"
                className={cn(
                    "flex items-center gap-2 pl-2 pr-1 py-1 rounded-full transition-colors select-none",
                    open
                        ? "bg-sidebar-accent"
                        : "hover:bg-sidebar-accent"
                )}
            >
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-primary-foreground font-semibold text-xs shadow-md">
                    {initials}
                </div>
                <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180"
                )} />
            </button>

            {open && createPortal(
                <div
                    ref={panelRef}
                    role="menu"
                    aria-label="User menu"
                    tabIndex={-1}
                    onKeyDown={handleKeyDown}
                    style={{ position: "fixed", top: coords.top, right: coords.right }}
                    className="z-[300] w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-dropdown-in outline-none"
                >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium text-foreground truncate">
                            {fullName || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {user?.email ?? ""}
                        </p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                        <Link
                            to={profileRoute}
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            onMouseEnter={() => setFocusedIndex(0)}
                            className={cn(
                                "flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground rounded-lg mx-1 transition-colors",
                                focusedIndex === 0 ? "bg-accent/60" : "hover:bg-accent/60"
                            )}
                        >
                            <User className="h-4 w-4 text-muted-foreground" />
                            Profile
                        </Link>
                    </div>

                    <div className="mx-3 h-px bg-border" />

                    {/* Logout */}
                    <div className="py-1">
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setOpen(false)
                                onLogout()
                            }}
                            onMouseEnter={() => setFocusedIndex(1)}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive rounded-lg mx-1 transition-colors",
                                focusedIndex === 1 ? "bg-accent/60" : "hover:bg-destructive/10"
                            )}
                            style={{ width: "calc(100% - 8px)" }}
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
