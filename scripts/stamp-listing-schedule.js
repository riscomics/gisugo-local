/**
 * Stamp scheduledStart, scheduledEnd, and feedGroup on existing jobs.
 * Uses this machine's local clock, the same way the post and edit screens do.
 *
 * Does not delete gigs. Does not mark a gig completed.
 * A live gig whose end time is already past is set to expired.
 *
 * Usage:
 *   node scripts/stamp-listing-schedule.js --dry-run
 *   node scripts/stamp-listing-schedule.js --apply
 */
const path = require('path');
const admin = require(path.join(__dirname, '../functions/node_modules/firebase-admin'));

const apply = process.argv.includes('--apply');
const keyPath = path.join(__dirname, 'github-action-gisugo1-key.json');

function parseHour(timeStr) {
  const match = String(timeStr || '').match(/(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const isPM = match[2].toUpperCase() === 'PM';
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  return hour;
}

function scheduleFromJob(data) {
  const raw = data.scheduledDate && data.scheduledDate.toDate ? data.scheduledDate.toDate() : null;
  if (!raw || isNaN(raw.getTime())) return null;
  const day = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
  const startHour = parseHour(data.startTime);
  const endHour = parseHour(data.endTime);
  const start = new Date(day.getTime());
  if (startHour == null) start.setHours(0, 0, 0, 0);
  else start.setHours(startHour, 0, 0, 0);
  const end = new Date(day.getTime());
  if (endHour == null) end.setTime(day.getTime() + (24 * 60 * 60 * 1000));
  else end.setHours(endHour, 0, 0, 0);
  return { start, end };
}

async function main() {
  admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
  const db = admin.firestore();
  const FieldValue = admin.firestore.FieldValue;
  const snap = await db.collection('jobs').get();
  const now = Date.now();
  let batch = db.batch();
  let pending = 0;
  let written = 0;
  let noDate = 0;
  let markedExpired = 0;

  async function flush() {
    if (!pending) return;
    if (apply) await batch.commit();
    written += pending;
    pending = 0;
    batch = db.batch();
  }

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const schedule = scheduleFromJob(data);
    if (!schedule) {
      noDate += 1;
      continue;
    }
    const count = Math.max(0, Number(data.applicationCount) || 0);
    const update = {
      scheduledStart: admin.firestore.Timestamp.fromDate(schedule.start),
      scheduledEnd: admin.firestore.Timestamp.fromDate(schedule.end),
      feedGroup: count >= 20 ? 1 : 0
    };
    const status = String(data.status || '').toLowerCase();
    if (status === 'active' && schedule.end.getTime() < now) {
      update.status = 'expired';
      update.expiredAt = FieldValue.serverTimestamp();
      update.lastModified = FieldValue.serverTimestamp();
      markedExpired += 1;
    }
    batch.update(doc.ref, update);
    pending += 1;
    if (pending >= 400) await flush();
  }
  await flush();

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    total: snap.size,
    stamped: written,
    noDate,
    markedExpired
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
