# PROGRESS — ShadowGuard

Tracciamento degli sprint di sviluppo. Aggiornare ad ogni iterazione.

Legenda: ✅ fatto · 🔄 in corso · ⬜ da fare

---

## Tema dark dashboard + chiarimenti modello SaaS ✅ (2026-06-06)

- ✅ **Dashboard in dark-navy** coerente con la landing: abilitato `dark` globale,
  palette `.dark` rifinita (card più chiare del fondo per separazione), shell con
  gradient `sg-app-bg`. Convertite tutte le pagine app (dashboard, apps, dettaglio,
  scansioni, billing, 404, layout) dai colori hardcoded slate/white ai token
  semantici (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`)
  + accenti indigo; grafici/tooltip recharts adattati al dark. Verificato con screenshot.
- ✅ Home: step 1 chiarisce che serve un account **super-admin** + trial 14 giorni.

### Modello SaaS (chiarito)
- **Vendor**: configura UN solo `GOOGLE_CLIENT_ID/SECRET` (un Google Cloud project,
  gratis — **non** serve possedere un Workspace). Per gli scope admin "restricted"
  serve la **verifica app** Google prima della prod.
- **Cliente**: il super-admin "collega" il proprio Workspace via consenso OAuth
  (nessuna API key da inserire); org + token salvati per-tenant.
- **Multi-tenant**: segregazione logica per `organizationId` su ogni query.

### Backlog sicurezza (prod)
- ⬜ Cifrare i token OAuth at-rest (oggi in chiaro nel DB).
- ⬜ Test automatico di isolamento tra tenant.

## Rebrand — allineamento all'hub Micro SaaS ✅ (2026-06-03)

A regime il sito sarà **shadowit.micro-saas.it**: lo stile ora segue il sito padre
[micro-saas.it](https://micro-saas.it).

- ✅ Token di brand in `index.css`: font **Barlow Condensed** (titoli) + **Inter** (testo),
  `--primary` indigo `#6366f1`, ring indigo, chart palette coerente (high=rosso,
  medium=ambra, low=verde, +indigo/cyan). Classi brand `.sg-app-bg`, `.sg-glass`,
  `.sg-badge`, `.sg-gradient-text`, `.sg-accent-bar`.
- ✅ **Landing page** ridisegnata in dark-navy come l'hub: glow indigo/cyan, hero con
  titolo gradient, card glass, CTA a pillola, pricing glass, badge "by Micro SaaS"
  e footer con link all'hub.
- ✅ App (sidebar/layout) allineata: logo Radar su gradiente indigo, sidebar navy,
  accento indigo, "by Micro SaaS". Pagina `connect` in dark-navy glass.
- ✅ Verifica visiva (screenshot landing + dashboard) ok; typecheck + build puliti.

---

## Sprint 0 — Scaffold Replit + abilitazione dev locale ✅ (2026-06-02)

Base generata su Replit e resa eseguibile in locale su Windows.

- ✅ Monorepo pnpm: API server, frontend, DB, api-spec/zod/client (contract-first).
- ✅ Modello dati Drizzle: organizations, users, oauth_apps, scans, subscriptions.
- ✅ Flusso OAuth Google (Admin SDK) + check super admin al callback.
- ✅ Scansione token OAuth per utente + risk scoring per scope + categorizzazione.
- ✅ Route API: auth, apps (list/detail/dismiss), scans (trigger/list), dashboard,
  billing (Stripe checkout/portal/webhook), health.
- ✅ Frontend: landing, dashboard, lista app, dettaglio, scansioni, billing, connect.
- ✅ **Pulizia**: rimossi `.local` (cache skill Replit), `.agents`, `artifacts/mockup-sandbox`.
- ✅ **Cross-platform**: dev script senza sintassi bash; binari nativi `win32-x64`
  riabilitati nel lockfile (esbuild, rollup, lightningcss, oxide).
- ✅ **Proxy Vite** `/api` → `:8080` (mancava: frontend e API non si parlavano in locale).
- ✅ **Loader `.env` nativo** (Node 24) per API e drizzle-kit → `pnpm dev:api` funziona senza env inline.
- ✅ **Fix bundling** `connect-pg-simple/table.sql` copiato in `dist/` (creazione tabella sessioni).
- ✅ **Fix Drizzle su Windows**: path schema con forward-slash (glob).
- ✅ **Demo mode**: `POST /api/dev/login` (solo non-prod) crea workspace demo con
  ~11 app realistiche + storico scansioni e fa login → bottone “View live demo” nella landing.
- ✅ `docker-compose.yml` (Postgres), `.env.example`, script root (`db:up`, `db:push`, `dev:api`, `dev:web`).
- ✅ Verificato end-to-end: health, dev login, dashboard summary, lista app, typecheck pulito.
- ✅ **Abbandono Replit**: rimossi `.replit`, `.replitignore`, `replit.md`,
  `scripts/post-merge.sh`; tolti i plugin `@replit/*` da Vite e i residui del
  template (glob `lib/integrations`, override `@expo/ngrok-bin`, blocco
  `allowBuilds` malformato, exclude `@replit/*`); meta-tag `index.html` ripuliti.
  Sostituite le dipendenze runtime da `REPLIT_DOMAINS`/`REPLIT_DEV_DOMAIN` (redirect
  OAuth + URL Stripe) con la variabile `APP_URL`. Build frontend + API verificati ok.

