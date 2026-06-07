import { useTheme } from "@/lib/theme-provider";
import { Logo } from "./ui/logo";
import { ArrowRight, Mail, Moon, Sun, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

interface SocialProofItem {
    icon: ReactNode
    title: string
    description: string
}

interface LoginTemplateProps {
    onLogin: (credentials: { email: string; password: string }) => Promise<{ data?: { requiresPasswordChange?: boolean } }>
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
        dashboard: string
    }
}

export function VerifyOtpTemplate({
    hero,
    loginHeading,
    loginSubheading,
    auditEvents: _auditEvents,
    routes: _routes,
}: LoginTemplateProps) {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isVerifying, setIsVerifying] = useState(false);
    const { resolvedTheme, toggleTheme } = useTheme();

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setTimeout(() => setIsVerifying(false), 2000);
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


                    <div className="w-full max-w-[440px] space-y-10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="text-center lg:text-left space-y-4">
                            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto lg:mx-0">
                                <Mail className="w-7 h-7 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold tracking-tight text-foreground">{loginHeading}</h2>
                                <p className="text-muted-foreground">
                                    {loginSubheading}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-center lg:justify-start gap-2 sm:gap-3">
                                    {otp.map((digit, index) => (
                                        <div key={index}>
                                            <Input
                                                id={`otp-${index}`}
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                className="w-11 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-xl border-border/50 bg-background/50 focus:border-primary/50 focus:ring-primary/20 transition-all shadow-sm p-0"
                                            />
                                            {index === 2 && (
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
                                    className="text-primary hover:text-primary/80 font-bold transition-colors"
                                >
                                    Resend code
                                </button>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                <Link to="/login" className="text-primary hover:text-primary/80 font-bold transition-colors inline-flex items-center justify-center gap-1">
                                    <ArrowRight className="w-4 h-4 rotate-180" /> Back to sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}