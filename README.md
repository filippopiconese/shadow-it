# ShadowGuard — Shadow IT Detector

**Scova le app OAuth non autorizzate connesse al tuo Google Workspace.**

ShadowGuard è un SaaS B2B per PMI: un IT admin collega il proprio Google
Workspace come super admin, lancia una scansione e vede ogni app di terze parti
autorizzata dai dipendenti, classificata per livello di rischio (high / medium /
low) in base alla sensibilità degli scope OAuth richiesti.

- **Zero agent** da installare — connessione in 1 click via API native Google.
- **Flat-rate €39/mese** (no per-user → differenziante vs Nudge Security / Zluri).
- Target: €300–500 MRR.

> Fa parte dell'[hub di micro-SaaS](../micro-saas/) verticali a subscription.
> A regime sarà su **shadowit.micro-saas.it**; lo stile (dark-navy, indigo/cyan,
> Barlow Condensed + Inter, card glass) segue il sito padre [micro-saas.it](https://micro-saas.it).

---

## Stack

| Layer       | Tecnologia |
|-------------|------------|
| Monorepo    | pnpm workspaces, Node.js 24, TypeScript 5.9 |
| API         | Express 5 + Helmet + express-rate-limit |
| DB          | PostgreSQL + Drizzle ORM |
| Auth        | Google OAuth2 (Admin SDK) |
| Billing     | Stripe (checkout + webhooks) |
| Sessioni    | express-session + connect-pg-simple |
| Contratti   | OpenAPI → codegen Orval (hook React Query) + Zod (validazione server) |
| Frontend    | React + Vite + TanStack Query + wouter + shadcn/ui + recharts |
| Build API   | esbuild (bundle ESM) |

Architettura **contract-first**: `lib/api-spec/openapi.yaml` è l'unica fonte di
verità; da lì si generano gli hook React Query (client) e gli schema Zod (server).

---

## Avvio rapido (sviluppo locale su Windows/macOS/Linux)

Prerequisiti: **Node 24**, **pnpm** (`npm i -g pnpm`), **Docker** (per Postgres).

```bash
# 1. Dipendenze
pnpm install

# 2. Configura l'ambiente
cp .env.example .env        # i default locali funzionano già

# 3. Avvia Postgres (Docker) e crea le tabelle
pnpm db:up
pnpm db:push

# 4. Avvia API (terminale 1) e frontend (terminale 2)
pnpm dev:api    # http://localhost:8080
pnpm dev:web    # http://localhost:25255
```

Apri **http://localhost:25255**. In dev compare il pulsante **“View live demo”**:
crea un workspace demo con ~11 app OAuth realistiche (rischio misto) e ti porta
direttamente nella dashboard — **senza bisogno di credenziali Google**.

### Sviluppo senza Google Workspace (mock provider)

Con `SCAN_PROVIDER=mock` (default nel `.env` locale) la scansione usa dati
sintetici invece dell'Admin SDK: puoi esercitare **tutto il flusso reale** —
“Run Security Scan”, storico scansioni, scheduler automatico e alert high-risk —
senza un Google Workspace. Imposta `SCAN_PROVIDER=google` per la scansione vera.

> Il server API carica automaticamente il file `.env` dalla root del repo
> (loader nativo di Node, nessuna dipendenza). Vite fa da proxy di `/api` verso
> l'API su `:8080`, così il browser resta same-origin (cookie + redirect OAuth
> senza problemi di CORS).

### Comandi utili

| Comando | Cosa fa |
|---------|---------|
| `pnpm db:up` / `pnpm db:down` | Avvia/ferma il container Postgres |
| `pnpm db:push` | Applica lo schema Drizzle al DB |
| `pnpm dev:api` | Build + avvio API server (`:8080`) |
| `pnpm dev:web` | Vite dev server (`:25255`) |
| `pnpm typecheck` | Typecheck di tutto il workspace |
| `pnpm build` | Typecheck + build di tutti i package |
| `pnpm --filter @workspace/api-spec run codegen` | Rigenera hook + Zod dall'OpenAPI |

---

## Pagine del prodotto

- **Landing** (`/`): marketing + pricing €39/mese + CTA “Connect Workspace”.
- **Dashboard** (`/dashboard`): statistiche, donut del rischio, scoperte recenti,
  postura di sicurezza, avanzamento delle review.
- **App** (`/apps`): tabella con ricerca, filtro rischio, dismiss inline, export
  CSV, toggle “mostra revisionate”.
- **Dettaglio app** (`/apps/:id`): scope con descrizioni, utenti autorizzati,
  punteggio di rischio + motivazioni, azione dismiss.
