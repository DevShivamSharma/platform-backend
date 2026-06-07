import { Outlet } from "react-router-dom";
import { config } from "@/lib/config";
import { getIcon } from "@/engine/icons";

function renderHeadline(headline: string, highlightText?: string) {
  if (!highlightText || !headline.includes(highlightText)) return headline;
  const [before, after] = headline.split(highlightText);
  return (
    <>
      {before}
      <span className="text-primary">{highlightText}</span>
      {after}
    </>
  );
}

export function AuthLayout() {
  const login = config.loginPage;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />

      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />
      <div className="absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-[var(--brand-accent)]/10 blur-2xl animate-[pulse_12s_ease-in-out_infinite_4s]" />

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_28rem]">
        <section className="hidden max-w-2xl lg:block">
          <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {login.badge}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {renderHeadline(login.headline, login.highlightText)}
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">{login.description}</p>
          <div className="mt-8 grid max-w-xl gap-3">
            {login.features.map((feature) => {
              const Icon = getIcon(feature.icon);
              return (
                <div key={feature.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm backdrop-blur">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold">{feature.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <Outlet />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
    </div>
  );
}
