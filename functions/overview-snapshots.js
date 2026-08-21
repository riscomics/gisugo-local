// Phase 7 Ch 3–4 — pull User Activity (GA4 Data API) and Traffic
// (Cloud Monitoring) into the dashboard snapshot shape.
// No new npm packages: uses google-auth-library (already via firebase-admin).

const { GoogleAuth } = require("google-auth-library");

const PROJECT_ID = "gisugo1";
const MANILA_OFFSET = "+08:00";

function emptyUserActivity() {
  return {
    mobilePercent: 0,
    desktopPercent: 0,
    androidCount: 0,
    androidPercent: 0,
    iphoneCount: 0,
    iphonePercent: 0,
    avgSessionSeconds: 0,
    peakHoursLabel: "N/A",
    repeatPercent: 0,
    bounceRate: 0,
    browsers: {
      chrome: 0,
      safari: 0,
      firefox: 0,
      edge: 0,
      messenger: 0,
      other: 0
    },
    peakBuckets: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    status: "empty"
  };
}

function emptyTraffic() {
  return {
    bandwidthBytes: 0,
    firestoreReads: 0,
    firestoreWrites: 0,
    costUsd: 0,
    costBreakdown: {
      database: 0,
      storage: 0,
      bandwidth: 0,
      auth: 0
    },
    status: "empty"
  };
}

function startOfMonthManilaIso() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  return `${year}-${month}-01T00:00:00${MANILA_OFFSET}`;
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function classifyBrowser(name) {
  const raw = String(name || "").toLowerCase();
  if (raw.includes("chrome") && !raw.includes("edge")) return "chrome";
  if (raw.includes("safari") && !raw.includes("chrome")) return "safari";
  if (raw.includes("firefox")) return "firefox";
  if (raw.includes("edge") || raw.includes("edg")) return "edge";
  if (
    raw.includes("messenger") ||
    raw.includes("facebook") ||
    raw.includes("instagram") ||
    raw.includes("fban") ||
    raw.includes("fbav")
  ) {
    return "messenger";
  }
  return "other";
}

function classifyOs(name) {
  const raw = String(name || "").toLowerCase();
  if (raw.includes("android")) return "android";
  if (raw.includes("ios") || raw.includes("iphone") || raw.includes("ipad")) return "iphone";
  return "other";
}

function peakBucket(hour) {
  const h = Number(hour);
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 24) return "evening";
  return "night";
}

function peakHoursLabel(buckets) {
  const order = ["morning", "afternoon", "evening", "night"];
  const labels = {
    morning: "6AM–12PM",
    afternoon: "12PM–6PM",
    evening: "6PM–12AM",
    night: "12AM–6AM"
  };
  let best = "morning";
  let bestVal = -1;
  order.forEach((key) => {
    const val = Number(buckets[key]) || 0;
    if (val > bestVal) {
      bestVal = val;
      best = key;
    }
  });
  if (bestVal <= 0) return "N/A";
  return labels[best];
}

async function getAuthedClient(scopes) {
  const auth = new GoogleAuth({ scopes });
  return auth.getClient();
}

function ga4Rows(report) {
  return Array.isArray(report && report.rows) ? report.rows : [];
}

function rowMetric(row, index) {
  return Number((row.metricValues && row.metricValues[index] && row.metricValues[index].value) || 0);
}

function rowDimension(row, index) {
  return String((row.dimensionValues && row.dimensionValues[index] && row.dimensionValues[index].value) || "");
}

async function runGa4Report(client, propertyId, body) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const res = await client.request({ url, method: "POST", data: body });
  return res.data || {};
}

