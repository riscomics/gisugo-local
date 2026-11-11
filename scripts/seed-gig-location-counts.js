/**
 * One-time (re-runnable) seed for per-category active gig location tallies
 * (gig_location_counts/{category}).
 *
 * Scans jobs currently status == "active", builds nested byRegion[region][city]
 * maps (pruning zero/empty keys), and writes gig_location_counts/{category}
 * while deleting any stale gig_location_counts doc whose category now has 0
 * active gigs.
 *
 * Safety: DRY-RUN by default. Pass --apply to write.
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/seed-gig-location-counts.js
 *   node scripts/seed-gig-location-counts.js --apply
 */

const path = require("path");
const admin = require(path.join(__dirname, "../functions/node_modules/firebase-admin"));

const COLLECTION = "gig_location_counts";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const keyPathArg = args.find((a) => a !== "--apply");

function resolveKeyPath() {
  if (keyPathArg) return path.resolve(keyPathArg);
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return null;
  return path.join(__dirname, "github-action-gisugo1-key.json");
}

try {
  const keyPath = resolveKeyPath();
  const init = {};
  if (keyPath) {
    init.credential = admin.credential.cert(require(keyPath));
  }
  admin.initializeApp(init);
} catch (err) {
  console.error("Could not load service-account key:", err.message);
  process.exit(1);
}

const db = admin.firestore();

function normalizeCategoryKey(raw) {
  return String(raw || "").trim().toLowerCase();
}

async function main() {
  console.log(apply
    ? `APPLY — will overwrite ${COLLECTION}/{category}`
    : "DRY-RUN — no write");

  const [activeJobsSnap, existingDocsSnap, plannerJobsSnap] = await Promise.all([
    db.collection("jobs").where("status", "==", "active").get(),
    db.collection(COLLECTION).get(),
    db.collection("jobs").where("category", "==", "planner").limit(5).get()
  ]);

  console.log(`Active jobs scanned: ${activeJobsSnap.size}`);
  console.log(`Legacy category=="planner" jobs found: ${plannerJobsSnap.size}`);

  const byCategory = {};
  for (const doc of activeJobsSnap.docs) {
    const job = doc.data() || {};
    const category = normalizeCategoryKey(job.category);
    const region = String(job.region || "").trim();
    const city = String(job.city || "").trim();
    if (!category || !region || !city) {
      console.warn(`Skipping job ${doc.id} with missing location/category:`, {
        category: job.category,
        region: job.region,
        city: job.city
      });
      continue;
    }
    if (!byCategory[category]) byCategory[category] = {};
    if (!byCategory[category][region]) byCategory[category][region] = {};
    byCategory[category][region][city] = (byCategory[category][region][city] || 0) + 1;
  }

  const categories = Object.keys(byCategory).sort();
  console.log(`\nCategories with active gigs (${categories.length}):`);
  for (const cat of categories) {
    console.log(`  ${cat}:`, JSON.stringify(byCategory[cat]));
  }

  const staleDocIds = existingDocsSnap.docs
    .map((d) => d.id)
    .filter((id) => !byCategory[id]);
  if (staleDocIds.length) {
    console.log(`\nExisting ${COLLECTION} docs to delete (now 0 active):`, staleDocIds);
  }

  if (!apply) {
    console.log("\nDRY-RUN complete. Re-run with --apply to write.");
    return;
  }

  const batch = db.batch();
  for (const cat of categories) {
    const ref = db.collection(COLLECTION).doc(cat);
    batch.set(ref, {
      byRegion: byCategory[cat],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: false });
  }
  for (const staleId of staleDocIds) {
    batch.delete(db.collection(COLLECTION).doc(staleId));
  }
  await batch.commit();
  console.log(`\nWrote ${categories.length} ${COLLECTION} docs and deleted ${staleDocIds.length} stale docs.`);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
