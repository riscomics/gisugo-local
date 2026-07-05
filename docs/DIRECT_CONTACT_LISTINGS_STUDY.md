# GISUGO — "Direct" Contact-Only Listings (Design Study)

> Status: **Idea / parked for later** · Created 2026-07-03
> Decision so far: **Platform-first stands.** This is a possible *future* opt-in mode, not a
> committed feature. Written up so we can pick it back up without re-deriving the reasoning.
> Companion: `docs/V1_HARDENING_TASKLIST.md`, `FIREBASE_SCHEMA.md`.

---

## 1. The core idea

Give a customer, **when posting a gig**, a choice between two listing types:

- **Platform gig (default):** the current flow — workers Apply, customer hires through the
  chat/offer handshake, completion + ratings + records all captured.
- **Direct / contact-only listing:** instead of an Apply button, the gig shows (or reveals via
  an overlay) the **customer's phone number**. Workers call/text the customer directly and the
  rest happens off-platform.

The Direct listing is essentially a **classified ad that lives inside the platform**, behind our
disclaimer/tips overlay.

## 2. Why this shape (and not the earlier idea)

We first considered a **mid-flow communication fork** (customer picks "call worker" vs "chat"
at the "Contact to Hire" step). **Rejected** because it splits the flow *after* the machinery has
already started — ambiguous "who marks Hired," half-created chat threads, worker's number exposed
without clean up-front consent.

The **post-level choice is cleaner:**
- Decided **up front**, once, by the customer at post time.
- Consent + disclaimers are shown during posting, not bolted on mid-flow.
- No divergence inside the hire flow → nothing half-built downstream.

## 3. Decision context — platform-first

We agreed GISUGO is a **platform, not a bulletin board.** The value/moat is being *inside* the
transaction: trust, ratings, completion records, safety trail, and future monetization hooks.

A permanent, prominent Direct path risks the **leak problem**: once a number is shared, all future
gigs between that pair go off-platform forever, and it trains the highest-value repeat users to
bypass us. So Direct — *if* built — must be **contained and opt-in**, never the default.

## 4. What Direct bypasses (the "logic train" we reconstructed)

Hiring was routed through chat because a hire is not one click — it's entry into a tracked,
two-sided contract lifecycle. Direct skips **all** of this:

- **Handshake (offer → accept)** — no mutual consent step; the gig never becomes a recorded contract.
- **`agreedPrice` capture** — no agreed price stored → completion earnings stats can't compute.
- **Gig Status lifecycle** — no Mark Completed / Relist / Resign / mutual face-verification video.
- **Completion → earnings + ratings** — Direct gigs feed the **trust system nothing** (no reviews,
  no `totalEarned`/`totalSpent`).
- **Other-applicant handling + slot release** — N/A (no Apply on Direct listings).
- **Dispute paper trail** — no statuses/reasons to fall back on.

Net: Direct simplifies the front door but strips the machinery that makes the platform trustworthy
and measurable. That's the accepted trade-off *for gigs the customer explicitly opts to run this way.*

## 5. How it would work (sketch)

**At post time (new-post / new-post2 flow):**
- Add a listing-type choice: "Platform gig" vs "Direct contact."
- If Direct: explain clearly (trilingual) what it means — no in-app hiring, no ratings, coordinate
  by phone, GISUGO isn't in the transaction. Customer's phone number will be shown to workers.
- Store the listing type + (for Direct) confirm the customer has a verified phone on file.

**On the gig page (dynamic-job):**
- Platform gig → current Apply button + apply overlay.
- Direct gig → a **different button** (e.g., "CONTACT CUSTOMER") that opens an overlay with:
  - the same trilingual disclaimer/tips surface we already show at Send/Accept offer,
  - the customer's phone number (call/text actions),
  - a safety/consent note.

**Data model (rough):**
- `jobs` doc: `listingType: 'platform' | 'direct'` (default `'platform'`).
- Direct gigs: no `applications` subtree, no chat thread, no hire lifecycle fields.

