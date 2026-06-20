import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { LayoutDashboard, Grid, Activity, CreditCard, Settings as SettingsIcon, LogOut, Loader2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: user, isLoading } = useGetMe();
  const logout = useLogout();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center sg-app-bg">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user && location !== "/") {
    setLocation("/");
    return null;
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/")
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/apps", label: "Discovered Apps", icon: Grid },
    { href: "/scans", label: "Scan History", icon: Activity },
    { href: "/billing", label: "Plan", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full text-slate-300" style={{ background: "linear-gradient(180deg,#070b1a,#0b1226)" }}>
      <div className="p-6">
        <Logo size={38} subClassName="text-slate-500" />
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const active = location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                active 
                  ? "bg-slate-800 text-white font-medium" 
                  : "hover:bg-slate-800 hover:text-white"
              }`}>
                <item.icon className={`w-4 h-4 ${active ? "text-indigo-400" : "text-slate-400"}`} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="w-9 h-9 border border-slate-700">
              <AvatarImage src={user.picture || ""} />
              <AvatarFallback className="bg-slate-800 text-slate-300">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-slate-500 truncate">{user.domain}</div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );

  if (!user && location === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex sg-app-bg">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0">
        <SidebarContent />
      </div>

      {/* Mobile Header & Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {user?.domain === "demo-acme.com" && (
          <div className="bg-indigo-500/15 border-b border-indigo-500/30 px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
            <span className="text-indigo-200">👀 You're exploring <strong>sample demo data</strong> — connect your workspace to scan your own apps.</span>
            <button onClick={() => { window.location.href = "/api/auth/google"; }} className="font-semibold text-white underline hover:no-underline">
              Google Workspace →
            </button>
            <button onClick={() => { window.location.href = "/api/auth/microsoft"; }} className="font-semibold text-white underline hover:no-underline">
              Microsoft 365 →
            </button>
          </div>
        )}
        <header className="md:hidden h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-10">
          <Logo size={28} showSub={false} wordmarkClassName="text-base text-foreground" />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-slate-800">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
