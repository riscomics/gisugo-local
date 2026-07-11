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

**Cloud Agents do not run `firebase deploy` locally.** All deploys go through GitHub Actions using secret `FIREBASE_SERVICE_ACCOUNT_GISUGO1`.

| What changed | Trigger | Workflow | Result |
|---|---|---|---|
| Frontend (HTML/CSS/JS) | PR to `main` | `firebase-hosting-pull-request.yml` | Preview URL on PR (not live) |
| Frontend | Merge to `main` | `firebase-hosting-merge.yml` | Live **https://gisugo.com** |
| `functions/**` | Merge to `main` | `firebase-functions-merge.yml` | Cloud Functions deploy |
| Rules/indexes files | Merge to `main` | `firebase-rules-merge.yml` | Firestore rules, indexes, Storage rules |
| Backend (your choice) | **Manual** — GitHub → Actions → **Deploy Firebase Backend (manual)** → Run workflow | `firebase-backend-manual.yml` | Pick: functions only, rules only, or both |

**Path-based backend deploys only run when those files change** — a frontend-only merge won't touch Functions or rules.

**Manual backend deploy (phone or desktop):** GitHub app or web → repo **Actions** → **Deploy Firebase Backend (manual)** → choose target → **Run workflow**. No PR merge required (use when code is already on `main`).

**Mobile / remote workflow:** Cloud Agent → PR → merge when ready. Hosting always deploys on merge; Functions/rules deploy automatically **only if** those files were in the merge.

**Desktop fallback:**
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
4. **Tell the user clearly:**
   - The **PR link**
   - That a **preview URL** will appear as a comment on the PR in ~1–2 min (safe to check before going live)
   - That going live = tap **Squash and merge** on the PR (this is the deploy button)
   - That **https://gisugo.com** updates ~1–2 min after merge (hosting)
   - If the PR changed `functions/**` or rules files, backend workflows also run on merge (see deploy table above)
   - For backend deploy without a new merge: tell user to run **Actions → Deploy Firebase Backend (manual)**
5. **Do not merge the PR yourself** unless the user explicitly says to merge it (e.g. "merge the PR", "squash and merge", "ship it now").

**Example message to user after opening a PR:**
> PR ready: [link]. Preview URL will post on the PR shortly. Tap **Squash and merge** when ready — hosting goes live on https://gisugo.com. Functions/rules deploy on merge only if those files changed; otherwise use **Actions → Deploy Firebase Backend (manual)**.

If the user only asked for changes **without** deploy language, still open a PR when work is done unless they say otherwise — but skip the merge instructions unless they asked to deploy.
