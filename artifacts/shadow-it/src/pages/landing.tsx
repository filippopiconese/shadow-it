import { useEffect, useState } from "react";
import { Lock, Search, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";

const HUB_URL = "https://www.micro-saas.it";
const CONTACT_URL = "https://www.micro-saas.it/contatti";

// Friendly messages for the ?error= param the OAuth flow redirects back with.
const ERROR_MESSAGES: Record<string, string> = {
  oauth_not_configured: "Google sign-in isn't configured on this server yet. In local dev, use “View live demo”.",
  not_admin: "You must sign in with a Google Workspace super-admin account to connect a workspace.",
  oauth_failed: "Google sign-in failed. Please try again.",
  session: "Could not start your session. Please try again.",
  invalid_account: "We couldn't read your Google account. Please try again.",
  missing_code: "Google sign-in was cancelled.",
};

export function LandingPage() {
  const authError = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("error") : null;
  const errorMessage = authError ? (ERROR_MESSAGES[authError] ?? "Something went wrong during sign-in.") : null;

  // Show the demo button whenever the backend's dev routes are available
  // (non-production). Hidden automatically in real production.
  const [demoEnabled, setDemoEnabled] = useState(false);
  useEffect(() => {
    fetch("/api/demo/enabled")
      .then((r) => setDemoEnabled(r.ok))
      .catch(() => setDemoEnabled(false));
  }, []);

  const handleConnect = () => {
    window.location.href = "/api/auth/google";
  };

  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  // Seed a sandboxed demo workspace and jump into the dashboard.
  const handleDemo = async () => {
    setDemoError(null);
    setDemoLoading(true);
    try {
      const res = await fetch("/api/demo/login", { method: "POST", credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { redirect?: string };
        window.location.href = data.redirect ?? "/dashboard";
        return;
      }
      let detail = `HTTP ${res.status}`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body?.error) detail = body.error;
      } catch {
        /* response had no JSON body */
      }
      console.error("Demo login failed:", res.status, detail);
      setDemoError(`The live demo is temporarily unavailable (${detail}). Please try again shortly.`);
    } catch (err) {
      console.error("Demo login error:", err);
      setDemoError("Couldn't reach the server. Please try again shortly.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="sg-app-bg min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: "rgba(7,11,26,0.9)", backdropFilter: "blur(20px) saturate(1.8)", WebkitBackdropFilter: "blur(20px) saturate(1.8)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="sg-accent-bar" />
        <div className="max-w-6xl w-full mx-auto px-6 flex items-center justify-between gap-4 min-h-[56px]">
          <a href="/" className="flex items-center">
            <Logo size={38} />
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={handleConnect} className="hidden sm:inline-flex text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-full transition-colors">Log in</button>
            {demoEnabled && (
              <button onClick={handleDemo} disabled={demoLoading} data-testid="demo-button" className="inline-flex items-center text-sm font-semibold text-slate-200 px-4 py-2 rounded-full transition-colors disabled:opacity-60" style={{ border: "1px solid rgba(148,163,184,0.35)" }}>
                {demoLoading ? "Loading…" : "View live demo"}
              </button>
            )}
            <button onClick={handleConnect} className="inline-flex items-center gap-2 text-sm font-extrabold text-white px-5 py-2.5 rounded-full" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)", boxShadow: "0 8px 28px rgba(99,102,241,0.4)" }}>
              Connect Workspace
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {(errorMessage || demoError) && (
          <div className="max-w-3xl mx-auto px-6 pt-6">
            <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#fca5a5" }} />
              <p className="text-sm" style={{ color: "#fecaca" }}>{errorMessage ?? demoError}</p>
            </div>
          </div>
        )}

        {/* Hero */}
        <section className="sg-fade-up py-20 md:py-32 px-6 text-center max-w-4xl mx-auto">
          <span className="sg-badge">Google Workspace Security</span>
          <h1 className="mt-6 mb-6 font-extrabold text-white leading-[1.03]" style={{ fontSize: "clamp(38px,7vw,66px)" }}>
            Discover the apps your team is{" "}
            <span className="sg-gradient-text">secretly using.</span>
          </h1>
          <p className="text-lg md:text-xl mx-auto max-w-2xl mb-10" style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            Shadow IT is the number one vector for data leaks. ShadowGuard scans your Google
            Workspace to find every unauthorized OAuth app connected by your employees — scored by risk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={handleConnect} className="inline-flex items-center justify-center gap-2 h-14 px-8 text-lg font-extrabold text-white rounded-full" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)", boxShadow: "0 10px 34px rgba(99,102,241,0.45)" }}>
              Connect Google Workspace <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-4 text-sm" style={{ color: "#94a3b8" }}>Takes 30 seconds. Read-only access.</p>
        </section>

        {/* How it works */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-14">Clear visibility in three steps</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Lock, title: "1. Connect securely", text: "Sign in with your Google Workspace super-admin account and approve read-only access — takes 30 seconds, no setup, free during launch." },
                { icon: Search, title: "2. We scan for risks", text: "Our engine analyzes every OAuth token granted by your users, categorizing apps by permissions and risk level." },
                { icon: AlertCircle, title: "3. Mitigate instantly", text: "Review high-risk applications, see exactly who is using them, and act directly from your dashboard." },
              ].map((step) => (
                <div key={step.title} className="sg-glass p-7 text-left">
                  <span className="inline-flex w-12 h-12 rounded-xl items-center justify-center mb-5" style={{ background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.3)" }}>
                    <step.icon className="w-6 h-6" style={{ color: "#a5b4fc" }} />
                  </span>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing — launch offer */}
        <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto" style={{ scrollMarginTop: "72px" }}>
          {/* Launch banner */}
          <div className="sg-glass p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 mb-12" style={{ borderColor: "rgba(99,102,241,0.35)" }}>
            <div className="text-4xl">🚀</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">Launch offer — all features free</h3>
              <p className="text-sm" style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                ShadowGuard is free during the launch period. Connect now to get full access with no
                commitment — when paid plans launch, early adopters keep their access.
              </p>
            </div>
            <button onClick={handleConnect} className="inline-flex items-center justify-center gap-2 h-12 px-7 text-base font-extrabold text-white rounded-full shrink-0" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)", boxShadow: "0 8px 28px rgba(99,102,241,0.4)" }}>
              Connect free <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: "#64748b" }}>What's coming after launch</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="sg-glass p-8 relative">
              <span className="absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>Coming soon</span>
              <h3 className="text-2xl font-bold text-white">Free</h3>
              <div className="flex items-baseline gap-1 mt-2 mb-2">
                <span className="text-5xl font-extrabold text-white">€0</span>
                <span className="font-medium" style={{ color: "#94a3b8" }}>/month</span>
              </div>
              <p className="mb-6" style={{ color: "#94a3b8" }}>Core visibility for teams getting started.</p>
              <ul className="space-y-3">
                {[
                  "Manual workspace scans",
                  "OAuth app inventory & risk scoring",
                  "Per-app scopes & authorized users",
                  "CSV export",
                ].map((label) => (
                  <li key={label} className="flex items-center gap-3 text-sm" style={{ color: "#e2e8f0" }}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#22d3ee" }} />
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="sg-glass p-8 relative" style={{ borderColor: "rgba(99,102,241,0.4)" }}>
              <span className="absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>Coming soon</span>
              <h3 className="text-2xl font-bold text-white">Pro</h3>
              <p className="text-sm mt-1 mb-2" style={{ color: "#94a3b8" }}>For teams that need continuous coverage.</p>
              <p className="mb-6" style={{ color: "#cbd5e1" }}>Full automation & alerting.</p>
              <ul className="space-y-3">
                {[
                  "Everything in Free",
                  "Automatic scheduled scans (daily)",
                  "New high-risk app email alerts",
                  "Revoked-app history & scan diff",
                  "Exposure-aware risk scoring",
                  "Priority email support",
                ].map((label) => (
                  <li key={label} className="flex items-center gap-3 text-sm" style={{ color: "#e2e8f0" }}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#22d3ee" }} />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="pt-14 pb-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Logo size={44} showSub={false} wordmarkClassName="text-lg text-white" />
              <p className="mt-4 text-sm max-w-xs" style={{ color: "#94a3b8", lineHeight: 1.6 }}>
                Visibilità sullo shadow IT del tuo Google Workspace. Una micro-app verticale della famiglia Micro&nbsp;SaaS.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#cbd5e1" }}>Prodotto</h4>
              <ul className="space-y-2 text-sm" style={{ color: "#94a3b8" }}>
                <li><button onClick={handleConnect} className="hover:text-slate-200">Connect Workspace</button></li>
                <li><a href="#pricing" className="hover:text-slate-200">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#cbd5e1" }}>Legal &amp; Micro SaaS</h4>
              <ul className="space-y-2 text-sm" style={{ color: "#94a3b8" }}>
                <li><a href="/privacy" className="hover:text-slate-200">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-slate-200">Terms of Service</a></li>
                <li><a href={CONTACT_URL} target="_blank" rel="noopener" className="hover:text-slate-200">Contatti</a></li>
                <li><a href={HUB_URL} target="_blank" rel="noopener" className="hover:text-slate-200">www.micro-saas.it</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 text-center text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}>
            © {new Date().getFullYear()} Micro SaaS — Filippo Piconese. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
