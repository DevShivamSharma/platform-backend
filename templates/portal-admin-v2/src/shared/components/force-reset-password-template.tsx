import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, ShieldCheck, Sun, Moon } from "lucide-react"
import { SECURITY } from "@/constants"
import { ApiClientError } from "@/services/api.service"
import { Logo } from "@/components/ui/logo"
import { useTheme } from "@/lib/theme-provider"
import { useToast } from "@/components/ui/toast"

interface ForceResetPasswordTemplateProps {
    /** API call to force-reset the password */
    forceResetPassword: (token: string, password: string) => Promise<{ message?: string }>
    /** Logout the current user */
    logout: () => Promise<void>
    /** Optional callback after successful password reset (e.g., clearing flags) */
    onSuccess?: () => Promise<void> | void
    /** Route to navigate to after successful password reset */
    successRedirect: string
    /** Route to navigate to when user clicks "Wrong account? Log In" */
    loginRedirect: string
    /** Label used in the hero description ("platform" or "portal") */
    appLabel: string
}

export function ForceResetPasswordTemplate({
    forceResetPassword,
    logout,
    onSuccess,
    successRedirect,
    loginRedirect,
    appLabel,
}: ForceResetPasswordTemplateProps) {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const navigate = useNavigate()
    const { token } = useParams()
    const { resolvedTheme, toggleTheme } = useTheme()
    const { toast } = useToast()

    const passwordsMatch = newPassword === confirmPassword
    const canSubmit =
        newPassword.length >= SECURITY.MIN_PASSWORD_LENGTH &&
        confirmPassword.length >= SECURITY.MIN_PASSWORD_LENGTH &&
        passwordsMatch

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!passwordsMatch) {
            setError("Passwords do not match.")
            return
        }

        setIsLoading(true)

        try {
            const tokenValue = token ?? ""
            const result = await forceResetPassword(tokenValue, newPassword)
            await onSuccess?.()
            if (result.message) {
                toast(result.message, "success")
            }
            navigate(successRedirect)
        } catch (err: unknown) {
            if (err instanceof ApiClientError) {
                setError(err.message)
            } else {
                const message = err instanceof Error ? err.message : "A network error occurred. Please try again."
                setError(message)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignOut = async () => {
        await logout()
        navigate(loginRedirect)
    }

    return (
        <div className="min-h-screen flex selection:bg-brand/30">
            {/* Left Side - Hero Section */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-auth-panel">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/[0.06] dark:bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-overlay" />
                </div>

                <div className="relative z-10 w-full flex flex-col justify-between p-16">
                    <div className="flex items-center gap-3 animate-hero-fade">
                        <Logo size="lg" variant={resolvedTheme === "dark" ? "light" : "default"} />
                    </div>

                    <div className="max-w-xl">
                        <div className="space-y-6 animate-hero-fade-d1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand-light text-xs font-bold uppercase tracking-wider">
                                <ShieldCheck className="w-3 h-3" />
                                Security Required
                            </div>
                            <h1 className="text-6xl font-bold text-foreground leading-[1.1]">
                                Secure your <span className="gradient-text">account</span> to get started.
                            </h1>
                            <p className="text-muted-foreground text-xl leading-relaxed">
                                For your security, please set a new password before accessing the {appLabel}. This ensures only you have access to your account.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-muted-foreground animate-hero-fade-d3">
                        <p className="text-sm">Powered by AidiN Health</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 bg-background relative">
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                    className="absolute top-6 right-6 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
                >
                    {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                <div className="w-full max-w-[440px] space-y-10 animate-content-fade">
                    <div className="text-center lg:text-left space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Set Your New Password</h2>
                            <p className="text-muted-foreground">Please choose a new password to continue.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div
                                className="flex items-center gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-banner-in"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="new-password" className="text-sm font-semibold opacity-80">New Password</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-brand transition-colors" />
                                <Input
                                    id="new-password"
                                    type={showNew ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Min. 8 characters"
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); setError("") }}
                                    className="h-12 pl-11 pr-11 bg-background/50 border-border/50 focus:border-brand/50 focus:ring-brand/20 rounded-xl"
                                    required
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                                    aria-label={showNew ? "Hide password" : "Show password"}
                                >
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {newPassword.length > 0 && newPassword.length < SECURITY.MIN_PASSWORD_LENGTH && (
                                <p className="text-xs text-warning">Password must be at least {SECURITY.MIN_PASSWORD_LENGTH} characters</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-sm font-semibold opacity-80">Confirm New Password</Label>
                            <div className="relative group">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-brand transition-colors" />
                                <Input
                                    id="confirm-password"
                                    type={showConfirm ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); setError("") }}
                                    className="h-12 pl-11 pr-11 bg-background/50 border-border/50 focus:border-brand/50 focus:ring-brand/20 rounded-xl"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                                    aria-label={showConfirm ? "Hide password" : "Show password"}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <p className="text-xs text-warning">Passwords do not match</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="gradient"
                            className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:-translate-y-0.5 transition-all"
                            disabled={!canSubmit || isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-[3px] border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    <span>Setting password...</span>
                                </div>
                            ) : (
                                "Set Password"
                            )}
                        </Button>
                    </form>

                    <div className="pt-4 text-center">
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Wrong account? Login In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