async function fetchUserActivityFromGa4(propertyId) {
  const snapshot = emptyUserActivity();
  const id = String(propertyId || "").replace(/^properties\//, "").trim();
  if (!id) {
    snapshot.status = "needs_ga4";
    return snapshot;
  }

  const client = await getAuthedClient(["https://www.googleapis.com/auth/analytics.readonly"]);
  const dateRanges = [{ startDate: "28daysAgo", endDate: "today" }];

  const [deviceReport, browserReport, totalsReport, hourReport] = await Promise.all([
    runGa4Report(client, id, {
      dateRanges,
      dimensions: [{ name: "deviceCategory" }, { name: "operatingSystem" }],
      metrics: [{ name: "sessions" }]
    }),
    runGa4Report(client, id, {
      dateRanges,
      dimensions: [{ name: "browser" }],
      metrics: [{ name: "sessions" }]
    }),
    runGa4Report(client, id, {
      dateRanges,
      metrics: [
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
        { name: "activeUsers" },
        { name: "newUsers" }
      ]
    }),
    runGa4Report(client, id, {
      dateRanges,
      dimensions: [{ name: "hour" }],
      metrics: [{ name: "sessions" }]
    })
  ]);

  let mobile = 0;
  let desktop = 0;
  let android = 0;
  let iphone = 0;
  ga4Rows(deviceReport).forEach((row) => {
    const sessions = rowMetric(row, 0);
    const device = rowDimension(row, 0).toLowerCase();
    const os = classifyOs(rowDimension(row, 1));
    if (device === "desktop") desktop += sessions;
    else mobile += sessions;
    if (os === "android") android += sessions;
    if (os === "iphone") iphone += sessions;
  });
  const deviceTotal = mobile + desktop;
  snapshot.mobilePercent = percent(mobile, deviceTotal);
  snapshot.desktopPercent = percent(desktop, deviceTotal);
  snapshot.androidCount = android;
  snapshot.iphoneCount = iphone;
  const phoneTotal = android + iphone;
  snapshot.androidPercent = percent(android, phoneTotal);
  snapshot.iphonePercent = percent(iphone, phoneTotal);

  const browsers = { chrome: 0, safari: 0, firefox: 0, edge: 0, messenger: 0, other: 0 };
  let browserTotal = 0;
  ga4Rows(browserReport).forEach((row) => {
    const sessions = rowMetric(row, 0);
    browsers[classifyBrowser(rowDimension(row, 0))] += sessions;
    browserTotal += sessions;
  });
  Object.keys(browsers).forEach((key) => {
    snapshot.browsers[key] = percent(browsers[key], browserTotal);
  });

  const totalsRow = ga4Rows(totalsReport)[0];
  if (totalsRow) {
    snapshot.avgSessionSeconds = Math.round(rowMetric(totalsRow, 0));
    const rawBounce = rowMetric(totalsRow, 1);
    snapshot.bounceRate = Math.round(rawBounce <= 1 ? rawBounce * 100 : rawBounce);
    const active = rowMetric(totalsRow, 2);
    const neu = rowMetric(totalsRow, 3);
    snapshot.repeatPercent = active > 0 ? percent(Math.max(0, active - neu), active) : 0;
  }

  const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  ga4Rows(hourReport).forEach((row) => {
    buckets[peakBucket(rowDimension(row, 0))] += rowMetric(row, 0);
  });
  snapshot.peakBuckets = buckets;
  snapshot.peakHoursLabel = peakHoursLabel(buckets);
  snapshot.status = deviceTotal > 0 || snapshot.avgSessionSeconds > 0 ? "ok" : "empty";
  return snapshot;
}

async function sumMonitorMetric(client, metricType, startIso, endIso) {
  const params = new URLSearchParams({
    filter: `metric.type="${metricType}"`,
    "interval.startTime": startIso,
    "interval.endTime": endIso,
    "aggregation.alignmentPeriod": "86400s",
    "aggregation.perSeriesAligner": "ALIGN_SUM",
    "aggregation.crossSeriesReducer": "REDUCE_SUM"
  });
  const url = `https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/timeSeries?${params.toString()}`;
  try {
    const res = await client.request({ url, method: "GET" });
    const series = (res.data && res.data.timeSeries) || [];
    let total = 0;
    series.forEach((item) => {
      (item.points || []).forEach((point) => {
        const value = point.value || {};
        total += Number(value.int64Value || value.doubleValue || 0);
      });
    });
    return total;
  } catch (error) {
    const code = error.code || (error.response && error.response.status);
    if (code === 403 || code === 404) return null;
    throw error;
  }
}

// Published Blaze estimates (not an invoice). Hosting first 10 GB/month is free.
const FIRESTORE_READ_USD_PER_100K = 0.06;
const FIRESTORE_WRITE_USD_PER_100K = 0.18;
const HOSTING_EGRESS_USD_PER_GB = 0.15;
const HOSTING_FREE_BYTES = 10 * 1024 * 1024 * 1024;
const STORAGE_EGRESS_USD_PER_GB = 0.12;

function bytesToGb(bytes) {
  return Math.max(0, Number(bytes) || 0) / (1024 * 1024 * 1024);
}

async function fetchTrafficFromMonitoring() {
  const snapshot = emptyTraffic();
  const client = await getAuthedClient(["https://www.googleapis.com/auth/monitoring.read"]);
  const startIso = startOfMonthManilaIso();
  const endIso = new Date().toISOString();

  const [reads, writes, hostingBytes, storageBytes] = await Promise.all([
    sumMonitorMetric(client, "firestore.googleapis.com/document/read_ops_count", startIso, endIso),
    sumMonitorMetric(client, "firestore.googleapis.com/document/write_ops_count", startIso, endIso),
    sumMonitorMetric(client, "firebasehosting.googleapis.com/network/sent_bytes_count", startIso, endIso),
    sumMonitorMetric(client, "storage.googleapis.com/network/sent_bytes", startIso, endIso)
  ]);

  if (reads === null && writes === null && hostingBytes === null && storageBytes === null) {
    snapshot.status = "needs_monitoring";
    return snapshot;
  }

  snapshot.firestoreReads = Math.max(0, Math.round(reads || 0));
  snapshot.firestoreWrites = Math.max(0, Math.round(writes || 0));
  snapshot.bandwidthBytes = Math.max(0, Math.round((hostingBytes || 0) + (storageBytes || 0)));

  const dbUsd =
    (snapshot.firestoreReads / 100000) * FIRESTORE_READ_USD_PER_100K +
    (snapshot.firestoreWrites / 100000) * FIRESTORE_WRITE_USD_PER_100K;
  const hostingBillable = Math.max(0, (hostingBytes || 0) - HOSTING_FREE_BYTES);
  const bandwidthUsd =
    bytesToGb(hostingBillable) * HOSTING_EGRESS_USD_PER_GB +
    bytesToGb(storageBytes || 0) * STORAGE_EGRESS_USD_PER_GB;

  snapshot.costBreakdown.database = dbUsd;
  snapshot.costBreakdown.bandwidth = bandwidthUsd;
  snapshot.costBreakdown.storage = 0;
  snapshot.costBreakdown.auth = 0;
  snapshot.costUsd = dbUsd + bandwidthUsd;
  snapshot.status = "ok";
  return snapshot;
}

module.exports = {
  emptyUserActivity,
  emptyTraffic,
  fetchUserActivityFromGa4,
  fetchTrafficFromMonitoring
};
