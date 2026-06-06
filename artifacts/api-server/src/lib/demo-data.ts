// Synthetic OAuth apps shared by the demo seed (dev login) and the mock scan
// provider, so the seeded dashboard and the "Run scan" flow stay consistent.

export const DEMO_DOMAIN = "demo-acme.com";

/** Google's public favicon service — no API key needed. */
function favicon(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export interface DemoApp {
  clientId: string;
  appName: string;
  scopes: string[];
  users: string[];
  /** Days since the app was first authorized (for firstSeenAt in the seed). */
  daysAgo: number;
  iconUrl: string | null;
}

const U = {
  marco: "marco.rossi@demo-acme.com",
  giulia: "giulia.bianchi@demo-acme.com",
  luca: "luca.verdi@demo-acme.com",
  sara: "sara.neri@demo-acme.com",
  anna: "anna.galli@demo-acme.com",
  paolo: "paolo.conti@demo-acme.com",
};

export const DEMO_APPS: DemoApp[] = [
  { clientId: "100001.apps.googleusercontent.com", appName: "ChatGPT", scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/gmail.readonly"], users: [U.marco, U.giulia, U.luca, U.sara], daysAgo: 2, iconUrl: favicon("openai.com") },
  { clientId: "100002.apps.googleusercontent.com", appName: "Grammarly", scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.modify"], users: [U.marco, U.anna], daysAgo: 3, iconUrl: favicon("grammarly.com") },
  { clientId: "100003.apps.googleusercontent.com", appName: "Zoom", scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar"], users: [U.marco, U.giulia, U.luca, U.sara, U.anna, U.paolo], daysAgo: 40, iconUrl: favicon("zoom.us") },
  { clientId: "100004.apps.googleusercontent.com", appName: "Slack", scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/contacts"], users: [U.marco, U.giulia, U.luca], daysAgo: 55, iconUrl: favicon("slack.com") },
  { clientId: "100005.apps.googleusercontent.com", appName: "Notion", scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/drive.file"], users: [U.sara, U.paolo], daysAgo: 12, iconUrl: favicon("notion.so") },
  { clientId: "100006.apps.googleusercontent.com", appName: "Calendly", scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar"], users: [U.giulia], daysAgo: 5, iconUrl: favicon("calendly.com") },
  { clientId: "100007.apps.googleusercontent.com", appName: "Superhuman", scopes: ["openid", "email", "profile", "https://mail.google.com/", "https://www.googleapis.com/auth/contacts"], users: [U.paolo], daysAgo: 1, iconUrl: favicon("superhuman.com") },
  { clientId: "100008.apps.googleusercontent.com", appName: "Loom", scopes: ["openid", "email", "profile"], users: [U.luca, U.anna], daysAgo: 70, iconUrl: favicon("loom.com") },
  { clientId: "100009.apps.googleusercontent.com", appName: "HubSpot", scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/contacts"], users: [U.marco, U.giulia], daysAgo: 4, iconUrl: favicon("hubspot.com") },
  { clientId: "100010.apps.googleusercontent.com", appName: "Some Random Photo Editor", scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"], users: [U.sara], daysAgo: 1, iconUrl: null },
  { clientId: "100011.apps.googleusercontent.com", appName: "Trello", scopes: ["openid", "email", "profile"], users: [U.luca, U.paolo, U.anna], daysAgo: 90, iconUrl: favicon("trello.com") },
];

// An extra app NOT in the seed: the first scan after a demo login discovers it
// as a brand-new high-risk app, exercising the new-app alert pipeline.
export const DEMO_NEW_APP: DemoApp = {
  clientId: "100099.apps.googleusercontent.com",
  appName: "Unknown Data Exporter",
  scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/drive", "https://mail.google.com/"],
  users: [U.sara],
  daysAgo: 0,
  iconUrl: null,
};
