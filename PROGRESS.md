# PROGRESS — ShadowGuard

Tracciamento degli sprint di sviluppo. Aggiornare ad ogni iterazione.

Legenda: ✅ fatto · 🔄 in corso · ⬜ da fare

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

## Sprint 1 — Scansione reale & flusso OAuth self-hosted 🔄

Obiettivo: far funzionare la scansione su un Workspace reale in self-hosting.

- ⬜ **Servire il frontend buildato dall'API in produzione** (oggi sono due server
  separati: in dev funziona via proxy Vite, ma in self-hosting `/connect`
  post-OAuth darebbe 404). Aggiungere static serving + fallback SPA in `app.ts`.
- ⬜ Rendere il redirect del callback OAuth coerente tra dev (due origin) e prod.
- ⬜ Refresh automatico dei token Google scaduti durante la scansione
  (`refreshTokensIfNeeded` esiste ma non è invocato nel flusso di scan).
- ⬜ Test e2e del flusso reale con un Google Workspace di prova.
- ⬜ Pulire il commento fuorviante in `connect.tsx` (“simulate” → è lo spinner post-OAuth).

## Sprint 2 — Differenziatori di prodotto ⬜

- ⬜ **Scansioni automatiche schedulate** (cron) — la value prop parla di
  “scansione automatica” ma oggi è solo manuale.
- ⬜ **Alert email** alla scoperta di nuove app ad alto rischio.
- ⬜ Icone/logo delle app (campo `iconUrl` già presente, non popolato).
- ⬜ Storico/diff tra scansioni (app comparse/sparite).
- ⬜ Hardening risk scoring (più scope, app verificate vs non verificate da Google).

## Sprint 3 — Go-to-market ⬜

- ⬜ Pubblicazione su **Google Workspace Marketplace**.
- ⬜ (Pitch) Connettore **Microsoft 365** per copertura multi-provider.
- ⬜ Onboarding self-service + email transazionali.
- ⬜ Pagina pricing/landing rifinita per la conversione.

## Debito tecnico ⬜

- ⬜ Nessun test automatico (unit su `risk.ts`, integration sulle route).
- ⬜ Tipizzazione degli eventi webhook Stripe (cast manuali in `billing.ts`).
- ⬜ CI (typecheck + build) prima del deploy.
