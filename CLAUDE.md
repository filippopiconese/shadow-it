# CLAUDE.md

Guida per Claude Code (e per chi sviluppa) su questo repository.

## Cos'è

**ShadowGuard** — SaaS B2B per PMI che scansiona le **app OAuth di terze parti**
collegate a un **Google Workspace** (shadow IT) e le classifica per rischio. Un
super-admin del Workspace fa "Connect", concede accesso **read-only** via Google
OAuth/Admin SDK, e vede l'inventario delle app con punteggio di rischio, utenti
autorizzati, scope, storico scansioni e alert sulle nuove app ad alto rischio.

Fa parte della famiglia **Micro SaaS** (hub: `../micro-saas`, sito padre
`micro-saas.it`). A regime sarà su **shadowit.micro-saas.it**. Lancio **gratuito**
(no Stripe attivo).

## Stack

- Monorepo **pnpm workspaces**, **Node.js 24**, **TypeScript 5.9**.
- API: **Express 5** + Helmet + express-rate-limit, bundle **esbuild** (ESM).
- DB: **PostgreSQL** + **Drizzle ORM** (drizzle-kit per lo schema).
- Auth: **Google OAuth2 + Admin SDK** (`googleapis`).
- Frontend: **React + Vite + TanStack Query + wouter + shadcn/ui + recharts**, Tailwind v4.
- Contratti: **OpenAPI → codegen Orval** (hook React Query) + **Zod** (validazione server).
- Email: **nodemailer** (SMTP per-cliente).

## Comandi

```bash
pnpm install                      # installa il workspace
pnpm db:up                        # Postgres locale via Docker (host :5433)
pnpm db:push                      # applica lo schema Drizzle (interattivo)
pnpm dev:api                      # build+avvio API su :8080
pnpm dev:web                      # Vite dev server su :25255
pnpm build                        # typecheck + build di tutti i package
pnpm typecheck                    # typecheck del workspace
pnpm test:isolation               # test isolamento multi-tenant (richiede API avviata)
pnpm --filter @workspace/api-spec run codegen   # rigenera client+Zod da openapi.yaml
```

**Dev "due server"** (sviluppo UI): `pnpm dev:api` + `pnpm dev:web`, apri :25255
(Vite fa da proxy `/api` → :8080). `.env` viene caricato in automatico dall'API.

**Single-server** (come in produzione / per testare OAuth reale): builda la SPA e
avvia solo l'API, che la serve su :8080:
```bash
pnpm --filter @workspace/shadow-it build && pnpm dev:api   # tutto su http://localhost:8080
```

**Docker** (come Railway): `docker build -t shadowguard .` poi `docker run`.

## Dove vivono le cose

```
artifacts/
  api-server/   Express. routes/ (auth, apps, scans, dashboard, billing, settings, demo, dev)
                lib/ (google, scan-service, scan-providers, scheduler, risk, email,
                      crypto, entitlements, session, demo-data, logger), env.ts, build.mjs
  shadow-it/    Frontend React/Vite. src/pages, src/components, public/ (logo, favicon)
lib/
  api-spec/     openapi.yaml = FONTE DI VERITÀ dei contratti API + config Orval
  api-zod/      schema Zod GENERATI (non editare a mano)
  api-client-react/  hook React Query GENERATI + custom-fetch (non editare i generated)
  db/           schema Drizzle (organizations, users, oauth_apps, scans, subscriptions) + drizzle.config
scripts/        utility (test-isolation.mjs, ecc.)
Dockerfile, railway.json, docker-compose.yml, .env.example
```

## Architettura / decisioni

- **Contract-first**: modifica `lib/api-spec/openapi.yaml`, poi `pnpm --filter
  @workspace/api-spec run codegen`. **Mai** editare i file in `*/generated/`.
- **Scansione**: la logica è in `lib/scan-service.ts` (`createScan` + `executeScan`),
  condivisa da `routes/scans.ts` (manuale) e `lib/scheduler.ts` (automatica).
  Il provider è in `lib/scan-providers.ts`: `SCAN_PROVIDER=google` (Admin SDK reale)
  o `mock` (dati sintetici). **L'org demo usa SEMPRE il mock**, anche in prod.
- **Scheduler**: `lib/scheduler.ts`, intervallo `SCAN_INTERVAL_HOURS` (default 24h),
  disattivabile con `ENABLE_SCHEDULER=false`. Scansiona ogni org connessa+entitled.
- **Entitlement / pricing**: `lib/entitlements.ts`. `LAUNCH_FREE=true` (default) →
  tutti entitled, **Stripe dormiente**. Le route Stripe esistono ma non sono usate.
