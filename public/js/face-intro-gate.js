/**
 * One-time face intro before the first post or apply.
 * Recording stays on profile.html. This only checks the flag and
 * carries the interrupted post/apply back after the video is saved.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'gisugo_face_intro_resume_v1';
  const MAX_AGE_MS = 30 * 60 * 1000;
  let verifiedThisPage = false;

  function readDraft() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.intent || !parsed.savedAt) return null;
      if ((Date.now() - Number(parsed.savedAt)) > MAX_AGE_MS) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function writeDraft(draft) {
    const payload = JSON.stringify(draft);
    try {
      sessionStorage.setItem(STORAGE_KEY, payload);
      return true;
    } catch (_) {
      if (draft && draft.payload && draft.payload.photoDataUrl) {
        const slim = Object.assign({}, draft, {
          payload: Object.assign({}, draft.payload, { photoDataUrl: null, photoDropped: true })
        });
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
          return true;
        } catch (__) {
          return false;
        }
      }
      return false;
    }
  }

  async function userIsFaceVerified() {
    if (verifiedThisPage) return true;
    const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    if (!user || !user.uid) return true;
    if (typeof getUserProfile !== 'function') return true;
    try {
      const profile = await getUserProfile(user.uid);
      const verified = !!(profile && profile.verification && profile.verification.faceVerified);
      if (verified) verifiedThisPage = true;
      return verified;
    } catch (error) {
      console.warn('⚠️ Face intro check skipped:', error);
      return true;
    }
  }

  async function ensureFaceIntro(intent, payload) {
    if (await userIsFaceVerified()) return true;
    const saved = writeDraft({
      intent: String(intent || ''),
      returnUrl: window.location.href,
      payload: payload || null,
      savedAt: Date.now()
    });
    if (!saved) {
      console.warn('⚠️ Could not hold the post/apply draft. Face intro still required.');
    }
    window.location.href = 'profile.html?fvGate=1';
    return false;
  }

  function peekFaceIntroDraft() {
    return readDraft();
  }

  function takeFaceIntroDraft(intent) {
    const draft = readDraft();
    if (!draft || (intent && draft.intent !== intent)) return null;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
    return draft;
  }

  function markFaceIntroVerified() {
    verifiedThisPage = true;
  }

  window.gisugoEnsureFaceIntro = ensureFaceIntro;
  window.gisugoPeekFaceIntroDraft = peekFaceIntroDraft;
  window.gisugoTakeFaceIntroDraft = takeFaceIntroDraft;
  window.gisugoMarkFaceIntroVerified = markFaceIntroVerified;
})();
