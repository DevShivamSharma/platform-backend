import * as React from "react"
import * as ReactDOM from "react-dom"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface DropdownMenuProps {
    children: React.ReactNode
}

interface DropdownMenuTriggerProps {
    children: React.ReactNode
    asChild?: boolean
    className?: string
}

interface DropdownMenuContentProps {
    children: React.ReactNode
    align?: "start" | "center" | "end"
    className?: string
}

interface DropdownMenuItemProps {
    children: React.ReactNode
    onClick?: () => void
    className?: string
    destructive?: boolean
}

interface DropdownMenuSeparatorProps {
    className?: string
}

interface DropdownMenuLabelProps {
    children: React.ReactNode
    className?: string
}

const DropdownMenuContext = React.createContext<{
    open: boolean
    setOpen: (open: boolean) => void
    triggerRef: React.RefObject<HTMLDivElement | null>
}>({ open: false, setOpen: () => { }, triggerRef: { current: null } })

function DropdownMenu({ children }: DropdownMenuProps) {
    const [open, setOpen] = React.useState(false)
    const triggerRef = React.useRef<HTMLDivElement | null>(null)

    return (
        <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
            <div className="relative inline-block text-left">
                {children}
            </div>
        </DropdownMenuContext.Provider>
    )
}

function DropdownMenuTrigger({ children, asChild, className }: DropdownMenuTriggerProps) {
    const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)

    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!open) setOpen(true)
        }
    }

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            // Check if click is inside trigger
            if (triggerRef.current?.contains(target)) return
            // Check if click is inside a portal-rendered dropdown content
            const portalContent = document.querySelector('[data-dropdown-content]')
            if (portalContent?.contains(target)) return
            setOpen(false)
        }

        if (open) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [open, setOpen, triggerRef])

    if (asChild) {
        return (
            <div ref={triggerRef} onClick={() => setOpen(!open)} onKeyDown={handleTriggerKeyDown} className={cn("cursor-pointer", className)} aria-haspopup="menu" aria-expanded={open}>
                {children}
            </div>
        )
    }

    return (
        <div ref={triggerRef}>
            <button
                onClick={() => setOpen(!open)}
                onKeyDown={handleTriggerKeyDown}
                aria-haspopup="menu"
                aria-expanded={open}
                className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    className
                )}
            >
                {children}
                <ChevronDown className="h-4 w-4" />
            </button>
        </div>
    )
}

function DropdownMenuContent({ children, align = "end", className }: DropdownMenuContentProps) {
    const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const [position, setPosition] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 })

    React.useEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setPosition({
                top: rect.bottom + 8,
                left: align === "end" ? rect.right : align === "start" ? rect.left : rect.left + rect.width / 2,
            })
        }
    }, [open, align, triggerRef])

    // Focus the container (not items) so keyboard nav works without visually selecting an item
    React.useEffect(() => {
        if (open && contentRef.current) {
            contentRef.current.focus()
        }
    }, [open])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            setOpen(false)
            const btn = triggerRef.current?.querySelector('button') as HTMLElement
            if (btn) {
                btn.focus()
            } else {
                triggerRef.current?.focus()
            }
            return
        }
        if (e.key === 'Tab') {
            setOpen(false)
            return
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            const items = Array.from(contentRef.current?.querySelectorAll('[role="menuitem"]') || []) as HTMLElement[]
            const currentIndex = items.indexOf(document.activeElement as HTMLElement)
            const nextIndex = e.key === 'ArrowDown'
                ? (currentIndex + 1) % items.length
                : currentIndex <= 0 ? items.length - 1 : currentIndex - 1
            items[nextIndex]?.focus()
        }
    }

    if (!open) return null

    return ReactDOM.createPortal(
        <div
            ref={contentRef}
            role="menu"
            tabIndex={-1}
            data-dropdown-content
            onKeyDown={handleKeyDown}
            style={{
                position: 'fixed',
                top: position.top,
                ...(align === 'end'
                    ? { right: window.innerWidth - position.left }
                    : align === 'start'
                        ? { left: position.left }
                        : { left: position.left, transform: 'translateX(-50%)' }),
            }}
            className={cn(
                "z-[200] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-fade-in",
                className
            )}
        >
            {children}
        </div>,
        document.body
    )
}

function DropdownMenuItem({ children, onClick, className, destructive }: DropdownMenuItemProps) {
    const { setOpen } = React.useContext(DropdownMenuContext)

    return (
        <button
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
                onClick?.()
                setOpen(false)
            }}
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                destructive && "text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive",
                className
            )}
        >
            {children}
        </button>
    )
}

function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
    return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />
}

function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
    return (
        <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
            {children}
        </div>
    )
}

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
}
