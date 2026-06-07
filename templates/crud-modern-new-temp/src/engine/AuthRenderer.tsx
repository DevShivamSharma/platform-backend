import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/core/auth/auth.context";
import { config, getHomePath, hasSignup } from "@/lib/config";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { notify } from "@/lib/toast";

export function AuthRenderer() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const redirect = params.get("redirect") || getHomePath();
  const signupEnabled = hasSignup();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (mode === "signup") {
        await register(email, password, name);
        notify.success("Account created");
      } else {
        await login(email, password);
        notify.success("Signed in");
      }
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="rounded-2xl border-border/60 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <CardContent className="p-8">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            {config.logo ? (
              <img src={config.logo} alt="" className="h-12 w-12 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-primary-foreground shadow-lg"
                style={{ background: "var(--primary-gradient, var(--primary))" }}
              >
                {config.logoInitials}
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Sign in" : "Create account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? config.portalName : config.appName}
            </p>
          </div>

          {!isSupabaseConfigured ? (
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-5 text-center">
              <Settings className="mx-auto mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Supabase configuration required</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication.
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="grid gap-4">
                {mode === "signup" && (
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((value) => !value)}
                      className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-primary-foreground"
                  style={{ background: "var(--primary-gradient, var(--primary))" }}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "login" ? "Sign in" : "Create account"}
                </Button>
              </form>

              {signupEnabled && (
                <p className="mt-5 text-center text-sm text-muted-foreground">
                  {mode === "login" ? "Need access?" : "Already have access?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setError("");
                    }}
                    className="font-medium underline-offset-4 hover:underline"
                    style={{ color: "var(--primary)" }}
                  >
                    {mode === "login" ? "Create account" : "Sign in"}
                  </button>
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
