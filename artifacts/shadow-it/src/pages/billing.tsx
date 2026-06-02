import { useGetBillingStatus, useCreateCheckout, useCreateBillingPortal } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, CheckCircle2, Shield, Loader2 } from "lucide-react";
import { format } from "date-fns";

export function Billing() {
  const { data: status, isLoading } = useGetBillingStatus();
  const createCheckout = useCreateCheckout();
  const createPortal = useCreateBillingPortal();

  const handleUpgrade = () => {
    createCheckout.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.url;
      }
    });
  };

  const handleManage = () => {
    createPortal.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.url;
      }
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Billing & Subscription</h1>
        <p className="text-slate-500 mt-1">Manage your ShadowGuard plan and payment methods.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Shield className="w-32 h-32" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              {status?.isSubscribed 
                ? "You are on the Pro plan." 
                : "You are currently on a trial or free tier."}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 flex-1">
            <div className="mb-6">
              <span className="text-4xl font-black text-slate-900">
                {status?.isSubscribed ? "€39" : "€0"}
              </span>
              <span className="text-slate-500 font-medium ml-1">/month</span>
            </div>
            
            {status?.currentPeriodEnd && (
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-medium text-slate-900">
                  {status.cancelAtPeriodEnd ? "Access ends:" : "Next billing date:"}
                </span>{" "}
                {format(new Date(status.currentPeriodEnd), "MMMM d, yyyy")}
              </div>
            )}
          </CardContent>
          <CardFooter className="relative z-10 pt-4 border-t border-slate-100 bg-slate-50/50">
            {status?.isSubscribed ? (
              <Button 
                variant="outline" 
                className="w-full bg-white" 
                onClick={handleManage}
                disabled={createPortal.isPending}
              >
                {createPortal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Manage Subscription
              </Button>
            ) : (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={handleUpgrade}
                disabled={createCheckout.isPending}
              >
                {createCheckout.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Upgrade to Pro
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-slate-100">Pro Features</CardTitle>
            <CardDescription className="text-slate-400">Everything you need for complete workspace security.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                "Unlimited user scanning",
                "Daily automated risk assessments",
                "Instant access revocation",
                "Advanced scope analysis",
                "Priority email support"
              ].map((feature, i) => (
                <li key={i} className="flex items-center text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
