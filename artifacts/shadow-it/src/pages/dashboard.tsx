import { Link } from "wouter";
import { useDocumentHead } from "@/hooks/use-document-head";
import { useGetDashboardSummary, useGetNewApps, useTriggerScan, useListScans, useGetDirectoryUsers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, ShieldCheck, Shield, Users, AppWindow, Activity, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { getListScansQueryKey, getGetDashboardSummaryQueryKey, getGetNewAppsQueryKey, getGetDirectoryUsersQueryKey } from "@workspace/api-client-react";
import { useEffect, useState } from "react";

const RISK_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

export function Dashboard() {
  useDocumentHead({ title: "Dashboard" });
  const queryClient = useQueryClient();
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: newApps, isLoading: loadingApps } = useGetNewApps();
  // Lazy: the directory roster is only fetched when the admin expands it.
  const [showUsers, setShowUsers] = useState(false);
  const { data: directory, isLoading: loadingDirectory } = useGetDirectoryUsers({
    query: { enabled: showUsers, queryKey: getGetDirectoryUsersQueryKey() },
  });
  const { data: scans } = useListScans({
    query: { queryKey: getListScansQueryKey() },
  });
  const triggerScan = useTriggerScan();
  const { toast } = useToast();

  const hasRunning = scans?.some((s) => s.status === "running" || s.status === "pending");

  useEffect(() => {
    if (!hasRunning) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetNewAppsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
    }, 5000);
    return () => clearInterval(interval);
  }, [hasRunning, queryClient]);

  const handleScan = () => {
    triggerScan.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Scan Initiated", description: "Scanning your workspace — this takes a few minutes." });
        queryClient.invalidateQueries({ queryKey: getListScansQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Scan Failed", description: (err as { error?: string }).error ?? "An unexpected error occurred.", variant: "destructive" });
      },
    });
  };

  const riskChartData =
    summary && summary.totalApps > 0
      ? [
          { name: "High", value: summary.highRiskApps, color: RISK_COLORS.high },
          { name: "Medium", value: summary.mediumRiskApps, color: RISK_COLORS.medium },
          { name: "Low", value: summary.lowRiskApps, color: RISK_COLORS.low },
        ].filter((d) => d.value > 0)
      : [];

  const reviewedCount = summary?.dismissedApps ?? 0;
  const pendingCount = summary ? summary.totalApps - summary.dismissedApps : 0;
  const reviewedPercent =
    summary && summary.totalApps > 0 ? Math.round((reviewedCount / summary.totalApps) * 100) : 0;

  const riskPercent =
    summary && summary.totalApps > 0
      ? Math.round((summary.highRiskApps / summary.totalApps) * 100)
      : 0;

  const reviewPercent =
    summary && summary.totalApps > 0
      ? Math.round((summary.dismissedApps / summary.totalApps) * 100)
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your workspace security posture.</p>
        </div>
        <div className="flex items-center gap-3">
          {summary?.lastScanAt && (
            <div className="text-sm text-muted-foreground flex items-center">
              <Clock className="w-4 h-4 mr-1.5" />
              Scanned {formatDistanceToNow(new Date(summary.lastScanAt), { addSuffix: true })}
            </div>
          )}
          {hasRunning && (
            <div className="flex items-center gap-2 text-sm text-indigo-300 font-medium bg-indigo-500/15 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Scan running…
            </div>
          )}
          <Button
            onClick={handleScan}
            disabled={triggerScan.isPending || !!hasRunning}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {triggerScan.isPending || hasRunning ? "Scanning..." : "Run Security Scan"}
          </Button>
        </div>
      </div>

      {loadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Connected Apps</CardTitle>
              <AppWindow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{summary.totalApps}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.directoryUsers != null
                  ? `${summary.directoryUsers} users scanned in your workspace`
                  : `Across ${summary.totalUsers} users`}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">High Risk Apps</CardTitle>
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{summary.highRiskApps}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.highRiskApps === 0 ? "No immediate threats" : "Require immediate attention"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Medium Risk</CardTitle>
              <Shield className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{summary.mediumRiskApps}</div>
              <p className="text-xs text-muted-foreground mt-1">Should be reviewed</p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New This Week</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-400">{summary.newAppsThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">Recently connected</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {summary && summary.directoryUsers != null && (
        <div className="text-sm">
          <button
            onClick={() => setShowUsers((v) => !v)}
            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <Users className="w-4 h-4" />
            {showUsers ? "Hide" : "Double-check"} scanned users ({summary.directoryUsers})
          </button>
          {showUsers && (
            <div className="mt-3">
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  {loadingDirectory ? (
                    <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-64" />)}</div>
                  ) : directory && directory.users.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 max-h-72 overflow-y-auto">
                      {directory.users.map((email) => (
                        <span key={email} className="text-sm text-muted-foreground truncate" title={email}>{email}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No users returned by the last scan.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Recently Discovered Risks</h2>
            <Link href="/apps" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <Card className="border-border shadow-sm overflow-hidden">
            {loadingApps ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : newApps && newApps.length > 0 ? (
              <div className="divide-y divide-border">
                {newApps.map((app) => (
                  <Link key={app.id} href={`/apps/${app.id}`}>
                    <div className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center shrink-0">
                          {app.iconUrl ? (
                            <img src={app.iconUrl} alt={app.appName} className="w-6 h-6 object-contain" />
                          ) : (
                            <AppWindow className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground group-hover:text-indigo-400 transition-colors">{app.appName}</div>
                          <div className="text-sm text-muted-foreground flex items-center mt-0.5">
                            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-medium mr-2">{app.category}</span>
                            <Users className="w-3.5 h-3.5 mr-1" /> {app.userCount} users
                          </div>
                        </div>
                      </div>
                      <RiskBadge level={app.riskLevel} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <ShieldCheck className="w-12 h-12 text-emerald-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No new risks discovered</h3>
                <p className="text-sm">Run a scan to check your workspace for unauthorized apps.</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Risk Breakdown</h2>
          {summary && summary.totalApps > 0 ? (
            <Card className="border-border shadow-sm p-4">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {riskChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [`${v} apps`, name]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #334155", background: "#0e1a38", color: "#e2e8f0", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-1">
                {[
                  { label: "High", color: RISK_COLORS.high, value: summary.highRiskApps },
                  { label: "Medium", color: RISK_COLORS.medium, value: summary.mediumRiskApps },
                  { label: "Low", color: RISK_COLORS.low, value: summary.lowRiskApps },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                    {r.label} ({r.value})
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="border-border shadow-sm p-6 text-center text-muted-foreground text-sm">
              No scan data yet. Run your first scan to see risk breakdown.
            </Card>
          )}

          <Card className="border-border shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-100 text-base">Security Posture</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">Based on latest scan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 relative z-10">
              {summary ? (
                <>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300">High Risk Exposure</span>
                      <span className="font-semibold text-white">{riskPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-700 ${riskPercent > 20 ? "bg-red-500" : riskPercent > 5 ? "bg-amber-400" : "bg-emerald-500"}`}
                        style={{ width: `${Math.max(2, riskPercent)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-300">Apps Reviewed</span>
                      <span className="font-semibold text-white">{reviewPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${reviewPercent}%` }} />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex items-start gap-2">
                    {summary.highRiskApps === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {summary.highRiskApps === 0
                        ? "No critical threats detected. Keep reviewing medium-risk apps."
                        : `${summary.highRiskApps} high-risk app${summary.highRiskApps > 1 ? "s" : ""} need immediate attention.`}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-sm text-center py-4">Run a scan to see your posture.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {summary && summary.totalApps > 0 && (
        <Card className="border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Review Progress</h2>
            <span className="text-sm text-slate-300">{reviewedCount} of {summary.totalApps} reviewed</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all duration-700"
              style={{ width: `${reviewedPercent}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-6 text-sm text-slate-200">
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Reviewed {reviewedCount}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Pending {pendingCount}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
