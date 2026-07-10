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

### Deploying (hosting only — production frontend)
**Cloud Agents do not run `firebase deploy`.** Hosting goes live via GitHub Actions after a PR is merged to `main`.

| Trigger | Workflow | Result |
|---|---|---|
| Open/update a PR to `main` | `.github/workflows/firebase-hosting-pull-request.yml` | Preview channel URL posted as a PR comment (not live) |
| Merge/push to `main` | `.github/workflows/firebase-hosting-merge.yml` | Live deploy to **https://gisugo.com** |

**Mobile / remote workflow:** make changes in a Cloud Agent → open PR → (optional) check preview URL on the PR → merge from phone → live site updates automatically (~1–2 min).

**Scope:** CI deploys **hosting only** (`firebase deploy --only hosting` equivalent). Functions, Firestore rules, and Storage rules are **not** deployed by CI — change those from desktop with explicit intent.

**Secrets:** GitHub repo secret `FIREBASE_SERVICE_ACCOUNT_GISUGO1` (Firebase deploy service account JSON). Do not commit credentials to the repo.

**Manual deploy (desktop fallback):**
```bash
firebase deploy --only hosting
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
   - That **https://gisugo.com** updates ~1–2 min after merge
5. **Do not merge the PR yourself** unless the user explicitly says to merge it (e.g. "merge the PR", "squash and merge", "ship it now").

**Example message to user after opening a PR:**
> PR ready: [link]. A preview URL will be posted on the PR shortly. When you're happy with it, tap **Squash and merge** — that deploys to https://gisugo.com (hosting only).

If the user only asked for changes **without** deploy language, still open a PR when work is done unless they say otherwise — but skip the merge instructions unless they asked to deploy.
