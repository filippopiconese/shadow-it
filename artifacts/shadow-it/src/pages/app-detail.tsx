import { useRoute, Link } from "wouter";
import { useGetApp, useDismissApp, getGetAppQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/risk-badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AppWindow, ShieldAlert, Key, Users, CheckCircle2, AlertTriangle, CalendarDays, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export function AppDetail() {
  const [, params] = useRoute("/apps/:id");
  const appId = params?.id ? parseInt(params.id) : 0;
  
  const { data: app, isLoading } = useGetApp(appId, { query: { enabled: !!appId, queryKey: getGetAppQueryKey(appId) } });
  const dismissApp = useDismissApp();
  const { toast } = useToast();

  const handleDismiss = () => {
    if (!app) return;
    
    dismissApp.mutate({ appId: app.id }, {
      onSuccess: () => {
        toast({
          title: "App Reviewed",
          description: `${app.appName} has been marked as reviewed.`,
        });
      },
      onError: (err) => {
        toast({
          title: "Error",
          description: (err as { error?: string }).error ?? "Failed to update application status.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 rounded-xl" />
          <Skeleton className="h-64 col-span-1 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-foreground">Application not found</h2>
        <Link href="/apps" className="text-indigo-400 mt-4 inline-block hover:underline">
          Return to application list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/apps" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to applications
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl border border-border bg-card flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            {app.iconUrl ? (
              <img src={app.iconUrl} alt={app.appName} className="w-10 h-10 object-contain" />
            ) : (
              <AppWindow className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {app.appName}
              {app.isDismissed && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Reviewed
                </Badge>
              )}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {app.category}
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-muted-foreground" />
                {app.userCount} authorized users
              </span>
              <span className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-1.5 text-muted-foreground" />
                Seen {format(new Date(app.firstSeenAt), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border hover:bg-muted/50">
            <ExternalLink className="w-4 h-4 mr-2" /> Admin console
          </Button>
          {!app.isDismissed && (
            <Button onClick={handleDismiss} disabled={dismissApp.isPending}>
              {dismissApp.isPending ? "Updating..." : "Mark as Reviewed"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-muted-foreground" />
                Requested Permissions (Scopes)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {app.scopeDescriptions.map((desc, idx) => {
                  const isHighRisk = desc.toLowerCase().includes('read') || desc.toLowerCase().includes('write') || desc.toLowerCase().includes('drive') || desc.toLowerCase().includes('mail');
                  return (
                    <li key={idx} className="p-4 flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isHighRisk ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${isHighRisk ? 'text-foreground' : 'text-foreground'}`}>{desc}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1 mt-1 break-all">{app.scopes[idx]}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                Authorized Users
              </CardTitle>
              <CardDescription>Users who have granted access to this application</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {app.authorizedUsers.map(email => (
                  <Badge key={email} variant="secondary" className="bg-muted text-foreground hover:bg-muted/70 font-normal py-1 px-3">
                    {email}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={`border-border shadow-sm overflow-hidden ${
            app.riskLevel === 'high' ? 'border-red-200 ring-1 ring-red-100' : ''
          }`}>
            <div className={`h-2 w-full ${
              app.riskLevel === 'high' ? 'bg-red-500' : 
              app.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            <CardHeader className="pb-4">
              <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-5xl font-black tracking-tighter text-foreground">{app.riskScore}</div>
                  <div className="text-sm text-muted-foreground mt-1 font-medium">Out of 100</div>
                </div>
                <RiskBadge level={app.riskLevel} className="px-3 py-1.5 text-sm" />
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-muted-foreground" /> Risk Factors
                </h4>
                <ul className="space-y-2.5">
                  {app.riskReasons.map((reason, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 shrink-0" />
                      {reason}
                    </li>
                  ))}
                  {app.riskReasons.length === 0 && (
                    <li className="text-sm text-muted-foreground italic">No significant risk factors identified.</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-muted/40">
            <CardContent className="p-4 text-sm text-muted-foreground">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="font-medium text-foreground">Client ID</span>
                  <span className="font-mono text-xs text-muted-foreground truncate ml-4 w-32" title={app.clientId}>{app.clientId}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2 pt-1">
                  <span className="font-medium text-foreground">First Discovered</span>
                  <span>{format(new Date(app.firstSeenAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-medium text-foreground">Last Seen</span>
                  <span>{format(new Date(app.lastSeenAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
