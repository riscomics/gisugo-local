// One-time script: create Firebase Hosting deploy SA and download key.
// Uses existing firebase-tools login (no secrets printed).
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'gisugo1';
const SA_ID = 'github-action-gisugo1';
const SA_EMAIL = `${SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com`;

const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    throw new Error(`${res.status} ${url}\n${typeof body === 'string' ? body : JSON.stringify(body, null, 2)}`);
  }
  return body;
}

async function waitForServiceAccount() {
  for (let i = 0; i < 10; i++) {
    try {
      await api(`https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/${encodeURIComponent(SA_EMAIL)}`);
      return;
    } catch (e) {
      if (!String(e.message).includes('404')) throw e;
      console.log('Waiting for service account propagation...');
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error('Service account not visible after retries');
}
async function ensureServiceAccount() {
  try {
    await api(`https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/${encodeURIComponent(SA_EMAIL)}`);
    console.log('Service account already exists:', SA_EMAIL);
  } catch (e) {
    if (!String(e.message).includes('404')) throw e;
    const created = await api(`https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts`, {
      method: 'POST',
      body: JSON.stringify({
        accountId: SA_ID,
        serviceAccount: { displayName: 'GitHub Actions Firebase Hosting (gisugo1)' },
      }),
    });
    console.log('Created service account:', created.email);
  }
  await waitForServiceAccount();
}

async function grantRoles() {
  const roles = [
    // Hosting (existing)
    'roles/firebasehosting.admin',
    'roles/firebaseauth.admin',
    'roles/run.viewer',
    'roles/serviceusage.apiKeysViewer',
    'roles/serviceusage.serviceUsageConsumer',
    // Cloud Functions (Gen1 + Gen2 / Cloud Run)
    'roles/cloudfunctions.developer',
    'roles/cloudfunctions.admin',
    'roles/iam.serviceAccountUser',
    'roles/cloudbuild.builds.editor',
    'roles/artifactregistry.writer',
    'roles/run.admin',
    'roles/eventarc.admin',
    'roles/cloudscheduler.admin',
    'roles/pubsub.editor',
    'roles/serviceusage.serviceUsageAdmin',
    // Firestore + Storage rules and indexes
    'roles/firebaserules.admin',
    'roles/datastore.indexAdmin',
    'roles/storage.admin',
    // Often required for full `firebase deploy` (extensions inventory, etc.)
    'roles/firebaseextensions.viewer',
    'roles/firebase.developAdmin',
  ];

  const policy = await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}:getIamPolicy`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  for (const role of roles) {
    const member = `serviceAccount:${SA_EMAIL}`;
    let binding = policy.bindings.find((b) => b.role === role);
    if (!binding) {
      binding = { role, members: [] };
      policy.bindings.push(binding);
    }
    if (!binding.members.includes(member)) {
      binding.members.push(member);
      console.log('Granting', role);
    }
  }

  await api(`https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}:setIamPolicy`, {
    method: 'POST',
    body: JSON.stringify({ policy }),
  });
  console.log('IAM roles updated');
}

async function createKey() {
  const outPath = path.join(__dirname, 'github-action-gisugo1-key.json');
  const key = await api(
    `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/${encodeURIComponent(SA_EMAIL)}/keys`,
    {
      method: 'POST',
      body: JSON.stringify({
        privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
        keyAlgorithm: 'KEY_ALG_RSA_2048',
      }),
    }
  );

  const decoded = Buffer.from(key.privateKeyData, 'base64').toString('utf8');
  fs.writeFileSync(outPath, decoded);
  console.log('Key written to:', outPath);
  return outPath;
}

(async () => {
  const grantOnly = process.argv.includes('--grant-only');
  await ensureServiceAccount();
  await grantRoles();
  if (grantOnly) {
    console.log('DONE: roles granted (no new key created).');
    return;
  }
  const keyPath = await createKey();
  console.log('DONE:', keyPath);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
