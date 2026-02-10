# Firefox Mobile Memory Leak Fixes

**Date:** February 10, 2026  
**Commits:** 9f476e2, 3097032, 6c3f2b7

## Problem Report

**Symptom:** When Firefox mobile browser is left open overnight, listing pages and gig detail pages get stuck at loading animation. User must close and reopen the app to recover.

**Root Causes Identified:**

1. ⚠️ Loading overlay not hidden if errors occur
2. ⚠️ setTimeout calls not tracked in cleanup registry
3. ⚠️ Potential Firebase query timeouts on slow mobile networks

---

## Fixes Implemented

### 1. **Listing Pages** (`listing.js`) - Commit 9f476e2

#### Issue:
```javascript
// Show loading modal
if (loadingOverlay) {
  loadingOverlay.classList.add('show');
}

try {
  // Firebase loading...
} catch (error) {
  console.error('❌ Firebase error...');
  // ⚠️ No loading hide here!
}

// ... more code ...

// Hide loading modal ← Only if execution reaches here!
if (loadingOverlay) {
  loadingOverlay.classList.remove('show');
}
```

**Problem:** If ANY error occurs between showing and hiding, spinner stays forever!

#### Fix Applied:
```javascript
// Show loading modal
if (loadingOverlay) {
  loadingOverlay.classList.add('show');
}

try {
  // All loading logic...
  
} catch (unexpectedError) {
  console.error('❌ Unexpected error:', unexpectedError);
  // Show error state to user
  
} finally {
  // ⚠️ CRITICAL: ALWAYS hide loading modal
  if (loadingOverlay) {
    loadingOverlay.classList.remove('show');
    console.log('✅ Loading overlay hidden');
  }
}
```

**Result:** Loading spinner ALWAYS hides, even if:
- Firebase times out
- Network connection drops
- JavaScript errors occur
- Promise rejects
- Any unexpected error happens

---

### 2. **Dynamic Job Pages** (`dynamic-job.js`) - Commit 3097032

Applied the same try-finally protection to `loadJobData()` function.

#### Before:
Multiple manual `loadingOverlay.classList.remove('show')` calls scattered in error paths.

#### After:
Single `finally` block that guarantees cleanup.

---

### 3. **setTimeout Tracking** (`listing.js`) - Commit 6c3f2b7

#### Issue:
Many `setTimeout` calls were not registered in the cleanup registry, causing timers to accumulate over time.

#### Timers Now Tracked:
1. **Truncation timers** (3 instances)
   ```javascript
   const truncateTimer = setTimeout(truncateBarangayNames, 50);
   if (window._listingCleanup) {
     window._listingCleanup.registerTimer(truncateTimer);
   }
   ```

2. **Search focus timer**
   ```javascript
   const focusTimer = setTimeout(() => searchInput.focus(), 400);
   if (window._listingCleanup) {
     window._listingCleanup.registerTimer(focusTimer);
   }
   ```

3. **Image observer initialization timer**
   ```javascript
   const observeTimer = setTimeout(observeJobImages, 100);
   if (window._listingCleanup) {
     window._listingCleanup.registerTimer(observeTimer);
   }
   ```

**Result:** All tracked timers are cleared on page unload or after 5 minutes of inactivity.

---

## How Cleanup Works

### Automatic Cleanup Triggers:

1. **Page Unload** (when navigating away)
   ```javascript
   window.addEventListener('beforeunload', cleanup);
   ```

2. **Extended Inactivity** (tab hidden for 5+ minutes)
   ```javascript
   document.addEventListener('visibilitychange', () => {
     if (document.hidden) {
       hiddenTimer = setTimeout(() => {
         cleanup();
       }, 5 * 60 * 1000); // 5 minutes
     }
   });
   ```

3. **Manual Cleanup** (available globally)
   ```javascript
   window._listingCleanup.cleanup();
   ```

### What Gets Cleaned:

- ✅ Event listeners (removed)
- ✅ Observers (disconnected)
- ✅ Timers (cleared)
- ✅ Card registry (WeakMap auto-cleanup)

---

## Testing the Fixes