- **Cifratura at-rest**: `lib/crypto.ts` (AES-256-GCM, `TOKEN_ENCRYPTION_KEY`). Cifra
  i **token OAuth** e la **password SMTP**. Formato `enc:v1:…`; i valori senza prefisso
  passano invariati (no migrazione). Senza chiave → fallback in chiaro (warn; error in prod).
- **Email/alert**: `lib/email.ts`. SMTP **per-organizzazione** (pagina Settings) →
  le mail partono dall'infra del cliente. Fallback: `SMTP_*` env, poi log.
- **Multi-tenant**: ogni query è filtrata per `organizationId` (dalla sessione).
  Coperto da `pnpm test:isolation`.
- **Demo pubblica** (`routes/demo.ts`, `/api/demo/*`): sandbox sull'org `demo-acme.com`,
  attiva anche in prod salvo `DEMO_ENABLED=false`. Endpoint **dev** pericolosi
  (`routes/dev.ts`: run-scheduler, test-alert, seed-tenant, login-as) montati **solo**
  se `NODE_ENV !== "production"`.
- **Static serving**: in prod l'API serve la SPA buildata (`shadow-it/dist/public`,
  override `STATIC_DIR`) con fallback SPA per le route non-`/api`.

## Variabili d'ambiente

| Var | Note |
|-----|------|
| `PORT` | default 8080 (API) / 25255 (Vite). Railway lo inietta. |
| `DATABASE_URL` | Postgres. In dev: `…@localhost:5433/shadowit`. |
| `SESSION_SECRET` | firma sessioni. |
| `TOKEN_ENCRYPTION_KEY` | **richiesto in prod**. 32 byte: `openssl rand -base64 32`. |
| `APP_URL` | URL pubblico (redirect OAuth/Stripe). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth client del vendor (uno solo). |
| `GOOGLE_REDIRECT_URI` | deve combaciare con la Console: `<APP_URL>/api/auth/google/callback`. |
| `SCAN_PROVIDER` | `google` (reale) o `mock` (dev senza Google). |
| `LAUNCH_FREE` | `true` = tutto gratis, no Stripe. |
| `DEMO_ENABLED` | `true` = demo pubblica attiva. |
| `SCAN_INTERVAL_HOURS` / `ENABLE_SCHEDULER` | scheduler scansioni. |
| `SMTP_*` / `EMAIL_FROM` | fallback globale SMTP (opzionale; preferibile per-org). |

## Gotchas

- **Express 5**: usa `/{*splat}` non `*` per i wildcard; `Array.isArray(req.params.id) ? …`.
- **drizzle-kit push** è interattivo → in CI/Docker/non-TTY usa `push-force`
  (`pnpm --filter @workspace/db run push-force`). Lo start su Railway lo fa già.
- **pnpm 11 + build script**: in non-TTY pnpm esce non-zero su "ignored build scripts".
  Il Dockerfile installa con `--ignore-scripts` (esbuild/rollup/lightningcss usano
  binari prebuilt, non serve postinstall).
- **Lockfile**: generato su Linux (Replit). I binari nativi `win32-x64` (esbuild,
  rollup, lightningcss, oxide) sono riabilitati in `pnpm-workspace.yaml` per lo
  sviluppo su Windows.
- **Deploy Railway = Dockerfile**, NON Nixpacks (Nixpacks usa un corepack 0.24.1 che
  va in crash con Node 24 + pnpm 11). Vedi `railway.json` (builder DOCKERFILE).
- **Cookie in prod**: `secure`+`sameSite=none` → richiedono HTTPS. `app.set('trust proxy',1)`
  è già impostato per stare dietro al proxy di Railway.
- **Codegen**: dopo ogni modifica a `openapi.yaml` esegui il codegen, altrimenti
  front e back vanno fuori sync (errori di tipo nel frontend).

## Google OAuth / go-to-market

- Il **vendor** configura UN solo OAuth client (Google Cloud project; **non** serve
  possedere un Workspace). Ogni **cliente** "collega" il proprio Workspace via consenso.
- Gli scope `admin.directory.*` sono **restricted** → per una listing pubblica sul
  Marketplace serve la verifica + security assessment (CASA). **Per i pilot** basta
  che l'admin cliente marchi il client-id come **"Trusted"** nella propria Admin console
  (Security → API controls) → l'app funziona anche non verificata.

Vedi `PROGRESS.md` per lo storico degli sprint e lo stato corrente.
