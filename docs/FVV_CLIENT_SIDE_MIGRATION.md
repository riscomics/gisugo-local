# FVV → Client-Side mp4 Migration (Study / Deferred)

**Status:** Deferred — not urgent. Current server-side FVV normalization is verified working
(2026-06-27). Do this later, ideally reusing the client recorder built for the other project.

**Created:** 2026-06-27

**Agent rule:** "verified working" dates here are historical — confirm `normalizeFaceVerificationVideo`
region/callable health via `firebase functions:list` + a live FVV read before citing. See `AGENTS.md`
§ "verify production data."

---

## 1. Goal
Replace the server-side Face Verification Video (FVV) normalization (Cloud Function `ffmpeg`
transcode) with a client-side path: the device records the final, web-ready `mp4` and uploads it
directly. No server transcode.

## 2. Why (and why NOT for the usual reasons)
Honest framing after reading the code:

- **NOT for cost.** FVV normalization runs **once per user, lifetime** (not a hot path). Ballpark
  ~$25–30 of Cloud Run compute per **100,000** lifetime verifications. Negligible.
- **NOT for bandwidth.** The capture is **already size-constrained** (360×640, 220 kbps video /
  24 kbps audio → ~146 KB files). The raw upload is already tiny, so skipping the server saves
  almost no bandwidth for FVV specifically.
- **The real reason: reliability / fewer moving parts.** The server path (upload → Cloud Function →
  ffmpeg → re-upload → Firestore patch) has more failure surface, which bit us during the
  2026-06-27 region relocation (CORS / missing public-invoker on a botched redeploy silently broke
  normalization). Client-side removes that entire failure class and the cold-start / 20 s-timeout
  risk. It also slightly speeds up the "saving" step (no transcode wait).

So: migrate **for architecture quality and reliability**, not for cost or bandwidth.

## 3. Current state (already in place — important)
The capture path already does most of the work:

- **Resolution constrained** at `getUserMedia` — `profile.js` `startFaceCapturePreview()`
  (~L1106–1111): `width ideal 360 / max 480`, `height ideal 640 / max 854`, `fps ideal 20 / max 24`.
- **Bitrate constrained** — constants `FACE_CAPTURE_VIDEO_BITRATE = 220000`,
  `FACE_CAPTURE_AUDIO_BITRATE = 24000` (~L917–918).
- **mp4 already preferred** — `startFaceCaptureRecording()` (~L1519–1535) tries
  `video/mp4;codecs=avc1.42E01E,mp4a.40.2` → `video/mp4` → webm fallbacks via `isTypeSupported`.
- **Upload + (current) server step** — save flow (~L1614–1634): uploads `face_intro.{ext}`, then
  `requestFaceVideoNormalization()` (~L638–670) calls the Cloud Function, then
  `cleanupStaleFaceIntroVariants()` (~L1412) deletes non-kept formats.
- **Resolver already mp4-first** — `resolveFaceVideoSources()` (~L529) probes `.mp4` then `.webm`.

**Implication:** on modern Chrome (126+) / Chromium mobile / Safari, the client is *already*
recording mp4. The server step is currently acting as (a) a **catch-all** that guarantees mp4 even
when the client recorded webm, and (b) a **standardizer** (canonical codec params, faststart/moov
placement, rotation). Client-only migration means giving up (a) and (b) — see §6 risks.

## 4. Browser support (verified 2026-06-27)
- **Safari (iOS + macOS):** records `mp4`/H.264 by default (Safari 14.5+ iOS). Cannot do webm.
- **Chrome (desktop + Android) 126+ (June 2024):** `mp4` muxing on by default
  (`video/mp4;codecs=avc1,mp4a.40.2`), **provided the device has a hardware H.264 encoder**
  (true on essentially all real phones; still must feature-detect).
- **Other Chromium mobile** (Edge, Samsung Internet, Brave): same engine → mp4.
- **Firefox (desktop + Android):** **no mp4 muxer** (Mozilla bug still open) — webm only. ← main gap.
- **Firefox on iOS:** fine (all iOS browsers are WebKit under the hood → mp4).
- Niche/old (old Chrome < 126, ancient Safari, legacy Android browser, IE): no mp4.

## 5. Proposed design (client-side, no fallback transcode)
Aligns with the project's "no fallback systems — fail clearly (0 or 1)" rule:

