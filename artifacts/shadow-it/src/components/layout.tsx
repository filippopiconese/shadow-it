import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Shield, LayoutDashboard, Grid, Activity, CreditCard, LogOut, Loader2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: user, isLoading } = useGetMe();
  const logout = useLogout();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
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
    { href: "/billing", label: "Billing", icon: CreditCard },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      <div className="p-6 flex items-center gap-3 text-white">
        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold tracking-tight text-lg">ShadowGuard</span>
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
                <item.icon className={`w-4 h-4 ${active ? "text-blue-400" : "text-slate-400"}`} />
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
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0">
        <SidebarContent />
      </div>

      {/* Mobile Header & Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="md:hidden h-14 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-900">ShadowGuard</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-600">
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
