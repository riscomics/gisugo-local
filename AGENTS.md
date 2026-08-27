# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
GISUGO is a mobile-first job/gig marketplace. It is a **static HTML + CSS + vanilla JavaScript** site (no framework, **no build step, no bundler**) served straight from the repo root, backed by a **Firebase serverless** backend (Auth, Firestore, Storage, Cloud Messaging, Cloud Functions). There are two front-end surfaces sharing the same backend: the consumer app (`index.html`, category pages, `login.html`, `jobs.html`, `profile.html`, `messages.html`, etc.) and the admin dashboard (`admin-dashboard.html`).

### Running the frontend (dev)
There is no build. Serve the repo root as static files and open pages directly:
```bash
python3 -m http.server 8000    # from repo root; then open http://localhost:8000/index.html
```
- `index.html` and category pages (e.g. `hatod.html` = Transporter, `aircon.html` = AC Cleaner, `plumber.html`, ...) are publicly browsable and load real gig data.
- `jobs.html` is auth-gated and redirects to `login.html`; browse via the category pages when not logged in.

### IMPORTANT: the client talks to LIVE production Firebase
`public/js/firebase-config.js` is hardcoded to the production Firebase project `gisugo1`, and the client has **no emulator wiring** (no `useEmulator` calls). Serving the static files connects reads/writes to the real production backend. Be careful: creating accounts, posting gigs, or writing data hits production. Prefer read-only browsing for smoke tests.

### ⛔ MANDATORY: verify production data — no stale assumptions
**Hard rule — not optional, not "when you remember":**

| If the user asks about… | You MUST run (same turn, before answering) |
|---|---|
| Account/login/auth methods | `node scripts/verify-production-data.js users-auth` |
| Phone on file / Direct contact | `node scripts/verify-production-data.js users-phone` |
| General platform counts / status | `node scripts/verify-production-data.js summary` |

**Do not answer until the command has run and you have read its output.**

1. **Docs are not evidence.** Never repeat a doc timestamp, `[USER]` note, or backlog line as fact.
2. **Provider names are not evidence.** `password` ≠ phone+password. You must read the **credential email** (`*@phone.gisugo.app` = phone+password; anything else = legacy email/password).
3. **Cite the check, not your memory.** State what the script showed for the account in question.
4. **If the command fails, say so.** Do not guess.

```bash
node scripts/verify-production-data.js users-auth    # login methods — REQUIRED before auth claims
node scripts/verify-production-data.js users-phone # phone storage
node scripts/verify-production-data.js summary     # collection counts
firebase functions:list
node --check functions/index.js
```

**Credentials:** `scripts/github-action-gisugo1-key.json` (gitignored, local) or `GOOGLE_APPLICATION_CREDENTIALS`.

**Also verify when relevant:** trace the code path in the repo; browser only for UI — not a substitute for `users-auth`.

**Forbidden:** parroting backlog items; inferring from `providerId` alone; "going forward I will…"; any auth/account claim without `users-auth` output in the same turn.

### Cloud Functions (backend)
`functions/` (Node 22). `firebase-tools` is **not** a project dependency. To run the functions emulator, install the CLI to a user-writable prefix (a plain `npm i -g` fails with EACCES because the default prefix is `/usr`):
```bash
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
npm install -g firebase-tools
cd functions && npm run serve   # = firebase emulators:start --only functions  (starts on :5001, no login needed)
```
The Firestore/PubSub-triggered functions are skipped unless the Firestore/PubSub emulators (which need Java) are also running; the HTTP callable function initializes fine on its own. The `npm ... incompatible with nvm` prefix warning is harmless — `npm install` still succeeds.

### Lint / test / build
There is **no lint config, no test suite, and no build**. As a syntax/build proxy for the backend use:
```bash
node --check functions/index.js
```

### Skip UI verification — ship immediately (user verifies live)

**Hard rule (2026-08-27):** Do **not** run browser walkthroughs, computerUse recordings, screenshot passes, or other long UI verification. The user verifies on production themselves.

After the code change is done, **ship immediately** — do not wait for the user to say Deploy:

- **CLOUD:** finish → PR → squash-merge yourself → *"Deployed — live in ~2 min."*
- **DESKTOP:** run `scripts/ship-everything.ps1` → *"Deployed — live on https://gisugo.com now."*

This is standing for every completed task. The production-data script rule above still applies when making auth/phone/count claims.

