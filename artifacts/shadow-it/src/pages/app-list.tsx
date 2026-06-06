import { useState, useCallback } from "react";
import { Link } from "wouter";
import { useListApps, useDismissApp, type ListAppsRisk } from "@workspace/api-client-react";
import { getListAppsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/risk-badge";
import { useToast } from "@/hooks/use-toast";
import { Search, AppWindow, Users, Filter, ArrowRight, Download, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useCallback(() => {}, [])
  import("react").then(({ useEffect }) => {});
  // Simple debounce via state + setTimeout
  useState(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  });
  return debounced;
}

export function AppList() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<ListAppsRisk | "all">("all");
  const [showDismissed, setShowDismissed] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dismissApp = useDismissApp();

  const { data: apps, isLoading } = useListApps({
    search: search.trim() || undefined,
    risk: riskFilter === "all" ? undefined : riskFilter,
  });

  const displayed = apps
    ? showDismissed
      ? apps
      : apps.filter((a) => !a.isDismissed)
    : [];

  const dismissedCount = apps ? apps.filter((a) => a.isDismissed).length : 0;

  const handleDismiss = (e: React.MouseEvent, appId: number) => {
    e.preventDefault();
    e.stopPropagation();
    dismissApp.mutate({ appId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAppsQueryKey() });
        toast({ title: "App reviewed", description: "Marked as approved." });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not dismiss app.", variant: "destructive" });
      },
    });
  };

  const handleExportCsv = () => {
    if (!apps || apps.length === 0) return;
    const headers = ["App Name", "Category", "Risk Level", "Risk Score", "Users", "Scopes", "First Seen", "Reviewed"];
    const rows = displayed.map((a) => [
      `"${a.appName}"`,
      `"${a.category}"`,
      a.riskLevel,
      a.riskScore,
      a.userCount,
      `"${a.scopes.join("; ")}"`,
      format(new Date(a.firstSeenAt), "yyyy-MM-dd"),
      a.isDismissed ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shadow-it-apps-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${displayed.length} apps exported to CSV.` });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Discovered Apps</h1>
          <p className="text-muted-foreground mt-1">All third-party OAuth applications connected to your workspace.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDismissed((v) => !v)}
            className="text-muted-foreground border-border"
          >
            {showDismissed ? <EyeOff className="w-4 h-4 mr-1.5" /> : <Eye className="w-4 h-4 mr-1.5" />}
            {showDismissed ? "Hide reviewed" : `Show reviewed (${dismissedCount})`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!apps || apps.length === 0}
            className="text-muted-foreground border-border"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by app name..."
            className="pl-9 border-border focus-visible:ring-blue-500 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="bg-card border border-border rounded-md flex items-center px-3 h-10 shadow-sm shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground mr-2" />
          <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as ListAppsRisk | "all")}>
            <SelectTrigger className="border-0 shadow-none focus:ring-0 p-0 h-auto w-[130px] text-sm">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(search || riskFilter !== "all") && apps && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing {displayed.length} of {apps.length} apps</span>
          <button
            onClick={() => { setSearch(""); setRiskFilter("all"); }}
            className="text-indigo-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <Card className="border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : displayed.length > 0 ? (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-12 gap-4 p-3 text-xs font-semibold text-muted-foreground bg-muted/60 border-b border-border uppercase tracking-wider">
              <div className="col-span-5">Application</div>
              <div className="col-span-2 text-center">Risk</div>
              <div className="col-span-2 text-center">Users</div>
              <div className="col-span-2 text-right">First Seen</div>
              <div className="col-span-1 text-right">Action</div>
            </div>
            {displayed.map((app) => (
              <Link key={app.id} href={`/apps/${app.id}`}>
                <div className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors cursor-pointer group ${app.isDismissed || app.status === "removed" ? "opacity-60" : ""}`}>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center shrink-0">
                      {app.iconUrl ? (
                        <img src={app.iconUrl} alt={app.appName} className="w-6 h-6 object-contain" />
                      ) : (
                        <AppWindow className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground group-hover:text-indigo-400 transition-colors truncate flex items-center gap-2">
                        {app.appName}
                        {app.status === "removed" && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50 font-normal py-0 px-1.5">Revoked</Badge>
                        )}
                        {app.isDismissed && (
                          <Badge variant="outline" className="text-xs text-muted-foreground border-border font-normal py-0 px-1.5">Reviewed</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{app.category}</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <RiskBadge level={app.riskLevel} />
                  </div>
                  <div className="col-span-2 flex items-center justify-center text-sm font-medium text-foreground">
                    <Users className="w-4 h-4 mr-1.5 text-muted-foreground" />
                    {app.userCount}
                  </div>
                  <div className="col-span-2 text-right text-sm text-muted-foreground">
                    {format(new Date(app.firstSeenAt), "MMM d, yyyy")}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {!app.isDismissed ? (
                      <button
                        onClick={(e) => handleDismiss(e, app.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600"
                        title="Mark as reviewed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No applications found</h3>
            <p className="text-sm">
              {apps && apps.length > 0
                ? "No apps match your current filters."
                : "Run a scan to discover OAuth apps in your workspace."}
            </p>
            {(search || riskFilter !== "all") && (
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setRiskFilter("all"); }}>
                Clear filters
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
