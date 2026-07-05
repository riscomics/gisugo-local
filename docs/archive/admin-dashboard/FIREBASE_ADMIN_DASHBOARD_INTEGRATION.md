# Firebase Integration Guide - Admin Dashboard

## 🔥 Overview
This document outlines how to replace the current mock data simulation with real Firebase data for the admin dashboard analytics.

---

## 📊 Current Mock Data vs. Firebase

### What's Currently Simulated:
- **Total Users**: Random increments of 1-25 every second
- **Verification Submissions**: Random +1 every 10 seconds  
- **Monthly Revenue**: Random ₱100/₱250/₱500 every second
- **Gigs Reported**: Random +1 every 30 seconds
- **localStorage**: Used to persist cumulative growth across page refreshes

### What Needs Real Firebase Data:
All of the above! Plus detailed breakdowns for overlays.

---

## 🗂️ Firebase Database Structure

```
/admin/
  /analytics/
    /users/
      total: number                    // Total registered users
      new: number                      // Unverified members
      proVerified: number              // Pro verified count
      businessVerified: number         // Business verified count
      /byAge/
        18_25: number
        26_40: number
        41_59: number
        60plus: number
      /byRegion/
        luzon: number
        visayas: number
        mindanao: number
        /provinces/
          manila: number
          cebu: number
          davao: number
          // ... other major provinces
      lastUpdated: timestamp
      
    /verifications/
      pending: number                  // Total pending requests
      /submissions/
        [submissionId]/
          userId: string
          type: "pro" | "business"
          submittedAt: timestamp
          documentsUrl: string
          status: "pending" | "approved" | "rejected"
      /age/                            // How long submissions have been pending
        lessThan1Day: number
        lessThan2Days: number
        moreThan1Week: number
      lastUpdated: timestamp
      
    /revenue/
      monthly: number                  // Current month total in PHP
      /transactions/
        [transactionId]/
          userId: string
          amount: number
          type: "gcoins" | "pro_fee" | "business_fee" | "platform_fee"
          timestamp: timestamp
      /sources/                        // Revenue breakdown
        gCoinsPurchases: number
        proSubscriptions: number
        businessSubscriptions: number
        platformFees: number
      exchangeRate: number             // PHP to USD rate (update daily)
      lastUpdated: timestamp
      
    /gigs/
      /reported/
        count: number
        /gigs/
          [gigId]/
            reportedBy: array          // Array of {userId, timestamp, reason}
            reportCount: number
            reportThreshold: number    // Threshold before reappearing
            ignoredBy: array           // Array of admin user IDs
            status: "reported"
      /suspended/
        count: number
        /gigs/
          [gigId]/
            suspendedBy: object        // {adminId, timestamp}
            reportedBy: array          // Preserved from reported state
            reportCount: number
            status: "suspended"
      lastUpdated: timestamp
      
    /lastUpdate: timestamp             // Overall analytics last update
```

---

## 🔧 Functions to Replace

### 1. **initializeMockData()** 
**Current**: Loads from localStorage, applies random growth  
**Firebase**: Set up real-time listener
```javascript
// REPLACE WITH:
import { ref, onValue } from 'firebase/database';

function initializeFirebaseAnalytics() {
    const analyticsRef = ref(db, '/admin/analytics');
    
    onValue(analyticsRef, (snapshot) => {
        const data = snapshot.val();
        updateDashboardWithRealData(data);
    });
}
```

### 2. **generateInitialMockData()** 
**Current**: Creates random starting values  
**Firebase**: DELETE - Not needed with real data

### 3. **applyGrowth()** 
**Current**: Simulates 1% revenue growth, user increases  
**Firebase**: DELETE - Real analytics calculated from actual transactions

### 4. **saveMockDataToStorage()** 
**Current**: Saves to localStorage  
**Firebase**: REPLACE with Firebase `set()` or `update()`
```javascript
// REPLACE WITH:
import { ref, set } from 'firebase/database';

async function updateAnalytics(path, value) {
    await set(ref(db, `/admin/analytics/${path}`), value);
}
```

### 5. **loadMockDataFromStorage()** 
**Current**: Loads from localStorage  
**Firebase**: REPLACE with Firebase `get()` or use real-time listeners
```javascript
// REPLACE WITH:
import { ref, get } from 'firebase/database';

async function loadAnalyticsData() {
    const snapshot = await get(ref(db, '/admin/analytics'));
    return snapshot.val();
}
```