### Deploying to production

> ⛔ **STOP — STEP 0 (MANDATORY, DO THIS FIRST). Detect your environment BEFORE any deploy action.**
> There are TWO completely different procedures. Using the wrong one is a known, repeated mistake.
>
> **You are DESKTOP / LOCAL if:** you can run local `git` against a real local branch **and** a local `firebase` CLI exists (`firebase --version` works). This is Cursor Desktop on the user's machine.
> **You are a CLOUD AGENT if:** you are a Cursor Cloud/remote agent and **cannot** run `firebase deploy` (no local CLI / no credentials).
>
> Quick check when unsure: run `firebase --version`. If it returns a version → **DESKTOP**. If it's missing/unavailable → **CLOUD**.
>
> **DESKTOP never opens a PR to go live. CLOUD never runs `firebase deploy`.** Pick ONLY the matching section.

**Language (user-facing):** use **Deploy** only for go-live.

---

#### 🖥️ DESKTOP / LOCAL — **Deploy = SHIP EVERYTHING** (DEFAULT)

**Hard rule (2026-07-24):** When the user says **Deploy** / **ship** / **go live** / **ship everything**, that means **all three layers in one command** — not “firebase only”, not “commit only”, not “push only”:

1. **Commit** any shippable uncommitted work  
2. **Push** so `HEAD` == `origin/main`  
3. **Firebase deploy** so live matches that same commit  

**Why:** Push to `main` auto-deploys **committed** files via GitHub Actions. Manual `firebase deploy` ships **disk**. If those differ, live and GitHub ping-pong (incident 2026-07-20). Never deploy while shippable files are uncommitted.

**Mandatory command** (do not improvise a partial flow):

```powershell
# Dirty tree — message required:
powershell -ExecutionPolicy Bypass -File scripts/ship-everything.ps1 -Message "concise commit message"

# Already clean — push if needed + deploy:
powershell -ExecutionPolicy Bypass -File scripts/ship-everything.ps1
```

Optional: `-Only hosting` / `-Only hosting,functions` to override auto target detection.

**Forbidden on DESKTOP Deploy:**
- Bare `firebase deploy` while shippable files are still dirty  
- Saying “Deployed” after only commit or only push  
- Leaving uncommitted HTML/CSS/JS/functions on disk after a push  

**Do NOT** open a PR for DESKTOP go-live.

Tell the user (one line): *"Deployed — live on https://gisugo.com now."* (git + Firebase synced)

**Every completed task ships.** Do not wait for the user to say Deploy. Skip browser verification — they check live themselves.

Also see always-on rule: `.cursor/rules/deploy-means-ship.mdc`

---

#### ☁️ CLOUD AGENT — ship procedure (ONLY when no local `firebase` CLI)

**Every completed task ships:** finish changes → open PR if needed →
**squash and merge it yourself** → tell user *"Deployed — live in ~2 min."* Never push straight to
`main` without a PR. **Never run `firebase deploy`** from the Cloud Agent environment (merge to
`main` triggers GitHub Actions, which deploys).

Do not wait for the user to say **Deploy**. Do not run browser / computerUse verification first.

If merge fails (permissions, checks), say so in one line and give the PR link — that is the only case where the user may need to tap merge themselves.

---

**Talking to the user (both environments):**

1. **One line first** — deployed, or ready/PR link.
2. **Never** explain workflows, path filters, or GitHub Actions unless a deploy **failed**.

**Agent reference only** — on merge/push to `main`, GitHub Actions also deploys automatically based on what changed (secret `FIREBASE_SERVICE_ACCOUNT_GISUGO1`). That is why git must match disk before any manual Firebase deploy:

| What changed | Workflow | Result |
|---|---|---|
| Frontend (HTML/CSS/JS) | `firebase-hosting-merge.yml` | Live **https://gisugo.com** |
| `functions/**` | `firebase-functions-merge.yml` | Cloud Functions |
| `firestore.rules`, `storage.rules`, `firestore.indexes.json` | `firebase-rules-merge.yml` | Firestore rules, indexes, Storage rules |
| PR (any) | `firebase-hosting-pull-request.yml` | Preview URL on PR (not live) |

Manual fallback (only mention if deploy failed or user asks): **Actions → Deploy Functions (manual)** or **Deploy Rules (manual)**. Desktop-only combined picker: **Deploy Firebase Backend (manual)**.
