import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function Connect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Post-OAuth landing: the backend has already exchanged the code, created
    // the session cookie, and redirected here. We show a brief "finalizing"
    // state, then move the user into the dashboard.
    const timer = setTimeout(() => {
      setLocation("/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="sg-app-bg min-h-screen flex items-center justify-center p-4">
      <div className="sg-glass max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6 relative">
          <img src="/logo-icon.png" alt="Micro SaaS" className="w-14 h-14 object-contain relative z-10" />
          <div className="absolute inset-0 opacity-20 rounded-2xl animate-ping" style={{ background: "#6366f1" }}></div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Connecting Workspace</h2>
        <p className="mb-8" style={{ color: "#94a3b8" }}>Authenticating with Google and establishing a secure connection…</p>

        <div className="flex flex-col items-center gap-3 text-sm font-medium" style={{ color: "#cbd5e1" }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#818cf8" }} />
          Finalizing setup
        </div>
      </div>
    </div>
  );
}
