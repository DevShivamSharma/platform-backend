/**
 * @fileoverview Toast notification system powered by Sonner.
 *
 * Maintains the existing useToast() / ToastProvider API for backward
 * compatibility. All consumer call sites continue to work unchanged.
 *
 * @module toast
 */

import { toast as sonnerToast, Toaster } from "sonner"
import { useTheme } from "@/lib/theme-provider"

// ============================================================
// TYPES
// ============================================================

type ToastType = "success" | "error" | "info"

interface ToastOptions {
  title?: string
  message: string
  type?: ToastType
  duration?: number
}

interface ToastContextValue {
  toast: {
    (message: string, type?: ToastType, duration?: number): void
    (options: ToastOptions): void
  }
}

// ============================================================
// TOAST FUNCTION
// ============================================================

const SONNER_MAP: Record<ToastType, typeof sonnerToast.success> = {
  success: sonnerToast.success,
  error: sonnerToast.error,
  info: sonnerToast.info,
}

function toastFn(
  messageOrOptions: string | ToastOptions,
  type?: ToastType,
  duration?: number,
): void {
  const resolved =
    typeof messageOrOptions === "string"
      ? {
          message: messageOrOptions,
          title: undefined as string | undefined,
          type: (type ?? "info") as ToastType,
          duration: duration ?? 5000,
        }
      : {
          message: messageOrOptions.message,
          title: messageOrOptions.title,
          type: (messageOrOptions.type ?? "info") as ToastType,
          duration: messageOrOptions.duration ?? 5000,
        }

  const sonnerMethod = SONNER_MAP[resolved.type]

  if (resolved.title) {
    sonnerMethod(resolved.title, {
      description: resolved.message,
      duration: resolved.duration,
    })
  } else {
    sonnerMethod(resolved.message, { duration: resolved.duration })
  }
}

// ============================================================
// HOOK
// ============================================================

/**
 * Hook to access the toast notification system.
 *
 * @returns Object containing the `toast()` function
 *
 * @example
 * ```tsx
 * const { toast } = useToast()
 * toast("Saved successfully!", "success")
 * toast("Something went wrong", "error", 6000)
 * toast({ title: "Success", message: "Account created!", type: "success" })
 * ```
 */
export function useToast(): ToastContextValue {
  return { toast: toastFn as ToastContextValue["toast"] }
}

// ============================================================
// PROVIDER
// ============================================================

/**
 * Provider component for the toast notification system.
 * Renders Sonner's Toaster with theme-aware configuration.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()

  return (
    <>
      {children}
      <Toaster
        theme={resolvedTheme}
        position="bottom-right"
        closeButton
        toastOptions={{
          duration: 5000,
          style: {
            borderColor: "rgb(var(--brand-primary-rgb) / 0.22)",
            boxShadow: "0 18px 45px rgb(var(--brand-primary-rgb) / 0.14)",
          },
        }}
      />
    </>
  )
}
