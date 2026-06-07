import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check, Layers, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useActiveAccount } from "@organization/contexts/active-account-context"
import type { AccountConfigItem } from "@/services/account.service"

// ── Helpers ──────────────────────────────────────────────────────

/** Deterministic hue from account ID for colored avatars */
function getAccountHue(id: string): number {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash) % 360
}

/** Sentinel ID for the "All Accounts" option */
const ALL_ACCOUNTS_ID = "__all__"

interface FlatItem {
    id: string
    type: "all" | "account"
    account?: AccountConfigItem
}

// ── Component ────────────────────────────────────────────────────

export function AccountSwitcher() {
    const { activeAccountId, setActiveAccountId, accounts, loading } = useActiveAccount()
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [coords, setCoords] = useState({ top: 0, left: 0 })

    const activeLabel = useMemo(() => {
        if (!activeAccountId) return "All Accounts"
        return accounts.find(a => a.id === activeAccountId)?.name ?? "All Accounts"
    }, [activeAccountId, accounts])

    const initial = useMemo(() => {
        if (!activeAccountId) return null
        const name = accounts.find(a => a.id === activeAccountId)?.name
        return name ? name[0].toUpperCase() : null
    }, [activeAccountId, accounts])

    const filteredAccounts = useMemo(() => {
        if (!search.trim()) return accounts
        const lower = search.toLowerCase()
        return accounts.filter(a => a.name.toLowerCase().includes(lower))
    }, [accounts, search])

    // Flat list for keyboard navigation
    const flatItems = useMemo<FlatItem[]>(() => {
        const items: FlatItem[] = []
        if (!search.trim()) {
            items.push({ id: ALL_ACCOUNTS_ID, type: "all" })
        }
        for (const account of filteredAccounts) {
            items.push({ id: account.id, type: "account", account })
        }
        return items
    }, [search, filteredAccounts])

    // ── Positioning ──────────────────────────────────────────────

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        setCoords({ top: rect.bottom + 8, left: Math.max(8, rect.right - 280) })
    }, [])

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

    // ── Focus & reset on open ────────────────────────────────────

    useEffect(() => {
        if (open) {
            setSearch("")
            setFocusedIndex(-1)
            requestAnimationFrame(() => searchInputRef.current?.focus())
        }
    }, [open])

    // Reset focused index when search changes
    useEffect(() => {
        setFocusedIndex(-1)
    }, [search])

    // ── Outside click ────────────────────────────────────────────

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

    // ── Selection ────────────────────────────────────────────────

    const handleSelect = useCallback((id: string) => {
        setActiveAccountId(id === ALL_ACCOUNTS_ID ? "" : id)
        setOpen(false)
        requestAnimationFrame(() => triggerRef.current?.focus())
    }, [setActiveAccountId])

    // ── Keyboard ─────────────────────────────────────────────────

    const handlePanelKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case "ArrowDown": {
                e.preventDefault()
                setFocusedIndex(prev =>
                    prev < flatItems.length - 1 ? prev + 1 : 0
                )
                break
            }
            case "ArrowUp": {
                e.preventDefault()
                setFocusedIndex(prev =>
                    prev > 0 ? prev - 1 : flatItems.length - 1
                )
                break
            }
            case "Enter": {
                e.preventDefault()
                if (focusedIndex >= 0 && focusedIndex < flatItems.length) {
                    handleSelect(flatItems[focusedIndex].id)
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
    }, [flatItems, focusedIndex, handleSelect])

    const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            if (!open) setOpen(true)
        }
    }, [open])

    // ── Render guards ────────────────────────────────────────────

    if (!loading && accounts.length === 0) return null

    // Loading skeleton
    if (loading) {
        return (
            <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg bg-sidebar-accent/30">
                <div className="w-6 h-6 rounded-md bg-sidebar-accent/50 animate-pulse" />
                <div className="w-24 h-3.5 rounded bg-sidebar-accent/40 animate-pulse" />
            </div>
        )
    }

    // Single account — static display
    if (accounts.length === 1) {
        const acct = accounts[0]
        const hue = getAccountHue(acct.id)
        return (
            <div className="flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-lg bg-sidebar-accent border border-sidebar-border/60 cursor-default">
                <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `hsl(${hue}, 55%, 88%)` }}
                >
                    <span
                        className="text-[10px] font-semibold leading-none"
                        style={{ color: `hsl(${hue}, 55%, 30%)` }}
                    >
                        {acct.name[0]?.toUpperCase() ?? "?"}
                    </span>
                </div>
                <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                    {acct.name}
                </span>
            </div>
        )
    }

    // ── Multi-account: trigger + dropdown ─────────────────────────

    return (
        <>
            <button
                ref={triggerRef}
                onClick={() => setOpen(!open)}
                onKeyDown={handleTriggerKeyDown}
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label="Switch account"
                className={cn(
                    "flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-lg border transition-all duration-150 select-none",
                    "active:scale-[0.98]",
                    open
                        ? "bg-sidebar-accent border-brand/50 shadow-sm"
                        : "bg-sidebar-accent/40 border-sidebar-border/60 hover:bg-sidebar-accent/70 hover:border-sidebar-border"
                )}
            >
                <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors duration-150",
                    "bg-brand shadow-sm shadow-brand/15"
                )}>
                    {initial ? (
                        <span className="text-[10px] font-bold text-primary-foreground leading-none">{initial}</span>
                    ) : (
                        <Layers className="h-3 w-3 text-primary-foreground" />
                    )}
                </div>
                <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                    {activeLabel}
                </span>
                <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180"
                )} />
            </button>

            {open && createPortal(
                <div
                    ref={panelRef}
                    role="listbox"
                    aria-label="Accounts"
                    tabIndex={-1}
                    onKeyDown={handlePanelKeyDown}
                    style={{ position: "fixed", top: coords.top, left: coords.left }}
                    className="z-[300] w-[280px] bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-dropdown-in outline-none"
                >
                    {/* ── Search ───────────────────────────────── */}
                    <div className="p-2.5 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                role="searchbox"
                                aria-label="Search accounts"
                                placeholder="Search accounts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowDown") {
                                        e.preventDefault()
                                        setFocusedIndex(0)
                                    } else if (e.key === "ArrowUp") {
                                        e.preventDefault()
                                        setFocusedIndex(flatItems.length - 1)
                                    } else if (e.key === "Escape") {
                                        e.preventDefault()
                                        setOpen(false)
                                        triggerRef.current?.focus()
                                    } else if (e.key === "Enter" && focusedIndex >= 0) {
                                        e.preventDefault()
                                        handleSelect(flatItems[focusedIndex].id)
                                    }
                                }}
                                className="w-full h-8 pl-8 pr-3 text-sm bg-muted/60 border-0 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted/80 focus:ring-1 focus:ring-brand/30 transition-all duration-100"
                            />
                        </div>
                    </div>

                    {/* ── All Accounts (when not searching) ──── */}
                    {!search.trim() && (
                        <>
                            <div className="px-2.5 pt-2.5 pb-1">
                                <p className="px-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                    Aggregate
                                </p>
                            </div>
                            <div className="px-1.5 pb-1">
                                <AccountOption
                                    label="All Accounts"
                                    isActive={!activeAccountId}
                                    isFocused={focusedIndex === 0}
                                    icon={<Layers className={cn(
                                        "h-3 w-3",
                                        !activeAccountId ? "text-primary-foreground" : "text-muted-foreground"
                                    )} />}
                                    avatarClassName={
                                        !activeAccountId
                                            ? "bg-gradient-to-br from-brand to-brand-dark shadow-sm shadow-brand/15"
                                            : "bg-muted border border-border"
                                    }
                                    onClick={() => handleSelect(ALL_ACCOUNTS_ID)}
                                    onMouseEnter={() => setFocusedIndex(0)}
                                    animationDelay={0}
                                />
                            </div>
                            <div className="mx-2.5 h-px bg-border" />
                        </>
                    )}

                    {/* ── Accounts list ────────────────────────── */}
                    <div className="px-2.5 pt-2 pb-1">
                        <p className="px-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            Accounts
                        </p>
                    </div>

                    <div className="px-1.5 pb-1.5 max-h-[240px] overflow-y-auto">
                        {filteredAccounts.length === 0 ? (
                            <div className="py-8 flex flex-col items-center gap-2">
                                <Search className="h-8 w-8 text-muted-foreground/30" />
                                <p className="text-sm font-medium text-muted-foreground">No matches</p>
                                <p className="text-xs text-muted-foreground">Try a different search</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {filteredAccounts.map((account, index) => {
                                    const isActive = activeAccountId === account.id
                                    const accountInitial = account.name[0]?.toUpperCase() ?? "?"
                                    const hue = getAccountHue(account.id)
                                    const itemIndex = search.trim() ? index : index + 1 // offset by "All Accounts"
                                    const delay = Math.min(index * 20, 200)

                                    return (
                                        <AccountOption
                                            key={account.id}
                                            label={account.name}
                                            isActive={isActive}
                                            isFocused={focusedIndex === itemIndex}
                                            icon={
                                                <span
                                                    className={cn("text-[10px] font-bold leading-none", isActive && "text-primary-foreground")}
                                                    style={isActive ? undefined : { color: `hsl(${hue}, 55%, 30%)` }}
                                                >
                                                    {accountInitial}
                                                </span>
                                            }
                                            avatarClassName={
                                                isActive
                                                    ? "bg-brand shadow-sm shadow-brand/15"
                                                    : undefined
                                            }
                                            avatarStyle={
                                                !isActive
                                                    ? { backgroundColor: `hsl(${hue}, 55%, 88%)` }
                                                    : undefined
                                            }
                                            onClick={() => handleSelect(account.id)}
                                            onMouseEnter={() => setFocusedIndex(itemIndex)}
                                            animationDelay={delay}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Footer ───────────────────────────────── */}
                    <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <kbd className="text-[10px] font-medium text-muted-foreground bg-muted px-1 py-0.5 rounded border border-border leading-none">
                                ↑↓
                            </kbd>
                            <span className="text-[10px] text-muted-foreground">navigate</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

// ── Account Option ───────────────────────────────────────────────

interface AccountOptionProps {
    label: string
    subtitle?: string
    isActive: boolean
    isFocused: boolean
    icon: React.ReactNode
    avatarClassName?: string
    avatarStyle?: React.CSSProperties
    onClick: () => void
    onMouseEnter: () => void
    animationDelay: number
}

function AccountOption({
    label,
    subtitle,
    isActive,
    isFocused,
    icon,
    avatarClassName,
    avatarStyle,
    onClick,
    onMouseEnter,
    animationDelay,
}: AccountOptionProps) {
    return (
        <button
            type="button"
            role="option"
            aria-selected={isActive}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-100 animate-list-item",
                isFocused && "bg-accent/60",
                isActive && !isFocused && "bg-brand/[0.06]",
            )}
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            <div
                className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors",
                    avatarClassName
                )}
                style={avatarStyle}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0 text-left">
                <span className={cn(
                    "block truncate",
                    isActive ? "font-medium text-foreground" : "text-foreground"
                )}>
                    {label}
                </span>
                {subtitle && (
                    <span className="block text-[10px] text-muted-foreground truncate">
                        {subtitle}
                    </span>
                )}
            </div>
            <div className={cn(
                "shrink-0 transition-all duration-100",
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
            )}>
                <Check className="h-3.5 w-3.5 text-brand" strokeWidth={2.5} />
            </div>
        </button>
    )
}
