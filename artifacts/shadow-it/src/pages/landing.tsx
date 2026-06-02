import { Link } from "wouter";
import { Shield, Lock, Search, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">ShadowGuard</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:flex" onClick={handleConnect}>Log in</Button>
          {import.meta.env.DEV && (
            <Button variant="outline" onClick={handleDemo} data-testid="demo-button">View live demo</Button>
          )}
          <Button onClick={handleConnect}>Connect Workspace</Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-6 text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
            Secure your Google Workspace
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Discover the apps your team <br className="hidden md:block"/> is secretly using.
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Shadow IT is the number one vector for data leaks. We scan your Google Workspace to find every unauthorized OAuth app connected by your employees.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-lg" onClick={handleConnect}>
              Connect Google Workspace <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">Takes 30 seconds. Read-only access.</p>
        </section>

        {/* How it works */}
        <section className="py-20 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16">Clear visibility in three steps</h2>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                  <Lock className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold mb-3">1. Connect securely</h3>
                <p className="text-slate-600">Authenticate with your Google Workspace admin account. We only request audit log and token read permissions.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                  <Search className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold mb-3">2. We scan for risks</h3>
                <p className="text-slate-600">Our engine analyzes every OAuth token granted by your users, categorizing apps by permissions and risk level.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="text-xl font-bold mb-3">3. Mitigate instantly</h3>
                <p className="text-slate-600">Review high-risk applications, see exactly who is using them, and revoke access directly from your dashboard.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-slate-600">Protect your entire organization for one flat monthly rate.</p>
          </div>

          <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 text-center">
              <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-5xl font-extrabold">€39</span>
                <span className="text-slate-500 font-medium">/month</span>
              </div>
              <p className="text-slate-500">Unlimited users, unlimited scans.</p>
            </div>
            <div className="p-8 bg-slate-50">
              <ul className="space-y-4 mb-8">
                {[
                  "Daily automated background scans",
                  "High-risk application alerts",
                  "Detailed scope analysis",
                  "1-click access revocation",
                  "Exportable compliance reports",
                  "Priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="text-slate-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full h-12 text-lg" onClick={handleConnect}>Start 14-day free trial</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Shield className="w-5 h-5 text-slate-500" />
            <span className="font-bold text-slate-300">ShadowGuard</span>
          </div>
          <p className="text-sm">© 2025 ShadowGuard Security. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Inline badge for landing page to avoid layout import conflict
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${className}`}>
      {children}
    </span>
  );
}
