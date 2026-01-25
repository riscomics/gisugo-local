# Deploy Firestore Rules

## Updated Rule: Allow Hired Workers to Reject Offers

### What Changed:
Added permission for hired workers to reject job offers by reverting the job status back to "active".

### New Helper Function:
```javascript
function isHiredWorkerRejectingOffer() {
  return resource.data.status == 'hired'
    && resource.data.hiredWorkerId == request.auth.uid
    && request.resource.data.status == 'active';
}
```

### Updated Rule:
```javascript
allow update: if isAuthenticated()
  && (resource.data.posterId == request.auth.uid
      || onlyUpdatingApplicationFields()
      || isHiredWorkerRejectingOffer());
```

---

## How to Deploy:

### Option 1: Firebase Console (Easiest)
1. Go to: https://console.firebase.google.com/project/gisugo1/firestore/rules
2. Copy the entire contents of `firestore.rules`
3. Paste into the Rules editor
4. Click **"Publish"**

### Option 2: Firebase CLI
```bash
firebase deploy --only firestore:rules
```

---

## What This Fixes:
- ✅ Workers can now reject job offers from the "Offers" tab
- ✅ Job status reverts from "hired" back to "active"
- ✅ Hired worker info is removed from the job
- ✅ Job returns to customer's active listings

**After deploying, test the "REJECT OFFER" button again!**
