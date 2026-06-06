import { useEffect } from "react";
import { useListScans, useTriggerScan, getListScansQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Activity, Play, CheckCircle2, XCircle, Loader2, Calendar, AppWindow, Sparkles, MinusCircle } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export function Scans() {
  const queryClient = useQueryClient();
  const { data: scans, isLoading } = useListScans({
    query: { queryKey: getListScansQueryKey() },
  });
  const triggerScan = useTriggerScan();
  const { toast } = useToast();

  const hasRunning = scans?.some((s) => s.status === "running" || s.status === "pending");

  useEffect(() => {
    if (!hasRunning) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
    }, 3000);
    return () => clearInterval(interval);
  }, [hasRunning, queryClient]);

  const handleTriggerScan = () => {
    triggerScan.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Scan Started", description: "Scanning your Google Workspace for OAuth apps." });
        queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
      },
      onError: (err) => {
        const message = (err as { error?: string }).error ?? "Could not start scan.";
        toast({ title: "Scan Failed", description: message, variant: "destructive" });
      },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "failed": return <XCircle className="w-5 h-5 text-red-500" />;
      case "running":
      case "pending": return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Completed</Badge>;
      case "failed": return <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">Failed</Badge>;
      case "running": return <Badge className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/15">Running</Badge>;
      case "pending": return <Badge variant="secondary" className="bg-muted text-foreground border border-border">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Scan History</h1>
          <p className="text-muted-foreground mt-1">Record of all workspace security scans.</p>
        </div>
        <Button
          onClick={handleTriggerScan}
          disabled={triggerScan.isPending || !!hasRunning}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        >
          {triggerScan.isPending || hasRunning ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {hasRunning ? "Scan in progress..." : "Run New Scan"}
        </Button>
      </div>

      {hasRunning && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 flex items-center gap-3">
          <div className="relative">
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-200">Scan in progress</p>
            <p className="text-xs text-indigo-300/80 mt-0.5">Checking all users in your Google Workspace for OAuth tokens. This may take a few minutes.</p>
          </div>
        </div>
      )}

      <Card className="border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : scans && scans.length > 0 ? (
          <div className="divide-y divide-border">
            {scans.map((scan) => (
              <div key={scan.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
                    {getStatusIcon(scan.status)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                      Scan #{scan.id}
                      <span className="sm:hidden">{getStatusBadge(scan.status)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(scan.startedAt), "MMM d, yyyy h:mm a")}
                      </span>
                      {scan.status === "completed" && (
                        <>
                          <span className="flex items-center gap-1">
                            <AppWindow className="w-3.5 h-3.5" />
                            <strong className="text-foreground">{scan.appsFound}</strong> apps found
                          </span>
                          {(scan.newAppsFound ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-indigo-400">
                              <Sparkles className="w-3.5 h-3.5" />
                              {scan.newAppsFound} new
                            </span>
                          )}
                          {(scan.removedAppsFound ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <MinusCircle className="w-3.5 h-3.5" />
                              {scan.removedAppsFound} revoked
                            </span>
                          )}
                        </>
                      )}
                      {scan.status === "running" && (
                        <span className="text-indigo-400 animate-pulse">Scanning workspace…</span>
                      )}
                      {scan.errorMessage && (
                        <span className="text-red-600 truncate max-w-xs text-xs" title={scan.errorMessage}>
                          {scan.errorMessage.substring(0, 80)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1.5">
                  {getStatusBadge(scan.status)}
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(scan.startedAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center text-muted-foreground">
            <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No scan history</h3>
            <p className="text-sm mb-6">Run your first scan to discover OAuth apps in your workspace.</p>
            <Button onClick={handleTriggerScan} variant="outline">
              <Play className="w-4 h-4 mr-2" /> Run your first scan
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
