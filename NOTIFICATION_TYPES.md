# Notification Types - Complete Reference

## Worker Alerts Tab
Shows notifications **TO WORKERS** about their applications and gigs:

| Type | Icon | Title | Trigger | Message Example |
|------|------|-------|---------|-----------------|
| `offer_sent` | 💼 | Gig Offer Received | Customer hires worker from applications | "You've been offered the gig '{title}'! Check your Offered tab to accept or decline." |
| `interview_request` | 💬 | Interview Request | Customer requests interview | "Customer wants to interview you for '{title}'." |
| `job_completed` | ✅ | Gig Completed | Customer marks gig complete | "'{title}' has been marked as complete! Don't forget to leave feedback for {customerName} in your Completed tab." |
| `feedback_received` | ⭐ | Feedback Received | Customer leaves feedback | "Customer left {rating}-star feedback on '{title}'." |
| `contract_voided` | 🔄 | Contract Voided - Gig Relisted | Customer relists gig (fires worker) | "Your contract for '{title}' has been voided. Reason: {voidReason}" |

## Customer Alerts Tab
Shows notifications **TO CUSTOMERS** about their gigs:

| Type | Icon | Title | Trigger | Message Example |
|------|------|-------|---------|-----------------|
| `offer_accepted` | 🎉 | Offer Accepted | Worker accepts gig offer | "{workerName} has accepted your gig offer for '{title}'!" |
| `application_received` | 📝 | New Application | Worker applies to gig (1st application) | "Your gig '{title}' has received an application." |
| `application_milestone` | 📊 | Applications Update | 5+ applications received | "Your gig '{title}' has 5+ pending applications. Review them soon!" |
| `gig_auto_paused` | 🛑 | Gig Auto-Paused | 10 applications received | "🛑 Your gig '{title}' has been paused. You've received 10 applications. Please review and hire a worker or reject all applicants to reactivate your gig." |
| `offer_rejected` | ❌ | Offer Declined | Worker rejects gig offer | "{workerName} declined your gig offer for '{title}'." |
| `worker_resigned` | 🚪 | Worker Resigned | Worker resigns from hired gig | "{workerName} has resigned from '{title}'." |

## Implementation Notes

### Filtering Logic (messages.js)

**Worker Alerts Filter** (line ~397):
```javascript
const workerTypes = ['offer_sent', 'interview_request', 'job_completed', 'feedback_received', 'contract_voided'];
const workerNotifications = notifications.filter(notif => {
    const type = notif.type || notif.notificationType || '';
    return workerTypes.includes(type);
});
```

**Customer Alerts Filter** (line ~483):
```javascript
const customerTypes = ['offer_accepted', 'application_received', 'application_milestone', 'gig_auto_paused', 'offer_rejected', 'worker_resigned'];
const customerNotifications = notifications.filter(notif => {
    const type = notif.type || notif.notificationType || '';
    return customerTypes.includes(type);
});
```

### Creating Notifications

Use `createNotification(recipientId, notificationData)` in `firebase-db.js`:

```javascript
await createNotification(workerId, {
    type: 'offer_sent',
    jobId: jobId,
    jobTitle: jobData.title,
    message: `You've been offered the gig "${jobData.title}"!`,
    actionRequired: true
});
```

### Firestore Document Structure

```javascript
{
    recipientId: string,      // User ID
    type: string,             // One of the types above
    jobId: string,            // Related job ID
    jobTitle: string,         // Job title for display
    message: string,          // Display message
    actionRequired: boolean,  // Whether user needs to take action
    read: boolean,            // Has user read this?
    createdAt: Timestamp      // When notification was created
}
```
