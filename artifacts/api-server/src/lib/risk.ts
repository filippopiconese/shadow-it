const HIGH_RISK_SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.insert",
  "https://www.googleapis.com/auth/gmail.settings",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.appdata",
  "https://www.googleapis.com/auth/admin",
  "https://www.googleapis.com/auth/apps.groups",
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/devstorage",
  "https://www.googleapis.com/auth/bigquery",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/forms",
  "https://www.googleapis.com/auth/keep",
];

const MEDIUM_RISK_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/contacts",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/directory.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/chat",
  "https://www.googleapis.com/auth/photoslibrary",
];

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "https://mail.google.com/": "Full access to Gmail (read, send, delete)",
  "https://www.googleapis.com/auth/gmail": "Full Gmail access",
  "https://www.googleapis.com/auth/gmail.readonly": "Read all Gmail messages",
  "https://www.googleapis.com/auth/gmail.compose": "Create and send emails",
  "https://www.googleapis.com/auth/gmail.send": "Send emails on your behalf",
  "https://www.googleapis.com/auth/gmail.modify": "Modify Gmail (read, archive, delete)",
  "https://www.googleapis.com/auth/drive": "Full Google Drive access",
  "https://www.googleapis.com/auth/drive.readonly": "Read all Drive files",
  "https://www.googleapis.com/auth/drive.file": "Access Drive files created by this app",
  "https://www.googleapis.com/auth/calendar": "Full Calendar access",
  "https://www.googleapis.com/auth/contacts": "Read and manage contacts",
  "https://www.googleapis.com/auth/admin": "Full admin access to the domain",
  "https://www.googleapis.com/auth/spreadsheets": "Full Sheets access",
  "https://www.googleapis.com/auth/spreadsheets.readonly": "Read Sheets",
  "https://www.googleapis.com/auth/documents": "Full Docs access",
  "https://www.googleapis.com/auth/directory.readonly": "Read directory (all users)",
  "openid": "Verify your identity",
  "email": "Read your email address",
  "profile": "Read your basic profile info",
};

const AI_KEYWORDS = ["gpt", "openai", "claude", "anthropic", "gemini", "copilot", "midjourney", "jasper", "grammarly", "notion ai", "perplexity", "cohere"];
const DEV_KEYWORDS = ["github", "gitlab", "bitbucket", "linear", "jira", "sentry", "datadog", "vercel", "netlify", "heroku", "render", "railway"];
const COMM_KEYWORDS = ["zoom", "slack", "teams", "discord", "loom", "calendly", "typeform", "whereby", "webex"];
const STORAGE_KEYWORDS = ["dropbox", "box.com", "onedrive", "box", "sync.com"];
const PRODUCTIVITY_KEYWORDS = ["notion", "trello", "asana", "monday", "clickup", "basecamp", "airtable", "todoist", "evernote", "obsidian"];
const CRM_KEYWORDS = ["salesforce", "hubspot", "pipedrive", "intercom", "zendesk", "freshdesk"];

export function categorizeApp(appName: string): string {
  const name = appName.toLowerCase();
  if (AI_KEYWORDS.some((k) => name.includes(k))) return "AI Tools";
  if (DEV_KEYWORDS.some((k) => name.includes(k))) return "Development";
  if (COMM_KEYWORDS.some((k) => name.includes(k))) return "Communication";
  if (STORAGE_KEYWORDS.some((k) => name.includes(k))) return "Storage";
  if (PRODUCTIVITY_KEYWORDS.some((k) => name.includes(k))) return "Productivity";
  if (CRM_KEYWORDS.some((k) => name.includes(k))) return "CRM";
  return "Other";
}

export function scoreApp(
  scopes: string[],
  userCount = 0,
): { riskLevel: "high" | "medium" | "low"; riskScore: number; riskReasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const hasHighRisk = scopes.some((s) => HIGH_RISK_SCOPES.some((h) => s.startsWith(h)));
  const hasMediumRisk = scopes.some((s) => MEDIUM_RISK_SCOPES.some((m) => s.startsWith(m)));

  if (hasHighRisk) {
    score += 70;
    const dangerous = scopes.filter((s) => HIGH_RISK_SCOPES.some((h) => s.startsWith(h)));
    reasons.push(`Has high-risk scope(s): ${dangerous.slice(0, 2).map(getScopeShortName).join(", ")}`);
  }

  if (hasMediumRisk) {
    score += 25;
    reasons.push("Can access sensitive data (email, calendar, or contacts)");
  }

  if (scopes.length > 5) {
    score += 10;
    reasons.push(`Requests many permissions (${scopes.length} scopes)`);
  }

  // Blast radius: an app authorized by many users is a bigger exposure.
  if (userCount >= 20) {
    score += 15;
    reasons.push(`Broadly authorized across the org (${userCount} users)`);
  } else if (userCount >= 5) {
    score += 8;
    reasons.push(`Authorized by multiple users (${userCount})`);
  }

  score = Math.min(score, 100);

  const riskLevel: "high" | "medium" | "low" =
    score >= 60 ? "high" : score >= 25 ? "medium" : "low";

  if (reasons.length === 0) reasons.push("Low-risk permissions only (profile, email)");

  return { riskLevel, riskScore: score, riskReasons: reasons };
}

function getScopeShortName(scope: string): string {
  const parts = scope.split("/");
  return parts[parts.length - 1] ?? scope;
}

export function getScopeDescriptions(scopes: string[]): string[] {
  return scopes.map((s) => SCOPE_DESCRIPTIONS[s] ?? s);
}
