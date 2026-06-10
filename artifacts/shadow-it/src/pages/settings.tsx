import { useEffect, useState } from "react";
import {
  useGetEmailSettings,
  useUpdateEmailSettings,
  useTestEmailSettings,
  getGetEmailSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2 } from "lucide-react";

export function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useGetEmailSettings({ query: { queryKey: getGetEmailSettingsQueryKey() } });
  const update = useUpdateEmailSettings();
  const test = useTestEmailSettings();

  const [alertEmails, setAlertEmails] = useState("");

  useEffect(() => {
    if (!data) return;
    setAlertEmails(data.alertEmails ?? "");
  }, [data]);

  const senderConfigured = data?.senderConfigured ?? false;

  const handleSave = () => {
    update.mutate(
      { data: { alertEmails: alertEmails || null } },
      {
        onSuccess: () => {
          toast({ title: "Settings saved", description: "Your alert recipients were updated." });
          queryClient.invalidateQueries({ queryKey: getGetEmailSettingsQueryKey() });
        },
        onError: () => toast({ title: "Error", description: "Could not save settings.", variant: "destructive" }),
      },
    );
  };

  // Save the current recipients first, then send the test — so the test always
  // goes exactly where the form says (no "save before testing" gotcha).
  const handleTest = async () => {
    try {
      await update.mutateAsync({ data: { alertEmails: alertEmails || null } });
      queryClient.invalidateQueries({ queryKey: getGetEmailSettingsQueryKey() });
      await test.mutateAsync(undefined);
      toast({ title: "Test email sent ✓", description: "Check the configured recipients' inbox (and spam)." });
    } catch (err) {
      toast({
        title: "Test failed",
        description: (err as { error?: string }).error ?? "Could not send the test email.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure where high-risk app alerts are sent.</p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-400" /> Alert email</CardTitle>
          <CardDescription>
            ShadowGuard emails high-risk app alerts to the recipients below. Leave empty to send to all
            admins in this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              {!senderConfigured && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                  Email alerts are not enabled on this deployment yet. Recipients are saved, but no email
                  is delivered until the provider is configured.
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="alertEmails">Alert recipients</Label>
                <Input
                  id="alertEmails"
                  placeholder="security@company.com, it@company.com"
                  value={alertEmails}
                  onChange={(e) => setAlertEmails(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Comma-separated. Leave empty to send to all admins in this workspace.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={update.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {update.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save settings
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={test.isPending || !senderConfigured}>
                  {test.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} Send test email
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
