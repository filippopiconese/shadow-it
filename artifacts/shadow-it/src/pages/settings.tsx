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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2 } from "lucide-react";

export function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useGetEmailSettings({ query: { queryKey: getGetEmailSettingsQueryKey() } });
  const update = useUpdateEmailSettings();
  const test = useTestEmailSettings();

  const [form, setForm] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    emailFrom: "",
    alertEmails: "",
  });
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm((f) => ({
      ...f,
      smtpHost: data.smtpHost ?? "",
      smtpPort: data.smtpPort != null ? String(data.smtpPort) : "587",
      smtpSecure: data.smtpSecure,
      smtpUser: data.smtpUser ?? "",
      smtpPass: "",
      emailFrom: data.emailFrom ?? "",
      alertEmails: data.alertEmails ?? "",
    }));
    setHasPassword(data.hasPassword);
  }, [data]);

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    update.mutate(
      {
        data: {
          smtpHost: form.smtpHost || null,
          smtpPort: form.smtpPort ? Number(form.smtpPort) : null,
          smtpSecure: form.smtpSecure,
          smtpUser: form.smtpUser || null,
          smtpPass: form.smtpPass || null,
          emailFrom: form.emailFrom || null,
          alertEmails: form.alertEmails || null,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Settings saved", description: "Your alert email settings were updated." });
          queryClient.invalidateQueries({ queryKey: getGetEmailSettingsQueryKey() });
        },
        onError: () => toast({ title: "Error", description: "Could not save settings.", variant: "destructive" }),
      },
    );
  };

  // Save the current form first, then send the test — so the test always
  // reflects exactly what's on screen (no "save before testing" gotcha).
  const handleTest = async () => {
    try {
      await update.mutateAsync({
        data: {
          smtpHost: form.smtpHost || null,
          smtpPort: form.smtpPort ? Number(form.smtpPort) : null,
          smtpSecure: form.smtpSecure,
          smtpUser: form.smtpUser || null,
          smtpPass: form.smtpPass || null,
          emailFrom: form.emailFrom || null,
          alertEmails: form.alertEmails || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetEmailSettingsQueryKey() });
      await test.mutateAsync(undefined);
      toast({ title: "Test email sent ✓", description: "Check the configured recipients' inbox (and spam)." });
    } catch (err) {
      toast({
        title: "Test failed",
        description: (err as { error?: string }).error ?? "Could not send the test email — check your SMTP settings.",
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
          <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-indigo-400" /> Alert email (SMTP)</CardTitle>
          <CardDescription>
            Use your own SMTP server so alert emails are sent from your infrastructure — nothing routes
            through ShadowGuard. Leave empty to disable email alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="smtpHost">SMTP host</Label>
                  <Input id="smtpHost" placeholder="smtp.gmail.com" value={form.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input id="smtpPort" inputMode="numeric" placeholder="587" value={form.smtpPort} onChange={(e) => set("smtpPort", e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label htmlFor="smtpSecure">Use TLS/SSL (secure)</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">On for port 465, off for 587 (STARTTLS).</p>
                </div>
                <Switch id="smtpSecure" checked={form.smtpSecure} onCheckedChange={(v) => set("smtpSecure", v)} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="smtpUser">Username</Label>
                  <Input id="smtpUser" placeholder="alerts@company.com" value={form.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtpPass">Password</Label>
                  <Input id="smtpPass" type="password" placeholder={hasPassword ? "•••••••• (leave blank to keep)" : "app password"} value={form.smtpPass} onChange={(e) => set("smtpPass", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emailFrom">From address</Label>
                <Input id="emailFrom" placeholder='ShadowGuard Alerts <alerts@company.com>' value={form.emailFrom} onChange={(e) => set("emailFrom", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alertEmails">Alert recipients</Label>
                <Input id="alertEmails" placeholder="security@company.com, it@company.com" value={form.alertEmails} onChange={(e) => set("alertEmails", e.target.value)} />
                <p className="text-xs text-muted-foreground">Comma-separated. Leave empty to send to all admins in this workspace.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} disabled={update.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {update.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save settings
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={test.isPending || !form.smtpHost}>
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
