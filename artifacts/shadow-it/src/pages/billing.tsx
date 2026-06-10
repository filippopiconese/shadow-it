import { useGetBillingStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";

const FREE_FEATURES = [
  "Manual workspace scans",
  "OAuth app inventory & risk scoring",
  "Per-app scopes & authorized users",
  "CSV export",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Automatic scheduled scans (daily)",
  "New high-risk app email alerts",
  "Revoked-app history & scan diff",
  "Exposure-aware risk scoring",
  "Priority email support",
];

export function Billing() {
  const { data: status, isLoading } = useGetBillingStatus();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Plan & Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your ShadowGuard plan.</p>
      </div>

      {/* Launch offer */}
      <Card className="border-primary/40 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🚀</div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Launch plan — all features free
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-indigo-300 border border-primary/30">Active</span>
              </CardTitle>
              <CardDescription className="mt-1">
                You have full access at no cost during the launch period. No payment method required —
                when paid plans launch, early adopters keep their access.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-foreground">€0</span>
            <span className="text-muted-foreground font-medium ml-1">/month during launch</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-2">
        What's coming after launch
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <Card className="border-border shadow-sm relative">
          <span className="absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white z-10" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>Coming soon</span>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Core visibility for teams getting started.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl font-black text-foreground">€0</span>
              <span className="text-muted-foreground font-medium ml-1">/month</span>
            </div>
            <ul className="space-y-3">
              {FREE_FEATURES.map((label) => (
                <li key={label} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                  {label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="border-primary/40 shadow-sm relative">
          <span className="absolute -top-3 left-8 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white z-10" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>Coming soon</span>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>For teams that need continuous coverage.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-foreground mb-5">Full automation &amp; alerting.</p>
            <ul className="space-y-3">
              {PRO_FEATURES.map((label) => (
                <li key={label} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                  {label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Current plan: <span className="font-semibold text-foreground">{status?.plan ?? "Launch"}</span>
      </p>
    </div>
  );
}