## 6. Guardrails / decisions to make before building

- **Trust stats isolation:** Direct gigs must **not** pollute ratings/earnings/completion metrics.
- **Phone verification:** requires **mandatory verified phone at signup** (also a trust/safety win).
- **Consent surface:** the disclaimer overlay is the **liability shield** — must be explicit that
  GISUGO is not party to Direct arrangements.
- **Keep platform the default:** Direct should be visually secondary so it doesn't cannibalize the
  platform path. Consider limits/flags on how freely Direct can be used.
- **Abuse/safety:** exposing phone numbers invites spam/harassment/off-platform scams — the users
  most likely to benefit (low-tech) are also the most exposed. Consider masked/relay calling as a
  middle ground that keeps a record without revealing raw numbers.

## 7. Prerequisites

- **Mandatory phone number at user signup** + phone verification mechanism (currently optional).
- Post-flow UI for the listing-type choice + Direct disclaimer.
- Gig-page Direct button + contact overlay.

## 8. Open questions

- Does the **business model** depend on being in the transaction (fees, verified completions, trust
  badges, mediation)? If yes, Direct stays a contained side-door. If the model is pure paid
  visibility/lead-gen, Direct is *aligned* and the chat system may be heavier than needed.
- **Masked/relay calling** (e.g., Twilio-style) vs raw number exposure — worth the cost/complexity?
- Should Direct gigs still capture a lightweight "was this filled?" signal for platform health,
  even without full ratings?

## 9. Refinements & decisions (2026-07-03)

