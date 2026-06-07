import { X } from "lucide-react"

interface PopupModalProps {
    title: string
    onClose: () => void
    children: React.ReactNode
}

export function PopupModal({ title, onClose, children }: PopupModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="fixed inset-0 bg-foreground/50 dark:bg-foreground/30" onClick={onClose} />
            <div className="relative z-50 w-full max-w-lg rounded-xl border bg-card shadow-xl mx-4">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h3 className="text-base font-semibold">{title}</h3>
                    <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-5 py-4 max-h-[60vh] overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}
