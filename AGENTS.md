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

> **Merge the PR = go live.** Tap **Squash and merge** on the PR. Everything in that PR deploys automatically (~1–2 min). The user does not need to open GitHub Actions or pick frontend vs backend.

**What to tell the user when they ask to deploy / ship / go live:**

1. **Start with one line:** e.g. *"PR ready — tap Squash and merge and everything in this PR goes live on gisugo.com (~2 min)."*
2. **PR link** + optional note that a **preview URL** will comment on the PR shortly.
3. **Only if they asked you to merge:** merge for them; otherwise stop at the PR.
4. **Do not** explain workflows, path filters, or manual Actions unless a deploy **failed** or they explicitly ask how it works.

**Example (good):**
> PR ready: [link]. Tap **Squash and merge** when ready — goes live on https://gisugo.com in ~2 min.

**Example (bad — never send this to the user):**
> Hosting deploys on merge; functions only if functions/** changed; otherwise use Actions → Deploy Functions (manual)…

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

When the user asks you to **deploy**, **publish**, **push live**, or **ship to production**:

1. **Finish the code changes** on a feature branch (not `main`).
2. **Open a Pull Request to `main`** (create one if it does not exist). Never push straight to `main`.
3. **Do not run `firebase deploy`** from the Cloud Agent environment.
4. **Reply to the user** using the short format above (TL;DR first, PR link, Squash and merge = live). Do not explain CI internals.
5. **Do not merge the PR yourself** unless the user explicitly says to merge it (e.g. "merge the PR", "squash and merge", "ship it now").

If the user only asked for changes **without** deploy language, still open a PR when work is done unless they say otherwise — but skip merge instructions unless they asked to deploy.