### Before:
1. Open listing page on Firefox mobile
2. Leave tab open overnight
3. Switch back to tab in morning
4. **Result:** Loading spinner stuck, page unusable ❌

### After:
1. Open listing page on Firefox mobile
2. Leave tab open overnight
3. Switch back to tab in morning
4. **Expected Result:** Page loads normally ✅

### Additional Test Cases:

1. **Network timeout test:**
   - Open page
   - Turn off WiFi/data mid-load
   - Loading should hide after timeout

2. **Firebase error test:**
   - Cause Firebase error (invalid query)
   - Loading should hide and show error state

3. **Memory leak test:**
   - Open/close listing pages 50 times
   - Check browser memory (shouldn't grow unbounded)

---

## Additional Recommendations

### Still Potential Issues (Not Fixed Yet):

1. **Firebase Connection Stale After Overnight**
   - Firebase may lose connection when idle
   - Consider adding connection state monitoring:
   ```javascript
   firebase.firestore().enableNetwork()
   firebase.firestore().disableNetwork()
   ```

2. **Service Worker Cache Issues**
   - If you have a service worker, cached responses might be stale
   - Consider cache invalidation strategy

3. **Mobile Browser Background Tab Throttling**
   - Firefox/Chrome aggressively throttle background tabs
   - Consider using `visibilitychange` to refresh data when tab becomes active:
   ```javascript
   document.addEventListener('visibilitychange', () => {
     if (!document.hidden) {
       // Refresh data when tab becomes visible
       filterAndSortJobs();
     }
   });
   ```

4. **Remaining Untracked Timers** (Lower Priority)
   - Lines 102, 288, 360, 386, 450, 472: UI resize timers
   - These are short-lived but could be tracked for completeness

---

## Firefox Mobile Specific Considerations

### Known Firefox Mobile Issues:

1. **More Aggressive Memory Management**
   - Firefox mobile more aggressively unloads idle tabs than Chrome
   - Timeout errors more common after long idle periods

2. **IndexedDB Limitations**
   - Firebase uses IndexedDB for offline persistence
   - Can become corrupted on Firefox mobile if battery saver active

3. **WebSocket Connection Drops**
   - Firebase real-time features use WebSockets
   - Firefox mobile drops connections more aggressively when backgrounded

### Mitigation Strategies (Implemented):

✅ **Try-Finally blocks** ensure UI never gets stuck  
✅ **Timeout tracking** prevents timer accumulation  
✅ **5-minute auto-cleanup** when tab hidden  
✅ **Error state UI** shows users what went wrong

---

## Performance Monitoring

### Console Logs to Watch:

When leaving page/returning:
```
🧹 Starting memory cleanup...
  ✓ Removed X event listeners
  ✓ Disconnected X observers
  ✓ Cleared X timers
✓ Memory cleanup complete
```

When loading overlay hides:
```
✅ Loading overlay hidden
```

If errors occur:
```
❌ Unexpected error in filterAndSortJobs: [error details]
```

### What to Monitor:

1. Browser console on Firefox mobile after overnight idle
2. Any "Loading..." spinners that don't hide
3. Memory usage in Firefox DevTools (if accessible via desktop debugging)

---

## Summary

### Files Modified:
- `public/js/listing.js` (2 commits, ~40 lines changed)
- `public/js/dynamic-job.js` (1 commit, ~14 lines changed)

### Issues Fixed:
- ✅ Stuck loading spinners
- ✅ Untracked setTimeout accumulation
- ✅ Error handling improvements
- ✅ User feedback on failures

### Testing Status:
- ⏳ Pending overnight Firefox mobile test
- ⏳ Pending network timeout simulation
- ⏳ Pending memory leak verification

---

## Next Steps

1. **Test on Firefox mobile** overnight to verify fixes
2. **Monitor console logs** for any new error patterns
3. **Check memory usage** after extended idle periods
4. **Consider adding** connection state refresh on tab visibility
5. **Track remaining timers** if issues persist

The core issue should be resolved now. The loading spinner will ALWAYS hide, and timers will be properly cleaned up. If you still experience issues after testing, we may need to add Firebase connection refresh logic.
