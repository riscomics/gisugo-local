/**
 * Ad Placement runtime adapter (Phase 6).
 * One-shot read of adSettings/global. No listener. No impression writes.
 */
(function initAdConfigService(window) {
  function normalizeAdminAction(action) {
    const src = action && typeof action === 'object' ? action : {};
    const type = String(src.type || 'navigate');
    const target = String(src.target || src.url || src.modalId || src.youtubeEmbed || src.videoSrc || '').trim();

    if (type === 'open_modal') {
      const modalId = String(src.modalId || target.replace(/^#/, '')).trim();
      return {
        type: 'open_modal',
        target: modalId ? `#${modalId}` : '',
        modalId,
        modalSelector: modalId ? `#${modalId}` : ''
      };
    }

    if (type === 'open_video_popup') {
      return {
        type: 'open_video_popup',
        target,
        youtubeEmbed: src.youtubeEmbed || target,
        videoSrc: src.videoSrc || '',
        poster: src.poster || '',
        aspectRatio: src.aspectRatio || src.videoAspectRatio || ''
      };
    }

    if (type === 'share') {
      return {
        type: 'share',
        title: src.title || '',
        text: src.text || '',
        url: src.url || target,
        target: src.url || target
      };
    }

    return {
      type: 'navigate',
      target,
      url: src.url || target
    };
  }

  function isAdInWindow(ad, nowMs) {
    const startRaw = ad && ad.startAt ? String(ad.startAt).trim() : '';
    const endRaw = ad && ad.endAt ? String(ad.endAt).trim() : '';
    if (startRaw) {
      const startMs = Date.parse(startRaw);
      if (!Number.isNaN(startMs) && nowMs < startMs) return false;
    }
    if (endRaw) {
      const endMs = Date.parse(endRaw);
      if (!Number.isNaN(endMs) && nowMs > endMs) return false;
    }
    return true;
  }

  function normalizeAd(ad) {
    if (!ad || typeof ad !== 'object') return null;
    const imageSrc = String(ad.imageSrc || '').trim();
    if (!imageSrc) return null;
    const status = String(ad.status || 'active').toLowerCase();
    return {
      ...ad,
      id: String(ad.id || '').trim(),
      type: String(ad.type || 'site_offer'),
      subtype: String(ad.subtype || ''),
      status,
      imageSrc,
      altText: String(ad.altText || ad.id || 'Promotion'),
      badgeText: String(ad.badgeText || ''),
      action: normalizeAdminAction(ad.action)
    };
  }

  function normalizeAdGlobalSettings(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const zones = source.zones && typeof source.zones === 'object' ? source.zones : {};
    const nowMs = Date.now();
    const ads = Array.isArray(source.ads)
      ? source.ads.map(normalizeAd).filter(Boolean)
      : [];

    return {
      enabled: source.enabled !== false,
      frequencyCards: Number(source.frequencyCards) || 6,
      maxAdsPerSession: Number(source.maxAdsPerSession) || 6,
      startAfterCards: Number(source.startAfterCards) || 0,
      allowTailAd: source.allowTailAd !== false,
      allowEmptyStateAd: source.allowEmptyStateAd !== false,
      rotationMode: source.rotationMode || 'random',
      category: source.category || 'all',
      zones: {
        listing_feed_inline: zones.listing_feed_inline !== false,
        profile_logout_slot: zones.profile_logout_slot !== false,
        gig_detail_post_customer: zones.gig_detail_post_customer !== false
      },
      ads,
      activeAds: ads.filter((ad) => ad.status === 'active' && isAdInWindow(ad, nowMs))
    };
  }

  function isZoneOn(settings, zoneId) {
    if (!settings || settings.enabled === false) return false;
    if (!zoneId || !settings.zones) return true;
    return settings.zones[zoneId] !== false;
  }

  async function getAdGlobalSettings() {
    if (typeof window.getAdSettings !== 'function') return null;
    try {
      const raw = await window.getAdSettings();
      if (!raw) return null;
      return normalizeAdGlobalSettings(raw);
    } catch (error) {
      console.warn('Ad config read failed; caller should keep local fallback.', error);
      return null;
    }
  }

  function getActiveAds(settings, zoneId) {
    if (!settings || !isZoneOn(settings, zoneId)) return [];
    return Array.isArray(settings.activeAds) ? settings.activeAds : [];
  }

  window.normalizeAdminAction = normalizeAdminAction;
  window.normalizeAdGlobalSettings = normalizeAdGlobalSettings;
  window.getAdGlobalSettings = getAdGlobalSettings;
  window.getActiveAdsFromSettings = getActiveAds;
  window.isAdZoneEnabled = isZoneOn;
})(window);
