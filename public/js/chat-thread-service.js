// chat-thread-service.js
// Shared utility for resolving and navigating to existing chat threads.
// Consumed by jobs.js (Gigs Manager) and messages.js (Messages page).
//
// Design rules:
//   - No listeners, no persistent state — all functions are stateless.
//   - One Firestore .get() per call — callers cache the result in overlay.dataset.
//   - Exposed as window.ChatThreadService namespace — no loose global pollution.

(function (window) {
    'use strict';

    /**
     * Build the messages.html URL for a specific thread with role/tab context.
     * @param {string} threadId
     * @param {{ role?: 'worker'|'customer' }} [options]
     * @returns {string}
     */
    function buildMessagesThreadUrl(threadId, options) {
        const safeThreadId = String(threadId || '').trim();
        if (!safeThreadId) return 'messages.html';

        const params = new URLSearchParams();
        params.set('threadId', safeThreadId);

        const safeRole = String((options && options.role) || '').trim().toLowerCase();
        if (safeRole === 'worker') {
            params.set('role', 'worker');
            params.set('tab', 'worker-chats');
        } else if (safeRole === 'customer') {
            params.set('role', 'customer');
            params.set('tab', 'customer-interviews');
        }

        return 'messages.html?' + params.toString();
    }

    /**
     * Navigate the browser directly to an existing chat thread.
     * @param {string} threadId
     * @param {{ role?: 'worker'|'customer' }} [options]
     */
    function navigateToExistingChatThread(threadId, options) {
        const destination = buildMessagesThreadUrl(threadId, options || {});
        console.log('[ChatThreadService] Navigating to thread:', { threadId, destination });
        window.location.href = destination;
    }

    /**
     * Look up an existing chat thread by applicationId or jobId + participant pair.
     *
     * Priority: applicationId match (most specific) > jobId match (broader).
     * Returns the threadId string on match, null otherwise.
     *
     * One Firestore read — no listener, no retained state.
     * Callers should store the result in overlay.dataset to avoid repeat reads.
     *
     * @param {{ recipientId: string, jobId?: string, applicationId?: string }} context
     * @returns {Promise<string|null>}
     */
    async function findExistingChatThreadId(context) {
        const recipientId    = String((context && context.recipientId)    || '').trim();
        const jobId          = String((context && context.jobId)          || '').trim();
        const applicationId  = String((context && context.applicationId)  || '').trim();

        if (!recipientId) return null;
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) return null;

        const currentUser = firebase.auth().currentUser;
        if (!currentUser || !currentUser.uid) return null;

        const db = firebase.firestore();
        let querySnapshot;

        try {
            if (applicationId) {
                // Most specific: thread created for this exact application.
                querySnapshot = await db.collection('chat_threads')
                    .where('applicationId', '==', applicationId)
                    .where('participantIds', 'array-contains', currentUser.uid)
                    .get();
            } else if (jobId) {
                // Broader: any thread for this job between these two users.
                querySnapshot = await db.collection('chat_threads')
                    .where('jobId', '==', jobId)
                    .where('participantIds', 'array-contains', currentUser.uid)
                    .get();
            } else {
                return null;
            }
        } catch (error) {
            console.warn('[ChatThreadService] Thread lookup failed:', error);
            return null;
        }

        const match = querySnapshot.docs.find(function (doc) {
            const ids = doc.data().participantIds;
            return Array.isArray(ids) && ids.includes(recipientId);
        });

        return match ? match.id : null;
    }

    // Single namespaced export — consumed via ChatThreadService.* on any page
    // that loads this file after Firebase has been initialized.
    window.ChatThreadService = {
        findExistingChatThreadId:   findExistingChatThreadId,
        buildMessagesThreadUrl:     buildMessagesThreadUrl,
        navigateToExistingChatThread: navigateToExistingChatThread
    };

}(window));
