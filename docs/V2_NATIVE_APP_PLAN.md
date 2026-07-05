# GISUGO V2 — Native App Development Plan

> Status: **Direction decided, build parked behind V1 hardening**
> Created: 2026-06-18
> Owner: solo build (designer/PM + AI-paired development)

This is the forward-looking reference for GISUGO V2: the dedicated cross-platform
(iOS + Android) native app. It captures decisions already made so future sessions
don't re-litigate them. Update this doc as decisions firm up.

---

## 1. Decision Summary (locked)

| Decision | Choice | Status |
|----------|--------|--------|
| Build a dedicated native app (V2) | Yes — iOS + Android | Committed |
| Stack | **React Native (Expo)** | Locked |
| Capacitor / hybrid wrapper | **Rejected** | Decided |
| Keep the web app after app launch | **Yes** (Facebook model) | Committed |
| Backend | **Reuse existing Firebase backend wholesale** | Committed |
| Build timing | **After V1 production hardening is done** | Sequenced |

---

## 2. The Core Strategic Insight

**V2 is not a rewrite of GISUGO. It is a new front end on top of the backend that
already exists.**

The expensive, hard, battle-tested part of any app is the backend, and GISUGO's is
done and live:

- Firestore data model + security rules
- Auth (email, Google, Facebook, phone OTP)
- Storage (profile photos, job photos, face-verification media)
- Cloud Functions (signup rate limiting, FV media access, FV audit/repair, FV video
  normalization via ffmpeg, notification counter sync, push-on-create, scheduled cleanup)
- FCM push notifications
- Reviews, applications, chat threads/messages, notifications

None of that is web-specific. It carries over to the native app essentially untouched
via the native Firebase SDKs. **The backend is the moat, and it is already built.**

So V2 scope = re-implement the front-end experience. Build velocity is high; design
decisions and flows are already validated in V1.

---

## 3. Target Architecture (end state)

Web and native coexist permanently — the proven "Facebook model":

- **Web app (existing codebase)** → desktop access, SEO/landing surface, mobile-web
  with an "Open in app" smart banner/deep link, and the **admin dashboard** (admin
  tooling is better as web anyway).
- **Native app (React Native)** → the consumer worker/customer experience, where
  native reliability and device access matter most.
- **Shared Firebase backend** → single source of truth for both.

```
        ┌──────────────┐     ┌──────────────────┐
        │   Web App    │     │  Native App (RN) │
        │ desktop/SEO/ │     │  iOS + Android   │
        │ admin/mobile │     │  consumer UX     │
        │   -web       │     │                  │
        └──────┬───────┘     └────────┬─────────┘
               │                      │
               └──────────┬───────────┘
                          ▼
              ┌──────────────────────────┐
              │   Firebase Backend       │
              │ Firestore / Auth /       │
              │ Storage / Functions /    │
              │ FCM  (unchanged)         │
              └──────────────────────────┘
```

---

## 4. Why Native (and Why It Fixes Current Pain)

Two of V1's documented, ongoing headaches are **web-only** problems that a native app
largely eliminates:

1. **iOS WebKit data-loading timeouts** (see `IOS_DATA_PATH_RISKS_2026-03-27.md` and
   `IOS_LEGACY_DEVICE_COMPATIBILITY_NOTE_2026-03-12.md`). These stem from Safari's
   handling of the Firestore **web** SDK. React Native Firebase uses the **native**
   Firestore SDK, which does not have that transport fragility. Whole category of bugs
   gone by default.
2. **Face Verification video capture.** Recording a selfie video reliably in mobile
   Safari is painful and inconsistent. Native camera APIs make FVV capture solid and
   predictable — important because FVV is core to the trust model.

---

## 5. Why React Native (and why not Capacitor)

**React Native (Expo) chosen because:**
- Keeps the JavaScript mental model (matches existing skills + Cursor/AI tooling).
- One codebase → both iOS and Android, genuinely native result.
- React Native Firebase gives native SDK access → the iOS reliability + camera/video
  wins come "for free."

