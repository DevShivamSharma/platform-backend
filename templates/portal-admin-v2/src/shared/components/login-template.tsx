import { useState, useRef, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, Mail, Zap, Sun, Moon, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { auditLog } from "@/lib/security"
import { SECURITY, OTP } from "@/constants"
import { ApiClientError } from "@/services/api.service"
import { Logo } from "@/components/ui/logo"
import { useTheme } from "@/lib/theme-provider"

// ── Types ──────────────────────────────────────────────────────

interface SocialProofItem {
    icon: ReactNode
    title: string
    description: string
}

interface LoginTemplateProps {
    onLogin: (credentials: { email: string; password: string }) => Promise<{ data?: { requiresPasswordChange?: boolean; accessToken?: string }; otpToken?: string }>
    onVerifyOtp: (credentials: { otp: string; otpToken: string }) => Promise<{ data?: { requiresPasswordChange?: boolean } }>
    onForgotPassword: (params: { email: string }) => Promise<unknown>
    hero: {
        badgeText: string
        title: ReactNode
        subtitle: string
        socialProofItems: SocialProofItem[]
        footer: ReactNode
    }
    loginHeading: string
    loginSubheading: string
    auditEvents: {
        loginFailed: string
        lockout: string
    }
    routes: {
        forceReset: string
        dashboard: string
        verifyOtp?: string
    }
}

// ── Component ──────────────────────────────────────────────────

export function LoginTemplate({
    onLogin,
    onVerifyOtp,
    onForgotPassword,
    hero,
    loginHeading,
    loginSubheading,
    auditEvents,
    routes,
}: LoginTemplateProps) {
    const [showOtpVerification, setShowOtpVerification] = useState(false)
    const [otp, setOtp] = useState<string[]>(Array.from({ length: OTP.LENGTH }, () => ""))
    const [otpToken, setOtpToken] = useState<string | null>(null)
    const [isVerifying, setIsVerifying] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [resetEmail, setResetEmail] = useState("")
    const [resetSent, setResetSent] = useState(false)
    const [isSendingReset, setIsSendingReset] = useState(false)
    const [error, setError] = useState("")
    const [loginAttempts, setLoginAttempts] = useState(0)
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
    const navigate = useNavigate()
    const { resolvedTheme, toggleTheme } = useTheme()
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (lockoutUntil && Date.now() < lockoutUntil) {
            const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000)
            setError(`Too many login attempts. Please try again in ${remaining} seconds.`)
            return
        }

        setIsLoading(true)

        try {
            const response = await onLogin({ email, password })
            if (response.data?.requiresPasswordChange) {
                navigate(routes.forceReset)
            } else if (response?.data?.accessToken) {
                navigate(routes.dashboard)
            } else {
                setOtpToken(response.otpToken ?? null)
                setShowOtpVerification(true)
            }
        } catch (err: unknown) {
            if (err instanceof ApiClientError) {
                auditLog(auditEvents.loginFailed, { email, reason: err.code })
                const newAttempts = loginAttempts + 1
                setLoginAttempts(newAttempts)
                if (newAttempts >= SECURITY.MAX_LOGIN_ATTEMPTS) {
                    const lockoutDuration = SECURITY.LOCKOUT_DURATION_MS
                    setLockoutUntil(Date.now() + lockoutDuration)
                    setLoginAttempts(0)
                    auditLog(auditEvents.lockout, { email, attempts: newAttempts })
                    setError("Too many failed attempts. Account locked for 1 minute.")
                    return
                }
                setError(err.message || "Invalid email or password. Please try again.")
            } else {
                setError("A network error occurred. Please check your connection and try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSendingReset(true)
        try {
            await onForgotPassword({ email: resetEmail })
            setResetSent(true)
        } catch (err: unknown) {
            if (err instanceof ApiClientError) {
                // Always show "check your inbox" to prevent email enumeration
                setResetSent(true)
            } else {
                setError("Unable to send reset email. Please try again.")
                setShowForgotPassword(false)
            }
        } finally {
            setIsSendingReset(false)
        }
    }

    const resetForgotPassword = () => {
        setShowForgotPassword(false)
        setResetSent(false)
        setResetEmail("")
    }

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < OTP.LENGTH - 1) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError("");
        try {
            const otpCode = otp.join("")
            const response = await onVerifyOtp({ otp: otpCode, otpToken: otpToken ?? "" })

            if (response.data?.requiresPasswordChange) {
                navigate(routes.forceReset)
            } else {
                navigate(routes.dashboard)
            }
        } catch (err: unknown) {
            if (err instanceof ApiClientError) {
                setError(err.message || "Invalid OTP. Please try again.")
            } else {
                setError("Verification failed. Please try again.")
            }
        } finally {
            setIsVerifying(false)
        }
    };

    const handleResendCode = async () => {
        try {
            setError("")
            const result = await onLogin({ email, password })
            setOtpToken(result.otpToken ?? null)
        } catch {
            setError("Failed to resend code. Please try again.")
        }
    };

    const handleBackToSignIn = () => {
        setShowOtpVerification(false)
        setOtp(Array.from({ length: OTP.LENGTH }, () => ""))
        setOtpToken(null)
        setError("")
        setIsVerifying(false)
    };

    const isOtpComplete = otp.every(slot => slot !== "");

    return (
        <>
            <div className="min-h-screen flex selection:bg-brand/30">
                {/* Left Side - Hero Section */}
                <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-auth-panel">
                    {/* Dynamic Background */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/[0.06] dark:bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-overlay" />
                    </div>

                    <div className="relative z-10 w-full flex flex-col justify-between p-16">
                        {/* Top Brand */}
                        <div className="flex items-center gap-3 animate-hero-fade">
                            <Logo size="lg" variant={resolvedTheme === "dark" ? "light" : "default"} />
                        </div>

                        {/* Main Text Content */}
                        <div className="max-w-xl">
                            <div className="space-y-6 animate-hero-fade-d1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand-light text-xs font-bold uppercase tracking-wider">
                                    <Zap className="w-3 h-3" />
                                    {hero.badgeText}
                                </div>
                                <h1 className="text-6xl font-bold text-foreground leading-[1.1]">
                                    {hero.title}
                                </h1>
                                <p className="text-muted-foreground text-xl leading-relaxed">
                                    {hero.subtitle}
                                </p>
                            </div>

                            {/* Social Proof */}
                            <div className="mt-12 pt-12 border-t border-foreground/5 grid grid-cols-2 gap-8 animate-hero-fade-d2">
                                {hero.socialProofItems.map((item) => (
                                    <div key={item.title} className="space-y-2">
                                        <div className="flex items-center gap-2 text-foreground font-semibold">
                                            {item.icon}
                                            {item.title}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-4 text-muted-foreground animate-hero-fade-d3">
                            {hero.footer}
                        </div>
                    </div>
                </div>

                {/* Right Side - Form Section */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 bg-background relative">
                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                        className="absolute top-6 right-6 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
                    >
                        {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>

                    {showForgotPassword ? (
                        <div key="forgot" className="w-full max-w-[440px] space-y-10 animate-content-fade">
                            {resetSent ? (
                                <div className="text-center space-y-8">
                                    <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="w-10 h-10 text-primary" />
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Check your inbox</h2>
                                        <p className="text-muted-foreground">
                                            We sent a password reset link to <span className="font-semibold text-foreground">{resetEmail}</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground/70">
                                            Didn't receive it? Check your spam folder or try again.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={resetForgotPassword}
                                        className="h-12 px-8 rounded-xl"
                                    >
                                        Back to sign in
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center lg:text-left space-y-4">
                                        <div className="w-14 h-14 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                                            <Lock className="w-7 h-7 text-brand" />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Reset your password</h2>
                                            <p className="text-muted-foreground">Enter your email and we'll send a reset link.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="reset-email" className="text-sm font-semibold opacity-80">Email</Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-brand transition-colors" />
                                                <Input
                                                    id="reset-email"
                                                    type="email"
                                                    autoComplete="email"
                                                    placeholder="name@company.com"
                                                    value={resetEmail}
                                                    onChange={(e) => setResetEmail(e.target.value)}
                                                    className="h-12 pl-11 bg-background/50 border-border/50 focus:border-brand/50 focus:ring-brand/20 rounded-xl"
                                                    required
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            variant="gradient"
                                            className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:-translate-y-0.5 transition-all"
                                            disabled={isSendingReset}
                                        >
                                            {isSendingReset ? (
                                                <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-[3px] border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            <span>Sending link...</span>
                                                </div>
                                            ) : (
                                                <span>Send reset link</span>
                                            )}
                                        </Button>
                                    </form>

                                    <div className="pt-6 border-t border-border/40 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Remember your password?{" "}
                                            <button
                                                type="button"
                                                onClick={resetForgotPassword}
                                                className="text-brand hover:text-brand-dark font-bold transition-colors"
                                            >
                                                Back to sign in
                                            </button>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : showOtpVerification ? (
                        <div className="w-full max-w-[440px] space-y-10 animate-in fade-in zoom-in-95 duration-500">
                            <div className="text-center lg:text-left space-y-4">
                                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto lg:mx-0">
                                    <Mail className="w-7 h-7 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Verify your identity</h2>
                                    <p className="text-muted-foreground">
                                        Enter the {OTP.LENGTH}-digit code sent to <span className="font-semibold text-foreground">{email}</span>
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleVerify} className="space-y-8">
                                {error && (
                                    <div
                                        className="flex items-center gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-banner-in"
                                        role="alert"
                                    >
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div className="flex justify-center lg:justify-start gap-2 sm:gap-3">
                                        {otp.map((digit, index) => (
                                            <div key={index}>
                                                <Input
                                                    ref={(el) => { otpInputRefs.current[index] = el }}
                                                    id={`otp-${index}`}
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="one-time-code"
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                                    className="w-11 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-xl border-border/50 bg-background/50 focus:border-primary/50 focus:ring-primary/20 transition-all shadow-sm p-0"
                                                />
                                                {index === OTP.SEPARATOR_AFTER_INDEX && (
                                                    <div className="flex items-center text-muted-foreground/30 font-light">-</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
                                    disabled={isVerifying || !isOtpComplete}
                                >
                                    {isVerifying ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-[3px] border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            <span>Verifying...</span>
                                        </div>
                                    ) : (
                                        <span>Verify code</span>
                                    )}
                                </Button>
                            </form>

                            <div className="pt-6 border-t border-border/40 text-center space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Didn't receive a code?{" "}
                                    <button
                                        type="button"
                                        onClick={handleResendCode}
                                        className="text-primary hover:text-primary/80 font-bold transition-colors"
                                    >
                                        Resend code
                                    </button>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <button onClick={handleBackToSignIn} className="text-primary hover:text-primary/80 font-bold transition-colors inline-flex items-center justify-center gap-1">
                                        <ArrowRight className="w-4 h-4 rotate-180" /> Back to sign in
                                    </button>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div key="login" className="w-full max-w-[440px] space-y-10 animate-content-fade">
                            {/* Header */}
                            <div className="text-center lg:text-left space-y-2">
                                <h2 className="text-3xl font-bold tracking-tight text-foreground">{loginHeading}</h2>
                                <p className="text-muted-foreground">{loginSubheading}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div
                                        className="flex items-center gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-banner-in"
                                        role="alert"
                                    >
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold opacity-80">Email</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-brand transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError("") }}
                                            className="h-12 pl-11 bg-background/50 border-border/50 focus:border-brand/50 focus:ring-brand/20 rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-sm font-semibold opacity-80">Password</Label>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotPassword(true)}
                                            className="text-xs font-bold text-brand hover:text-brand-dark transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground group-focus-within:text-brand transition-colors" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setError("") }}
                                            className="h-12 pl-11 pr-11 bg-background/50 border-border/50 focus:border-brand/50 focus:ring-brand/20 rounded-xl"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="gradient"
                                    className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-brand/20 hover:shadow-brand/40 hover:-translate-y-0.5 transition-all"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-[3px] border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            <span>Verifying account...</span>
                                        </div>
                                    ) : (
                                        <span>Sign In</span>
                                    )}
                                </Button>
                            </form>

                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
