// ============================================================================
// PH_REGIONS_GEO -- classify a GPS coordinate into one of the 17 official
// Philippine regions, for the Admin Dashboard's Regional Distribution stat
// (see docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md, resolved 2026-07-27).
// ============================================================================
// Boundary data: public/data/ph-regions.geojson (24KB), derived from
// bendlikeabamboo/barangay-boundaries-repository (NAMRIA/PSA-sourced,
// PSGC-coded, snapshot 2023-10-24), simplified 5% + reduced to 0.001-degree
// (~111m) coordinate precision via mapshaper -- more than enough precision
// for region-level (not barangay-level) classification, and small enough to
// fetch once at signup with no meaningful cost or delay.
//
// One-time client-side geometry check, NOT a paid API call -- zero recurring
// cost regardless of signup volume, per the locked design decision.
//
// Algorithm: ray-casting point-in-polygon against each region's simplified
// boundary (handles Polygon + MultiPolygon, including holes). Coastal cities
// can occasionally fall just outside a simplified boundary (e.g. right at a
// strait) -- if no polygon contains the point, falls back to whichever
// region has the single nearest boundary vertex. Verified 2026-08-06 against
// 7 known city coordinates spanning Luzon/Visayas/Mindanao/CAR/BARMM; only
// the deliberately-simplified coastal case needed the fallback, and the
// fallback resolved it correctly.
(function () {
  let regionsDataPromise = null;

  function loadRegionsData() {
    if (!regionsDataPromise) {
      regionsDataPromise = fetch('public/data/ph-regions.geojson')
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch ph-regions.geojson: ${res.status}`);
          return res.json();
        })
        .catch((error) => {
          console.error('❌ Failed to load PH regions boundary data:', error);
          regionsDataPromise = null; // allow retry on next call
          throw error;
        });
    }
    return regionsDataPromise;
  }

  function pointInRing(x, y, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function pointInPolygonCoords(x, y, polygonCoords) {
    // polygonCoords = [outerRing, hole1, hole2, ...] (GeoJSON Polygon convention)
    if (!pointInRing(x, y, polygonCoords[0])) return false;
    for (let i = 1; i < polygonCoords.length; i++) {
      if (pointInRing(x, y, polygonCoords[i])) return false; // inside a hole
    }
    return true;
  }

  function findContainingRegion(lat, lng, features) {
    for (const feature of features) {
      const geom = feature.geometry;
      if (geom.type === 'Polygon') {
        if (pointInPolygonCoords(lng, lat, geom.coordinates)) return feature.properties.name;
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
          if (pointInPolygonCoords(lng, lat, poly)) return feature.properties.name;
        }
      }
    }
    return null;
  }

  function findNearestRegion(lat, lng, features) {
    let best = null;
    let bestDistSq = Infinity;
    for (const feature of features) {
      const geom = feature.geometry;
      const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
      for (const poly of polys) {
        for (const ring of poly) {
          for (const point of ring) {
            const dx = point[0] - lng;
            const dy = point[1] - lat;
            const distSq = dx * dx + dy * dy;
            if (distSq < bestDistSq) {
              bestDistSq = distSq;
              best = feature.properties.name;
            }
          }
        }
      }
    }
    return best;
  }

  /**
   * Classify a lat/lng coordinate into one of the 17 official PH regions.
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<string|null>} region name, or null if data failed to load
   */
  async function classifyCoordinateToRegion(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }
    try {
      const data = await loadRegionsData();
      const features = data.features || [];
      return findContainingRegion(lat, lng, features) || findNearestRegion(lat, lng, features);
    } catch (error) {
      return null;
    }
  }

  window.classifyCoordinateToRegion = classifyCoordinateToRegion;
  console.log('📦 PH regions geo classifier module loaded');
})();