- **Scansioni** (`/scans`): storico con polling live durante la scansione attiva.
- **Billing** (`/billing`): checkout + portal Stripe, stato abbonamento.

---

## Risk scoring

Il punteggio (0–100) deriva dalla sensibilità degli scope OAuth
([`risk.ts`](artifacts/api-server/src/lib/risk.ts)):

- **HIGH** (+70): accesso pieno a Gmail/Drive, admin, cloud-platform, BigQuery,
  Sheets/Docs, Forms, Keep…
- **MEDIUM** (+25): accesso a dati sensibili read-only (email, calendar, contatti,
  tasks, chat, foto…).
- **+10** se l'app richiede più di 5 scope.
- **Esposizione** (+8/+15): app autorizzata da molti utenti = blast radius maggiore.

`>= 60 → high`, `>= 25 → medium`, altrimenti `low`. Le app vengono anche
categorizzate per keyword (AI Tools, Development, Communication, Storage, …).

Ogni scansione calcola anche il **diff** rispetto alle precedenti: le app non più
autorizzate vengono marcate `removed` (badge "Revoked"), con il conteggio nello
storico scansioni; la dashboard considera solo le app attive.

---

## Configurazione Google (flusso reale)

Il pulsante demo basta per esplorare il prodotto. Per la **scansione reale** di un
Google Workspace serve:

1. Google Cloud Console → abilita **Admin SDK API** e **Google OAuth2 API**.
2. Crea un OAuth 2.0 Client ID (Web application).
3. Redirect URI autorizzato: `http://localhost:8080/api/auth/google/callback`
   (in locale) o `https://<dominio>/api/auth/google/callback` (deploy).
4. Scope: `openid`, `email`, `profile`,
   `admin.directory.user.readonly`, `admin.directory.user.security`.
5. L'utente che si autentica deve essere **super admin** del Workspace
   (gli utenti non-admin vengono bloccati al callback con un check via Admin SDK).
6. Compila `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` nel `.env`.

Per il billing reale servono inoltre le chiavi Stripe (vedi `.env.example`).

---

## Struttura del repo

```
artifacts/
  api-server/     Express: routes/ (auth, apps, scans, dashboard, billing, dev)
                  lib/ (google, stripe, risk, session, logger,
                        scan-service, scheduler, email), env, build.mjs
  shadow-it/      Frontend React/Vite (pages/, components/)
lib/
  api-spec/       openapi.yaml (fonte di verità) + config Orval
  api-zod/        schema Zod generati
  api-client-react/  hook React Query generati + custom-fetch
  db/             schema Drizzle + config drizzle-kit
scripts/          utility del workspace
docker-compose.yml  Postgres locale
```

---

## Scansioni automatiche & alert

- **Scheduler**: l'API esegue scansioni automatiche di ogni workspace connesso
  (con abbonamento attivo/trial) ogni `SCAN_INTERVAL_HOURS` (default 24h). I token
  Google scaduti vengono rinfrescati automaticamente prima di ogni scansione.
  Disattivabile con `ENABLE_SCHEDULER=false`.
- **Alert email**: alla scoperta di nuove app ad alto rischio, gli admin dell'org
  ricevono un riepilogo via email. Con SMTP configurato (`SMTP_*`) l'email viene
  inviata; senza SMTP l'alert viene loggato (utile in dev).

## Deploy self-hosted (single-server)

In produzione l'API può servire direttamente il frontend buildato:

```bash
pnpm build                       # typecheck + build di tutti i package
NODE_ENV=production \
APP_URL=https://tuodominio \
DATABASE_URL=... SESSION_SECRET=... \
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
node artifacts/api-server/dist/index.mjs
```

L'API rileva `artifacts/shadow-it/dist/public` (override con `STATIC_DIR`) e fa da
fallback SPA su `index.html`, così le route client (`/dashboard`, `/connect`…)
funzionano anche dopo un refresh o il redirect OAuth.

## Note

- Il progetto è stato migrato da Replit a sviluppo locale / self-hosting: rimossi
  i file e i plugin specifici di Replit. Il lockfile è stato esteso ai binari
  nativi `win32-x64` (esbuild, rollup, lightningcss, oxide) in `pnpm-workspace.yaml`.
- La route **`/api/dev/login`** (seed demo + bypass auth), **`/api/dev/run-scheduler`**
  e **`/api/dev/test-alert`** sono montate **solo** se `NODE_ENV !== "production"`.
  Non vengono mai esposte in produzione.

Vedi [PROGRESS.md](PROGRESS.md) per lo stato degli sprint.
