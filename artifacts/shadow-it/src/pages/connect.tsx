import { useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Loader2 } from "lucide-react";

export function Connect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // In a real app, this page is where Google redirects to with a code
    // The backend would handle it, set a cookie, and redirect here
    // Here we just simulate a brief loading state then go to dashboard
    const timer = setTimeout(() => {
      setLocation("/dashboard");
    }, 2000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
          <Shield className="w-8 h-8 text-blue-600 relative z-10" />
          <div className="absolute inset-0 bg-blue-400 opacity-20 rounded-2xl animate-ping"></div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Connecting Workspace</h2>
        <p className="text-slate-500 mb-8">Authenticating with Google and establishing secure connection...</p>
        
        <div className="flex flex-col items-center gap-3 text-sm font-medium text-slate-600">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          Finalizing setup
        </div>
      </div>
    </div>
  );
}
