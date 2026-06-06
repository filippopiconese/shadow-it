import type { Subscription } from "@workspace/db";

/**
 * Free launch period: every connected workspace gets full access at no cost
 * (no Stripe). Set LAUNCH_FREE=false to switch to subscription gating.
 */
export function isLaunchFree(): boolean {
  return (process.env.LAUNCH_FREE ?? "true").toLowerCase() !== "false";
}

/**
 * Whether an organization may use gated features (scans). During the free
 * launch everyone is entitled; otherwise it depends on an active/trial sub.
 */
export function isEntitled(sub: Subscription | undefined): boolean {
  if (isLaunchFree()) return true;
  const now = new Date();
  return (
    sub?.status === "active" ||
    (sub?.status === "trial" && sub.trialEndsAt != null && sub.trialEndsAt > now)
  );
}