1. **Gate at capture open.** When opening the FVV capture overlay, feature-detect mp4:
   `MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2') ||
   isTypeSupported('video/mp4')`. If **false** → show a clear, trilingual
   "Please record in Chrome or Safari to verify" block and do **not** start the camera. (Better UX
   than letting them record then fail.)
2. **Record mp4 only.** Drop the webm entries from the `mimeTypes` list so the recorder never
   produces webm. Keep the existing resolution + bitrate constraints (already good).
3. **Upload directly as `face_intro.mp4`.** In the save flow, set extension to `mp4` and skip the
   normalization call.
4. **Remove the server call.** Delete the `requestFaceVideoNormalization()` invocation (and the
   helper) from `profile.js`. Keep `cleanupStaleFaceIntroVariants()` (harmless) and the resolver
   (already mp4-first) unchanged.
5. **Decommission the Cloud Function later.** Stop calling `normalizeFaceVerificationVideo`; it
   costs nothing dormant. Delete it (`firebase functions:delete normalizeFaceVerificationVideo
   --region asia-southeast1`) once confident.

## 6. Risks & mitigations
- **Device coverage (primary risk).** Must test mp4 capture on real target phones — modern iOS
  Safari + Android Chrome are fine; verify a couple of **older/budget Android** devices where a
  weak/missing H.264 encoder would trigger the §5.1 block. The block is the correct, clean failure.
- **Loss of server standardization.** The ffmpeg step currently normalizes codec params, ensures
  `+faststart` (moov atom at front for progressive playback), and fixes rotation metadata.
  Raw `MediaRecorder` mp4 is generally web-ready, but on some devices may have moov-at-end or
  rotation quirks. **Mitigation:** during testing, confirm captured mp4s play correctly on iOS
  Safari + Android Chrome (the picky targets) before removing the server step. If a real quirk
  appears, that single quirk — not a general transcode — is the only thing that would justify
  keeping any server processing.
- **Existing verified users: unaffected.** Their stored videos are already normalized mp4s; nothing
  migrates and the resolver already prefers mp4.
- **Trust-critical flow.** Treat as a real QA pass, not a quick edit. Roll out behind a quick manual
  test on 3–4 devices.

## 7. Exact touchpoints (`public/js/profile.js`)
- `startFaceCapturePreview()` (~L1097) — optionally gate before opening camera (or gate in
  `openFaceCaptureOverlay()` ~L1137).
- `startFaceCaptureRecording()` (~L1511) — trim `mimeTypes` to mp4-only; add the unsupported block.
- `finalizeFaceCaptureRecording()` (~L1439) — blob type will be mp4.
- Save flow (~L1614–1634) — set extension `mp4`; remove `requestFaceVideoNormalization()` call.
- `requestFaceVideoNormalization()` (~L638) — delete helper.
- `cleanupStaleFaceIntroVariants()` (~L1412) / `resolveFaceVideoSources()` (~L529) — leave as-is.
- `functions/index.js` `normalizeFaceVerificationVideo` (~L803) — decommission after rollout.

## 8. Test plan
1. iOS Safari (iPhone): record → verify mp4 stored, plays in profile + jobs view paths.
2. Android Chrome (modern): same.
3. Older/budget Android: confirm either clean mp4 capture OR the clean "unsupported browser" block.
4. Firefox desktop/Android: confirm it hits the block (expected), not a broken recorder.
5. Confirm an existing pre-migration verified account still plays back fine.

## 9. Effort & risk
- **Effort:** small-to-moderate; contained to the FVV capture/save path in one file + a trilingual
  unsupported-browser message. Most of the time is **device testing**, not coding.
- **Risk:** low on architecture/data (output is the same `face_intro.mp4`, same storage layout,
  same resolver); the real risk is device coverage + the playback-quirk check in §6.

## 10. Decision needed before building
Accept **hard-blocking** Firefox-on-Android and ancient browsers from FVV (tiny slice, especially in
mobile-first SE Asia)? If yes → clean, low-risk swap. If no → keep the server step as the only way to
support webm-recording browsers.

## 11. Recommended sequencing
Build + harden the client-side mp4 recorder in the **other project** first (where size/bandwidth is
the actual driver), then port the proven module here as a clean swap. Avoids rewriting a working
trust-critical flow on an unproven module.