- **Contact reveal = callable Cloud Function (hard requirement).** `jobs` docs are **public**
  (`firestore.rules`: `match /jobs/{jobId} { allow read: if true; }`), so a phone stored on the job
  doc is scrapable straight from the API — a UI overlay does nothing against bots. Therefore the
  Direct phone number must **NOT** live on the public job doc. Instead, a callable
  `revealDirectContact(jobId)` that: (a) requires auth, (b) rate-limits, (c) **increments the
  dashboard reveal counter**, (d) returns the number. **One mechanism covers scraping protection +
  privacy + the usage metric (§8 / earlier #7).**
- **Flow reuses the existing 2-overlay pattern** (same as platform Apply confirm):
  1. Button (a "CONTACT CUSTOMER" variant of Apply).
  2. **Overlay 1** — trilingual disclaimer/tips, **including the worker-fairness note** (Direct gigs
     give the worker no rating/history/record).
  3. Confirm → **Overlay 2** — customer contact info (call/text). Opening Overlay 2 is what fires
     `revealDirectContact` (returns number + bumps the counter).
- **Charging for Direct posts: deferred.** Good monetization lever, but **not at launch.**
- **Modify-Gig owns the toggle.** Listing-type switch + Direct↔Platform conversion lives in the
  existing edit-gig flow (policy/plumbing, no new surface).
- **Feed distinction = card color.** Give Direct its own card color like Per Gig / Per Hour (cheap).
  **Future-proof the Filter Gigs overlay now** with an **internal scroll region at a fixed structural
  height**, so adding more listing types later won't re-break all the media breakpoints.
- **Privacy consent placement.** It is the **customer's** number being shared → consent belongs at
  **gig-post creation**. Separately, making **phone mandatory at signup** needs its own consent line.
  (Workers don't share numbers in this model; they call out — caller-ID is a minor separate matter.)

## 9b. PREFERRED DIRECTION — the "flip" (worker→customer reveal) (2026-07-03)

Instead of revealing the **customer's** number on the public gig page, flip it: the worker's Apply
sends the **worker's** contact into the customer's **Gigs Manager → Customer → Listings → View
Applications** card, alongside the usual rating / View Profile (FVV) / Reject / **Contact to Hire**.
The number is revealed to the customer only on **Contact to Hire**.

**Why this is preferred over §1's post-level model:**
- **Worker Apply flow untouched** — no new worker-facing surface; keeps the whole existing UX.
- **Trains customers into the platform** — they must open View Applications to act (behavioral nudge).
- **Reveal happens in an authenticated area**, not a public page — strictly better than a number on
  the public job doc.

**Scraping — solved by storage design, NOT dependent on the lockdown (corrected 2026-07-03):**
- Earlier this section claimed the flip's safety "depends on the Track B applications-read lockdown."
  That was an overstatement. The risk only exists if the phone is stored in a readable doc (the public
  `jobs` doc, or the auth-readable `applications` doc).
- **The clean build avoids it entirely:** store the worker phone ONLY in the worker's private profile
  (owner-only readable) and serve it solely via the ownership-checked `revealApplicantContact` callable.
  Then the number is never in any readable job/application doc — a scraper querying `applications` gets
  nothing and cannot call the callable for gigs it doesn't own.
- So Direct is **not** blocked on the Track B lockdown. (Track B remains worthwhile for OTHER applicant
  data — names, messages — but it's an independent task.)

**New risk — reverse harvesting:** a bad actor posts **fake gigs to farm worker numbers** at scale.
Workers are the more vulnerable party → arguably worse than exposing a customer number. Mitigations:
- **Reveal only on Contact-to-Hire**, NOT on the application card by default (deliberate intent).
- Reveal via callable `revealApplicantContact(applicationId)`: verifies caller **owns the gig**,
  **rate-limits**, **bumps the dashboard reveal counter**, returns the number.
- **Never store the plaintext worker number on the application doc** — keep it in the worker's
  private profile (owner-only readable); the callable (admin) fetches + returns it to the verified owner.

**CORRECTION (2026-07-03): ratings/earnings are NOT lost — see §9c.** Earlier drafts said the phone
branch had no completion/ratings. That's wrong for this design: the **Hire button still runs normal
platform hire/complete mechanics** on the existing gig + application data (price + both parties are
already there). Only the *conversation* moves off-platform; the *hire record* stays on-platform.

**Consent:** in the flip, the **worker's** Apply disclaimer (Overlay 1) must state their contact may
be shared with the customer (this makes the §5 "contact-shared" notice a real task, worker-side).
Mandatory phone at signup still needs its own consent line.

**Verdict:** flip is the committed direction. Only condition: (a) reveal is gated behind Contact via
the ownership-checked callable with the phone in private storage. It does **not** depend on the Track B
lockdown or the Admin Dashboard.

## 9c. The paradigm shift — Direct as the model-aligned path (2026-07-03)

The Direct flip is not just a friction fix. It aligns the product with the **actual business model**:
GISUGO takes **no commission** — it's a **publishing / lead-generation platform**, not a transaction
intermediary. Holding both parties' hands to completion (in-app chat, photo proof, dispute custody)
was arguably over-scoped for that model.

**What Direct keeps vs. outsources:**
- **KEEPS on-platform:** the hire record + completion mechanics (price, parties, statuses) → ratings
  and earnings are **preserved**, because the **Hire button runs the same platform hire/complete
  writes** on the existing gig + application. (This corrects the earlier "no ratings/earnings" claim.)
- **OUTSOURCES off-platform:** the *communication* (negotiation + any photo proof) → moves to whatever
  messaging app the two parties already use. This removes chat **photo-upload storage/egress cost**
  and removes dispute-proof custody from GISUGO's responsibility (consistent with lead-gen economics —
  must be stated in ToS: dispute proof is the users' responsibility).

**The human-behavior flow (customer side, in Gigs Manager → Customer → Listings → View Applications):**
1. Application card shows rating, View Profile (FVV), **Reject**, **Contact**, **Hire** (Hire sits
   below Contact in the SAME overlay — no separate delayed overlay).
2. **Contact** → `tel:`/`sms:` launch (number never displayed; fetched via the rate-limited callable).
   Overlay stays as-is behind the phone/messaging app.
3. Customer talks/texts, decides over minutes–hours, returns to the GISUGO tab.
4. **Hire** (or **Reject**) is already right there in the persistent overlay → Hire runs normal
   platform hire/completion mechanics.

**Why Hire lives in the first overlay (not a delayed second one):** there is no reliable "user
returned from the phone app" event, and the decision gap is unbounded (minutes–hours). A persistent
Reject/Contact/Hire overlay is robust; a delayed overlay is fragile. **Listener hygiene:** reuse the
existing cleanup registry so Contact/Hire handlers don't double-bind.

**TRACE RESULT (2026-07-03): the full hire lifecycle ALREADY lives in Gigs Manager, chat-free.**
Verified in `jobs.js` — nothing critical needs migrating out of chat:
1. Review applicants → View Applications (ratings, View Profile/FVV, Reject, Contact to Hire).
2. Send offer → `hireWorker` via `processHireConfirmation` (jobs.js ~8802) → moves to Hiring tab.
3. Worker accepts → Offered tab → `moveJobFromOfferedToAccepted`.
4. Mark completed + feedback → Hiring tab → `handleCompleteJob` (writes earnings stats).
5. Fire/relist → `handleRelistJob`. 6. Resign (worker) → `handleResignJob`.
7. Watch FVV → `openFaceVerificationViewer` (also in View Applications). Worker is alerted via
   notifications + push (separate from chat), then accepts in the Offered tab.

**Over-engineering found:** the **chat Gig Status modal** (`gig-overlays.js`: complete/relist/resign)
and **OPEN HIRE CHECKLIST** (`messages.js` → `hireWorker`) are **duplicate mirrors** of the same
backend ops Gigs Manager already exposes. The hire lifecycle exists **twice** (Gigs Manager + chat).
Under the Direct/premium-chat direction this duplication can collapse (chat mirrors become optional
/ premium), not a blocker.

**Net-new work for Direct (everything else = reuse Gigs Manager):**
- **Contact reveal (tel:/sms:)** in View Applications via the rate-limited callable.
- **Worker phone storage + `revealApplicantContact` callable** (+ dashboard reveal counter).
- **Price-verify field** on the existing hire-confirmation step (`processHireConfirmation`).
- **Worker-apply consent line** (contact may be shared).

**Decisions locked (2026-07-03):**
- **Hire reuses the existing offer flow** — sends an offer the worker confirms via the Offered tab.
  Two-sided handshake + Gigs Manager stay intact; no chat thread required.
- **Agreed-price verify at Hire** — hire step shows trilingual disclaimers **plus a price-verify
  field** (confirm/adjust); confirmed value becomes `agreedPrice`, reflected on worker accept.

**Bigger strategic threads (major, not toggles):**
- **Chat as a premium subscription tier** (free = Direct/phone; paid = in-app chat w/ photos + records).
- **Segregate Alerts / Chats / Support** (currently unified in `messages.html`) to support tiering.
- Both are **repositioning** with liability implications (zero in-app records = zero mediation ability).
  Defensible under an explicit hands-off lead-gen ToS, but must be stated, not implied.

**Reverse-harvesting (settled):** universal to every job platform; unsolvable by mechanics beyond
account audits + rate-limits. GISUGO adds far more friction than open-info boards (Craigslist/FB
Marketplace). Not treated as a blocker.

## 10. Related friction work (separate, already actionable)

Some of the "flow feels clunky" worry is **execution, not concept** and can be fixed without Direct:
- **Notification deep-linking + punchier tray copy** (root-caused 2026-07-03: pushes hardcode
  `link: "/messages.html"` instead of a `?threadId=&role=&tab=` deep link that `messages.js` already
  supports). Tracked separately.
- General **hire-flow tap-count review** for over-engineering (pending trace).