**Capacitor rejected because:**
- UI still renders inside a WebView (WebKit on iOS), so Safari rendering/layout quirks
  persist.
- The iOS Firestore reliability win only materializes if the data layer is migrated to
  native bridge plugins anyway — not free with the wrapper.
- Reliable **video** capture (not just photo) is trickier in a WebView; FVV deserves
  true native camera access.
- Net: Capacitor keeps web baggage; React Native fully escapes WebKit.

(Flutter was also considered and set aside — the Dart learning curve buys polish that
React Native can also reach, not worth the context-switch for a solo JS builder.)

---

## 6. What Carries Over vs What Gets Rebuilt

| Layer | V2 plan |
|-------|---------|
| Firebase backend (Firestore, Auth, Storage, Functions, FCM) | **Reuse as-is** |
| Security rules / indexes | **Reuse** (hardened in V1 first) |
| Business logic / data flows | **Port concepts** (same queries, native SDK calls) |
| ~70 category landing pages | **Collapse into one data-driven template** |
| Page UI (jobs, messages, profile, new-post, dynamic-job, chat) | **Rebuild as RN screens** |
| FVV capture | **Rebuild with native camera** |
| Push notifications | **Native push (FCM via RN Firebase)** |
| Admin dashboard | **Stays on web** (not ported to native) |

---

## 7. Estimation Philosophy (agreed framing)

Do **not** estimate in human-coding-hours. With AI-paired development, code generation
is effectively instant. Estimate in three honest buckets:

- **Generation** — seconds to minutes. Near-zero. Do not price in hours.
- **Iteration loop** — the real session cost: review + test + tweak rounds. Scales with
  how visual/edge-casey the work is (CSS/viewport/native-device work eats more loops;
  pure logic eats fewer). This is *operator time*, not coding time.
- **Irreducible gates** — not compressible by AI:
  - App Store / Play Store review cycles (wall-clock, Apple can reject + force resubmit)
  - Real-device testing across iOS/Android
  - The trust/marketplace hardening tail (security, edge cases, QA)

Evidence basis: V1 features (e.g., FVV core) were *built* in hours, but production-grade
robustness accreted over many later sessions, and V1 is now in a dedicated hardening
phase. Expect the same shape for V2: **ruthless build speed, with deliberate buffers
only where reality demands them (store review + hardening).**

---

## 8. Sequencing

1. **Finish V1 production hardening first.** It is the literal foundation V2 sits on —
   especially the Firestore/Storage security-rule pass and the server-side notification
   work. A locked-down backend makes V2 cleaner and safer.
2. **Then build V2** on React Native against that hardened backend.
3. Keep the web app alive throughout (admin + desktop + mobile-web entry point).

---

## 9. Proposed Milestone Skeleton (for when the build starts)

1. **Walking skeleton** — Expo project, auth (email/Google/Facebook/phone), navigation,
   one real data-driven screen reading live Firestore.
2. **Feature parity** — category browse (single template), job detail/apply, new-post,
   jobs manager (listings/hiring/previous), chat (real-time), notifications, profile.
3. **Native plumbing** — FVV native camera/video capture, native push, deep links,
   "open in app" handoff from mobile web.
4. **Polish + hardening** — device testing matrix (incl. older iOS/Android), edge cases,
   performance.
5. **Store submission** — Apple Developer + Play Console setup, signing/provisioning,
   store listings, review cycles, launch.

---

## 10. Open / Parked Decisions

- Exact start date for V2 build (gated on V1 hardening completion).
- Solo vs. bringing in help for store/release process.
- Whether to adopt TypeScript for the RN codebase (recommended for a fresh build).
- Payments strategy (future; out of current scope).
- Whether mobile-web stays full-featured or becomes a thin "open the app" funnel.

---

## Change Log

- 2026-06-18 — Initial plan created. Direction locked: React Native (Expo), keep web
  app, reuse Firebase backend, build after V1 hardening. Capacitor and Flutter
  considered and set aside.