### 6. **startMainDashboardCounting()** 
**Current**: Simulates counting with setInterval  
**Firebase**: DELETE - Real-time listeners will update automatically

---

## 📈 Real-Time Analytics Updates

### Revenue Tracking
Every time a transaction occurs (gCoin purchase, subscription, etc.):
```javascript
// In your transaction handler:
import { ref, runTransaction } from 'firebase/database';

async function recordTransaction(userId, amount, type) {
    const revenueRef = ref(db, '/admin/analytics/revenue/monthly');
    
    await runTransaction(revenueRef, (currentRevenue) => {
        return (currentRevenue || 0) + amount;
    });
    
    // Also save transaction record
    const transactionRef = ref(db, `/admin/analytics/revenue/transactions/${Date.now()}`);
    await set(transactionRef, {
        userId,
        amount,
        type,
        timestamp: Date.now()
    });
}
```

### User Registration
Every time a user signs up:
```javascript
// In your signup handler:
async function onUserRegistration(userId, ageGroup, region) {
    // Increment total users
    await runTransaction(ref(db, '/admin/analytics/users/total'), (current) => {
        return (current || 0) + 1;
    });
    
    // Increment age group
    await runTransaction(ref(db, `/admin/analytics/users/byAge/${ageGroup}`), (current) => {
        return (current || 0) + 1;
    });
    
    // Increment region
    await runTransaction(ref(db, `/admin/analytics/users/byRegion/${region}`), (current) => {
        return (current || 0) + 1;
    });
}
```

### Gig Reporting
When a user reports a gig:
```javascript
async function reportGig(gigId, reporterUserId, reason) {
    const gigRef = ref(db, `/admin/analytics/gigs/reported/gigs/${gigId}`);
    const snapshot = await get(gigRef);
    const gigData = snapshot.val() || { reportedBy: [], reportCount: 0, reportThreshold: 10 };
    
    gigData.reportedBy.push({
        userId: reporterUserId,
        timestamp: Date.now(),
        reason
    });
    gigData.reportCount++;
    
    await set(gigRef, gigData);
}
```

---

## 🎯 Key Integration Steps

1. **Remove ALL localStorage calls** from `admin-dashboard.js`
2. **Delete all mock data functions**:
   - `generateInitialMockData()`
   - `applyGrowth()`
   - `startMainDashboardCounting()`
   
3. **Set up Firebase listeners** in `initializeStatOverlays()`:
   ```javascript
   onValue(ref(db, '/admin/analytics/users'), (snapshot) => {
       updateUserAnalytics(snapshot.val());
   });
   
   onValue(ref(db, '/admin/analytics/revenue'), (snapshot) => {
       updateRevenueAnalytics(snapshot.val());
   });
   ```

4. **Update transaction handlers** throughout your app to call Firebase analytics functions

5. **Set up Cloud Functions** for complex analytics calculations (optional but recommended)

---

## ⚠️ Search for These Markers

All functions/sections that need Firebase replacement are marked with:
```javascript
// 🔥 FIREBASE TODO: [specific instruction]
```

Use Find in Files (Ctrl+Shift+F) and search for `🔥 FIREBASE` to find all integration points.

---

## 🧪 Testing Strategy

1. **Keep mock data initially** while setting up Firebase structure
2. **Run both systems in parallel** temporarily for comparison
3. **Switch to Firebase-only** once data matches expectations
4. **Remove all mock code** in final cleanup

---

## 💾 Data Migration

If you have existing user/gig data in Firebase:
- Run a one-time script to calculate initial analytics values
- Populate `/admin/analytics/` with current totals
- Set up triggers for ongoing updates

---

## 🔐 Security Rules

Add Firebase Security Rules for admin analytics:
```json
{
  "rules": {
    "admin": {
      "analytics": {
        ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
        ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
      }
    }
  }
}
```

---

## 📝 Summary

**Current State**: Mock simulation with localStorage  
**Target State**: Real-time Firebase analytics  
**Work Required**: ~4-6 hours to fully implement  
**Risk Level**: Low (can implement incrementally)

All mock code is clearly marked and isolated for easy removal! 🎯

