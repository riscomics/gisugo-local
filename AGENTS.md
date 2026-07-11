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

### Deploying (GitHub Actions → production)

**User-facing rule (always lead with this — never dump the table below on the user):**

| User says | Agent does | Agent tells user |
|---|---|---|
| **Ship it** / **deploy** / **go live** / **deploy and merge** | Open PR (if needed) → **squash and merge for them** | *"Shipped — live on gisugo.com in ~2 min."* |
| Changes only, no deploy words | Open PR, stop | *"PR ready: [link]. Say **ship it** when you want it live."* |

**The user should never tap anything when they said ship/deploy/go live.** Do not reply with "tap Squash and merge" if they already asked you to ship.

**What to tell the user:**

1. **One line first** — shipped, or PR ready.
2. **PR link** only if useful (e.g. they want to preview first).
3. **Never** explain workflows, path filters, or GitHub Actions unless a deploy **failed**.

**Example (user said "ship it"):**
> Shipped. Live on https://gisugo.com in ~2 min.

**Example (user only asked for a fix, no deploy):**
> PR ready: [link]. Say **ship it** when you want it live.

**Example (bad — never send when user said ship):**
> Tap Squash and merge when ready…

---

**Agent reference only** — merge to `main` triggers GitHub Actions automatically based on what changed. Cloud Agents never run `firebase deploy` locally; secret is `FIREBASE_SERVICE_ACCOUNT_GISUGO1`.

| What changed | Workflow | Result |
|---|---|---|
| Frontend (HTML/CSS/JS) | `firebase-hosting-merge.yml` | Live **https://gisugo.com** |
| `functions/**` | `firebase-functions-merge.yml` | Cloud Functions |
| `firestore.rules`, `storage.rules`, `firestore.indexes.json` | `firebase-rules-merge.yml` | Firestore rules, indexes, Storage rules |
| PR (any) | `firebase-hosting-pull-request.yml` | Preview URL on PR (not live) |

Manual fallback (only mention if deploy failed or user asks): **Actions → Deploy Functions (manual)** or **Deploy Rules (manual)**. Desktop-only combined picker: **Deploy Firebase Backend (manual)**.

**Desktop fallback (local CLI):**
```bash
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### Cloud Agent: how to ship changes (required behavior)

**Ship / deploy / go live** (including "deploy and merge") means: finish changes → open PR if needed → **squash and merge it yourself** → tell user *"Shipped — live in ~2 min."* Never push straight to `main` without a PR. Never run `firebase deploy` from the Cloud Agent environment.

**Changes only** (no deploy language): open a PR when work is done; tell user they can say **ship it** to go live. Do not merge.

If merge fails (permissions, checks), say so in one line and give the PR link — that is the only case where the user may need to tap merge themselves.
