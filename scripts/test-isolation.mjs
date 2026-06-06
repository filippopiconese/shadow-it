// Tenant-isolation integration test.
// Seeds two tenants via dev-only endpoints, then verifies — through the real
// API handlers + session — that each tenant sees ONLY its own data.
//
// Requires the API running in non-production (dev endpoints mounted).
// Usage: BASE_URL=http://localhost:8080 node scripts/test-isolation.mjs

const BASE = process.env.BASE_URL ?? "http://localhost:8080";
let failures = 0;

function check(name, cond) {
  console.log(`${cond ? "✓ PASS" : "✗ FAIL"}  ${name}`);
  if (!cond) failures++;
}

function sessionCookie(res) {
  const cookies = res.headers.getSetCookie?.() ?? [];
  const sid = cookies.find((c) => c.startsWith("connect.sid="));
  return sid ? sid.split(";")[0] : null;
}

async function seedTenant() {
  const res = await fetch(`${BASE}/api/dev/seed-tenant`, { method: "POST" });
  if (!res.ok) throw new Error(`seed-tenant failed (${res.status}). Is the API running in non-prod?`);
  return res.json();
}

async function loginAs(t) {
  const res = await fetch(`${BASE}/api/dev/login-as`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ organizationId: t.orgId, userId: t.userId }),
  });
  const cookie = sessionCookie(res);
  if (!cookie) throw new Error("login-as did not return a session cookie");
  return cookie;
}

const get = (path, cookie) => fetch(`${BASE}${path}`, { headers: { cookie } });

async function main() {
  console.log(`Tenant isolation test against ${BASE}\n`);
  const a = await seedTenant();
  const b = await seedTenant();
  console.log(`Tenant A: org ${a.orgId} (${a.appName})`);
  console.log(`Tenant B: org ${b.orgId} (${b.appName})\n`);

  const cookieA = await loginAs(a);
  const cookieB = await loginAs(b);

  // A's apps list contains only A's app
  const appsA = await (await get("/api/apps", cookieA)).json();
  check("A sees its own app", appsA.some((x) => x.id === a.appId));
  check("A does NOT see B's app in list", !appsA.some((x) => x.id === b.appId));

  // A cannot fetch B's app by id (cross-tenant) → 404
  check("A gets 404 fetching B's app by id", (await get(`/api/apps/${b.appId}`, cookieA)).status === 404);

  // A's dashboard counts don't include B
  const sumA = await (await get("/api/dashboard/summary", cookieA)).json();
  check("A dashboard excludes B (totalApps === A's count)", sumA.totalApps === appsA.length);

  // Mirror for B
  const appsB = await (await get("/api/apps", cookieB)).json();
  check("B sees its own app", appsB.some((x) => x.id === b.appId));
  check("B does NOT see A's app in list", !appsB.some((x) => x.id === a.appId));
  check("B gets 404 fetching A's app by id", (await get(`/api/apps/${a.appId}`, cookieB)).status === 404);

  // Unauthenticated request is rejected
  check("Unauthenticated /api/apps is 401", (await fetch(`${BASE}/api/apps`)).status === 401);

  console.log(`\n${failures === 0 ? "✅ All isolation checks passed" : `❌ ${failures} check(s) failed`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Test error:", err.message);
  process.exit(1);
});
