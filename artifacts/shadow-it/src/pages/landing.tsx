import { Lock, Search, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";

const HUB_URL = "https://www.micro-saas.it";
const CONTACT_URL = "https://www.micro-saas.it/contatti";

export function LandingPage() {
  const handleConnect = () => {
    window.location.href = "/api/auth/google";
  };

  // Dev-only: seed a demo workspace and jump straight into the dashboard,
  // bypassing Google OAuth. Stripped from production builds.
  const handleDemo = async () => {
    const res = await fetch("/api/dev/login", { method: "POST", credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { redirect?: string };
      window.location.href = data.redirect ?? "/dashboard";
    } else {
      alert("Demo login failed. Is the API server running?");
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
            {import.meta.env.DEV && (
              <button onClick={handleDemo} data-testid="demo-button" className="inline-flex items-center text-sm font-semibold text-slate-200 px-4 py-2 rounded-full transition-colors" style={{ border: "1px solid rgba(148,163,184,0.35)" }}>
                View live demo
              </button>
            )}
            <button onClick={handleConnect} className="inline-flex items-center gap-2 text-sm font-extrabold text-white px-5 py-2.5 rounded-full" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)", boxShadow: "0 8px 28px rgba(99,102,241,0.4)" }}>
              Connect Workspace
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
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
                { icon: Lock, title: "1. Connect securely", text: "Authenticate with your Google Workspace admin account. We only request token read permissions — never write access." },
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

        {/* Pricing */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Simple, transparent pricing</h2>
            <p className="text-lg" style={{ color: "#94a3b8" }}>Protect your entire organization for one flat monthly rate — no per-user fees.</p>
          </div>

          <div className="sg-glass max-w-lg mx-auto overflow-hidden">
            <div className="p-8 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="sg-badge mb-4">Pro Plan</span>
              <div className="flex items-baseline justify-center gap-1 mt-4 mb-2">
                <span className="text-6xl font-extrabold sg-gradient-text">€39</span>
                <span className="font-medium" style={{ color: "#94a3b8" }}>/month</span>
              </div>
              <p style={{ color: "#94a3b8" }}>Unlimited users, unlimited scans.</p>
            </div>
            <div className="p-8">
              <ul className="space-y-4 mb-8">
                {[
                  "Daily automated background scans",
                  "High-risk application alerts",
                  "Detailed OAuth scope analysis",
                  "Per-app authorized users breakdown",
                  "Exportable compliance reports (CSV)",
                  "Priority support",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#22d3ee" }} />
                    <span className="font-medium" style={{ color: "#e2e8f0" }}>{feature}</span>
                  </li>
                ))}
              </ul>
              <button onClick={handleConnect} className="w-full h-12 text-lg font-extrabold text-white rounded-full" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)", boxShadow: "0 8px 28px rgba(99,102,241,0.4)" }}>
                Start 14-day free trial
              </button>
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
              <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#cbd5e1" }}>Micro SaaS</h4>
              <ul className="space-y-2 text-sm" style={{ color: "#94a3b8" }}>
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