---

## Sprint 1 — Scansione reale & flusso OAuth self-hosted ✅ (2026-06-03)

Obiettivo: far funzionare la scansione su un Workspace reale in self-hosting.

- ✅ **Static serving + SPA fallback** in `app.ts`: se esiste la build del frontend
  (`shadow-it/dist/public`, override `STATIC_DIR`) l'API la serve e fa fallback su
  `index.html` per le route non-`/api` → deploy single-server e `/connect` post-OAuth
  non dà più 404. In dev (Vite) la dir non esiste e il blocco viene saltato.
- ✅ Redirect callback OAuth coerente: risolto dal static serving (l'API serve la SPA);
  redirect URI e URL app derivano da `APP_URL`/`GOOGLE_REDIRECT_URI`.
- ✅ **Refresh automatico token Google**: estratta la logica di scan in
  `lib/scan-service.ts`; `getValidAccessToken()` rinfresca e persiste i token in
  scadenza prima di ogni scansione (manuale o schedulata).
- ✅ `routes/scans.ts` ora usa `createScan` + `executeScan` (niente più logica duplicata).
- ✅ Pulito il commento fuorviante in `connect.tsx`.
- ⬜ Test e2e del flusso reale con un Google Workspace di prova (richiede credenziali).

## Sviluppo senza Google Workspace ✅ (2026-06-06)

Per procedere prima di avere un Workspace reale.

- ✅ **Mock scan provider** (`SCAN_PROVIDER=mock`, `lib/scan-providers.ts`): la
  scansione restituisce app sintetiche invece di chiamare l'Admin SDK, così
  l'intero flusso reale gira senza Google — `POST /api/scans/trigger` →
  `scan-service` → upsert → alert → polling/scan history, **e** lo scheduler.
  Dati condivisi tra seed e mock in `lib/demo-data.ts`; il dev-login "connette"
  l'org demo (token fittizio) così Run Scan e scheduler la includono. La prima
  scansione post-seed scopre 1 app high-risk nuova → alert (verificato e2e).
- ✅ **Logo Micro SaaS**: marchio condiviso (`public/logo-icon.png`), componente
  `<Logo>` riutilizzabile su landing/sidebar/connect, favicon aggiornata, footer
  landing con colonne + link a micro-saas.it/contatti e copyright Micro SaaS.
- ✅ **Icone app** (`iconUrl`): popolate via Google favicon service nei dati demo
  e persistite dallo scan; il frontend già le mostrava con fallback.

## Sprint 2 — Differenziatori di prodotto 🔄

- ✅ **Scansioni automatiche schedulate** (`lib/scheduler.ts`): avviate da `index.ts`,
  intervallo `SCAN_INTERVAL_HOURS` (default 24h), scansionano ogni org connessa con
  abbonamento attivo/trial; `ENABLE_SCHEDULER=false` per disattivare. Endpoint dev
  `POST /api/dev/run-scheduler` per trigger manuale.
- ✅ **Alert email** nuove app high-risk (`lib/email.ts`): dopo ogni scansione invia
  ai admin dell'org un riepilogo delle nuove app ad alto rischio. Usa SMTP se
  configurato (`SMTP_*`), altrimenti logga l'alert (testabile senza credenziali).
  Endpoint dev `POST /api/dev/test-alert`.
- ✅ Icone/logo delle app (`iconUrl` popolato + reso).
- ✅ **Storico/diff tra scansioni**: ogni scan rileva le app revocate (presenti
  prima, assenti ora) → `oauth_apps.status` `active`/`removed`, contatore
  `scans.removedAppsFound`. UI: badge "Revoked" + riga attenuata nella lista app,
  "N revoked" nello storico scansioni; la dashboard conta solo le app attive.
  Il mock esclude un'app (Loom) per dimostrare la rimozione. Verificato e2e.
- ✅ **Hardening risk scoring**: più scope sensibili (gmail.insert/settings,
  drive.appdata, bigquery, cloud-platform, forms, keep…) + fattore di
  **esposizione** (app autorizzata da molti utenti → punteggio più alto).

## Sprint 3 — Go-to-market ⬜

- ⬜ Pubblicazione su **Google Workspace Marketplace**.
- ⬜ (Pitch) Connettore **Microsoft 365** per copertura multi-provider.
- ⬜ Onboarding self-service + email transazionali.
- ⬜ Pagina pricing/landing rifinita per la conversione.

## Debito tecnico ⬜

- ⬜ Nessun test automatico (unit su `risk.ts`, integration sulle route).
- ⬜ Tipizzazione degli eventi webhook Stripe (cast manuali in `billing.ts`).
- ⬜ CI (typecheck + build) prima del deploy.
