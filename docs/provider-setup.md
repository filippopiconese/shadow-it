# Setup provider OAuth (Google Workspace & Microsoft 365)

Guida pratica per registrare le app OAuth che ShadowGuard usa per collegare i
workspace dei clienti. **Si fa UNA volta** (lato vendor): il cliente non registra
nulla, fa solo "Connect" e concede l'accesso.

Le credenziali ottenute vanno in `.env` (locale) e nelle variabili d'ambiente su
Railway. Vedi `.env.example` per i nomi esatti.

---

## Google Workspace

### 1. Progetto + API
1. [Google Cloud Console](https://console.cloud.google.com) → crea un **progetto** (es. `shadowguard`).
2. **APIs & Services → Library** → abilita **Admin SDK API**.

### 2. OAuth consent screen
1. **APIs & Services → OAuth consent screen** → User type **External** → crea.
2. Compila nome app (`ShadowGuard`), email di supporto, dominio (`micro-saas.it`), logo.
3. **Scopes** → aggiungi i due scope *restricted*:
   - `https://www.googleapis.com/auth/admin.directory.user.readonly`
   - `https://www.googleapis.com/auth/admin.directory.user.security`
4. Salva. (Per la pubblicazione servono giustificazione scope + video demo + CASA — vedi sotto.)

### 3. Credenziali OAuth
1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Tipo **Web application**.
3. **Authorized redirect URIs**:
   - `https://shadowit.micro-saas.it/api/auth/google/callback`
   - `http://localhost:8080/api/auth/google/callback` (dev)
4. Crea e copia **Client ID** e **Client secret**.

### 4. Variabili
```
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
# GOOGLE_REDIRECT_URI default = <APP_URL>/api/auth/google/callback
```

### 5. Pilot vs pubblicazione
- **Pilot**: l'admin del cliente marca il client-id come **"Trusted"** nella propria
  Admin console (Security → API controls → App access control) → funziona senza verifica.
- **Pubblico (Marketplace)**: serve la **verifica Google** degli scope restricted +
  **security assessment (CASA)**.

---

## Microsoft 365 (Entra ID)

### 0. Tenant del vendor
Serve una **directory Entra** che possiedi tu. Note pratiche (aggiornate 2025):
- Il **M365 Developer Program** spesso **non** dà più il sandbox gratis (richiede VS sub).
- **Non** si può più creare un nuovo tenant "Entra Workforce" gratis da account personale.
- ✅ Soluzione: accedendo a [portal.azure.com](https://portal.azure.com) con un account
  Microsoft, Azure crea una **"Default Directory"** gratuita (Entra ID Free) — registra
  l'app **lì**, è sufficiente.

### 1. Registrazione app
1. [entra.microsoft.com](https://entra.microsoft.com) → **Microsoft Entra ID → App registrations → + New registration**.
2. Name: `ShadowGuard`.
3. **Supported account types**: **Accounts in any organizational directory (Multitenant)** ← obbligatorio.
4. Register. Copia **Application (client) ID**.

### 2. Redirect URI (Authentication → Add platform → Web)
Aggiungi **entrambi** i path, prod + dev:
- `https://shadowit.micro-saas.it/api/auth/microsoft/callback`
- `https://shadowit.micro-saas.it/api/auth/microsoft/consent`
- `http://localhost:8080/api/auth/microsoft/callback`
- `http://localhost:8080/api/auth/microsoft/consent`

### 3. API permissions (tipo **Application**, non Delegated)
- `User.Read.All`
- `Application.Read.All`
- `Directory.Read.All`

(I delegated di default `openid/profile/email/User.Read` bastano per il login admin.)
**Non** premere "Grant admin consent" lato vendor: lo concede ogni cliente a runtime.

### 4. Client secret
**Certificates & secrets → New client secret** → copia subito il **Value** (non il Secret ID!).

### 5. Variabili
```
MICROSOFT_CLIENT_ID=<application (client) id>      # GUID, 36 char
MICROSOFT_CLIENT_SECRET=<secret VALUE>             # ~40 char
# MICROSOFT_REDIRECT_URI default = <APP_URL>/api/auth/microsoft/callback
```

### 6. Come funziona il consenso (runtime, lato cliente)
Flusso a due hop in `routes/auth-microsoft.ts`:
1. login auth-code (`/organizations`) → identifica l'admin (solo **account work/school**:
   gli account personali vengono **giustamente rifiutati**).
2. admin consent → l'admin del cliente approva i permessi tenant-wide.
Da lì le scansioni girano **app-only** (client-credentials col nostro secret): salviamo
solo il `tenant_id`, nessun token per-org.

### 7. Test in locale
1. Crea un **utente work** nel tuo tenant: **Entra ID → Users → New user**, UPN
   `admin@<tuotenant>.onmicrosoft.com`, ruolo **Global Administrator**.
2. Avvia l'API con le env Microsoft impostate, apri il sito, **Connect Microsoft 365**.
3. Login con l'utente work → **Accept** sull'admin consent → torni in app.
4. Lancia una scansione (vuota se il tenant non ha app OAuth di terze parti; il flusso
   connect→consenso→scan si completa comunque).
5. Per dati realistici: fai login con utenti del tenant su SaaS "Sign in with Microsoft".

### 8. Publisher verification ("Verified" sulla schermata di consenso)
- **Post-pilot, non bloccante**: l'app funziona anche "unverified" (avviso giallo, ma
  l'admin può consentire).
- Per il badge **Verified**: iscrizione **Microsoft AI Cloud Partner Program** (gratis) →
  **Partner ID**, verifica dell'**azienda registrata**, **Publisher domain** = `micro-saas.it`,
  poi **App → Branding & properties → Publisher verification**.

---

## Troubleshooting Microsoft

| Sintomo | Causa probabile |
|---|---|
| "You can't sign in here with a personal account" | Atteso: usa un account **work/school** del tenant, non hotmail/outlook. |
| `consent_failed` / "We couldn't confirm Microsoft 365 access" | Lag di propagazione post-consenso (riprova) **oppure** secret errato (hai copiato il *Secret ID* invece del *Value*?). Controlla i log API (codice `AADSTS...`). |
| `invalid_state` | Sessione/cookie scaduti durante il giro OAuth → riparti dal Connect. |
| Token app-only fallisce (`AADSTS700016`) | L'app non è nel tenant: il cliente non ha completato l'admin consent. |
