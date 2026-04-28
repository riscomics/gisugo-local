(function (window) {
    'use strict';

    const state = {
        controller: null,
        escapeHandler: null
    };

    function getElement(id) {
        return document.getElementById(id);
    }

    function runCleanup() {
        if (state.controller) {
            state.controller.abort();
            state.controller = null;
        }
        if (state.escapeHandler) {
            document.removeEventListener('keydown', state.escapeHandler);
            state.escapeHandler = null;
        }
    }

    function updateActionStars(rating) {
        const numericRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
        const stars = document.querySelectorAll('.action-star');
        stars.forEach(function (star) {
            star.classList.remove('filled');
        });
        for (let i = 0; i < Math.floor(numericRating); i += 1) {
            if (stars[i]) {
                stars[i].classList.add('filled');
            }
        }
    }

    function hideApplicationActionOverlay() {
        const overlay = getElement('applicationActionOverlay');
        if (!overlay) return;
        runCleanup();
        overlay.classList.remove('show');
    }

    function showProfileOpenMessage(userName) {
        if (typeof window.showConfirmation === 'function') {
            window.showConfirmation('🔍', 'Opening Profile', `Opening profile for ${userName}...`);
        }
    }

    async function handleReject(data) {
        const applicationId = String(data.applicationId || '').trim();
        const userId = String(data.userId || '').trim();
        const userName = String(data.userName || '').trim();
        const jobId = String(data.jobId || '').trim();
        const jobTitle = String(data.jobTitle || '').trim();

        if (!applicationId || !userId || !userName) {
            console.error('Reject action missing required data', { applicationId, userId, userName });
            return;
        }

        hideApplicationActionOverlay();

        const card = document.querySelector(`#applicationsList [data-application-id="${applicationId}"]`);
        if (card) {
            card.style.opacity = '0.6';
            card.style.pointerEvents = 'none';
            card.style.position = 'relative';
            const spinner = document.createElement('div');
            spinner.className = 'application-loading-spinner';
            spinner.innerHTML = '<div class="spinner-icon">⏳</div>';
            spinner.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;animation:spin 1s linear infinite;';
            card.appendChild(spinner);
        }

        const resetCard = function () {
            if (!card) return;
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
            const spinner = card.querySelector('.application-loading-spinner');
            if (spinner) spinner.remove();
        };

        const useFirebase = typeof window.DataService !== 'undefined'
            && typeof window.DataService.useFirebase === 'function'
            && window.DataService.useFirebase();

        if (useFirebase && typeof window.rejectApplication === 'function') {
            try {
                const result = await window.rejectApplication(applicationId);
                if (!result || !result.success) {
                    resetCard();
                    alert((result && result.message) || 'Failed to reject application. Please try again.');
                    return;
                }
            } catch (error) {
                console.error('Error rejecting application', error);
                resetCard();
                alert('An error occurred while rejecting the application. Please try again.');
                return;
            }
        }

        if (typeof window.showConfirmation === 'function') {
            window.showConfirmation('❌', 'Application Rejected', `${userName}'s application has been rejected.`, 'rejection');
        }

        setTimeout(function () {
            if (!card) return;
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'translateX(100%)';
            setTimeout(function () {
                card.remove();
                const remainingCards = document.querySelectorAll('#applicationsList .application-card');
                if (remainingCards.length === 0) {
                    const applicationsList = getElement('applicationsList');
                    if (applicationsList) {
                        applicationsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-title">All Applications Processed</div><div class="empty-state-message">No pending applications for this job.</div></div>';
                    }
                }
            }, 300);
        }, 200);

        console.log('Reject complete', { applicationId, userId, userName, jobId, jobTitle });
    }

    function bindHandlers(data) {
        const overlay = getElement('applicationActionOverlay');
        const profileBtn = getElement('profileBtn');
        const contactBtn = getElement('contactBtn');
        const rejectBtn = getElement('rejectJobBtn');
        const closeBtn = getElement('applicationActionCloseBtn');
        if (!overlay) return;

        runCleanup();
        const controller = new AbortController();
        const signal = controller.signal;
        state.controller = controller;

        if (profileBtn) {
            profileBtn.addEventListener('click', function () {
                const userId = String(data.userId || '').trim();
                const userName = String(data.userName || '').trim();
                if (!userId || !userName) return;
                hideApplicationActionOverlay();
                showProfileOpenMessage(userName);
                setTimeout(function () {
                    window.location.href = `profile.html?userId=${encodeURIComponent(userId)}`;
                }, 1000);
            }, { signal: signal });
        }

        if (contactBtn) {
            contactBtn.addEventListener('click', async function () {
                const userId = String(data.userId || '').trim();
                const userName = String(data.userName || '').trim();
                const applicationId = String(data.applicationId || '').trim();
                const jobId = String(data.jobId || '').trim();
                if (!userId || !userName) return;

                try {
                    if (window.ChatThreadService && typeof window.ChatThreadService.findExistingChatThreadId === 'function') {
                        const existingThreadId = await window.ChatThreadService.findExistingChatThreadId({
                            recipientId: userId,
                            jobId: jobId,
                            applicationId: applicationId
                        });
                        if (existingThreadId) {
                            hideApplicationActionOverlay();
                            window.ChatThreadService.navigateToExistingChatThread(existingThreadId, { role: 'customer' });
                            return;
                        }
                    }
                } catch (error) {
                    console.warn('Thread pre-check failed before opening contact composer', error);
                }

                hideApplicationActionOverlay();
                if (typeof window.showContactMessageOverlay === 'function') {
                    window.showContactMessageOverlay(
                        userId,
                        userName,
                        data.jobId || null,
                        data.applicationId || null
                    );
                }
            }, { signal: signal });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', function () {
                void handleReject(data);
            }, { signal: signal });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                hideApplicationActionOverlay();
            }, { signal: signal });
        }

        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                hideApplicationActionOverlay();
            }
        }, { signal: signal });

        state.escapeHandler = function (event) {
            if (event.key === 'Escape' && overlay.classList.contains('show')) {
                hideApplicationActionOverlay();
            }
        };
        document.addEventListener('keydown', state.escapeHandler);
    }

    function showApplicationActionOverlay(data) {
        const overlay = getElement('applicationActionOverlay');
        const profileName = getElement('actionProfileName');
        const profileImage = getElement('actionProfileImage');
        const reviewCount = getElement('actionReviewCount');
        const profileBtn = getElement('profileBtn');
        const contactBtn = getElement('contactBtn');
        const rejectBtn = getElement('rejectJobBtn');

        if (!overlay || !profileName || !profileImage || !reviewCount) {
            console.error('Application action overlay elements not found');
            return;
        }

        const normalized = {
            applicationId: String(data.applicationId || '').trim(),
            userId: String(data.userId || '').trim(),
            userName: String(data.userName || '').trim(),
            userPhoto: String(data.userPhoto || '').trim(),
            userRating: Number(data.userRating || 0),
            reviewCount: Number(data.reviewCount || 0),
            jobId: String(data.jobId || '').trim(),
            jobTitle: String(data.jobTitle || '').trim()
        };

        profileName.textContent = normalized.userName || 'User';
        profileImage.src = normalized.userPhoto || '';
        profileImage.alt = normalized.userName || 'User';
        reviewCount.textContent = `(${normalized.reviewCount || 0})`;

        updateActionStars(normalized.userRating);

        overlay.setAttribute('data-application-id', normalized.applicationId);
        overlay.setAttribute('data-user-id', normalized.userId);
        overlay.setAttribute('data-user-name', normalized.userName);
        overlay.setAttribute('data-job-id', normalized.jobId);
        overlay.setAttribute('data-job-title', normalized.jobTitle);

        if (profileBtn) {
            profileBtn.setAttribute('data-user-id', normalized.userId);
            profileBtn.setAttribute('data-user-name', normalized.userName);
        }
        if (contactBtn) {
            contactBtn.setAttribute('data-user-id', normalized.userId);
            contactBtn.setAttribute('data-user-name', normalized.userName);
            contactBtn.setAttribute('data-application-id', normalized.applicationId);
        }
        if (rejectBtn) {
            rejectBtn.setAttribute('data-application-id', normalized.applicationId);
            rejectBtn.setAttribute('data-user-id', normalized.userId);
            rejectBtn.setAttribute('data-user-name', normalized.userName);
            rejectBtn.setAttribute('data-job-id', normalized.jobId);
            rejectBtn.setAttribute('data-job-title', normalized.jobTitle);
        }

        bindHandlers(normalized);
        overlay.classList.add('show');

        setTimeout(function () {
            updateActionStars(normalized.userRating);
        }, 50);
    }

    function ensureHireConfirmationOverlay() {
        let overlay = getElement('hireConfirmationOverlay');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'hireConfirmationOverlay';
        overlay.className = 'hire-confirmation-overlay';
        overlay.innerHTML = `
            <div class="hire-confirmation-container">
                <div class="hire-confirmation-header">
                    <div class="hire-confirmation-title-section">
                        <div class="hire-confirmation-icon">📨</div>
                        <div class="hire-confirmation-title">Confirm Offer Before Sending</div>
                    </div>
                    <div class="hire-worker-profile">
                        <div class="worker-avatar-large">
                            <img id="hireWorkerPhoto" src="" alt="Worker">
                        </div>
                        <div class="worker-details">
                            <div class="worker-name" id="hireWorkerName">Worker</div>
                            <div class="worker-rating">
                                <span class="worker-stars" id="hireWorkerStars">★★★★★</span>
                                <span class="worker-review-count" id="hireWorkerReviewCount">(0)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="hire-confirmation-disclaimer">
                    <div class="disclaimer-language-selector">
                        <div class="disclaimer-placeholder" id="confirmHirePlaceholder">
                            <div class="placeholder-text-container">
                                <div class="placeholder-text">Select a language to read the disclaimer</div>
                            </div>
                        </div>
                        <div class="disclaimer-lang-tabs" id="confirmHireLangTabs">
                            <button class="lang-tab" data-lang="english" type="button">English</button>
                            <button class="lang-tab" data-lang="bisaya" type="button">Bisaya</button>
                            <button class="lang-tab" data-lang="tagalog" type="button">Tagalog</button>
                        </div>
                        <div class="disclaimer-content lang-content" id="confirmHireEnglish" style="display:none;">
                            <p><strong>Important:</strong> You are creating a direct gig agreement with this worker.</p>
                            <ul><li>Confirm scope, time, and final payment in chat before sending.</li><li>Keep all updates documented in chat.</li><li>Proceed only if you understand this is a direct arrangement.</li></ul>
                        </div>
                        <div class="disclaimer-content lang-content" id="confirmHireBisaya" style="display:none;">
                            <p><strong>Importante:</strong> Naghimo ka ug direct nga kasabotan sa worker.</p>
                            <ul><li>Kumpirmaha ang sakop sa trabaho, oras, ug bayad sa chat.</li><li>Ibilin sa chat ang tanan update ug sabot.</li><li>Padayon lang kung nasabtan nimo ang direct nga kasabotan.</li></ul>
                        </div>
                        <div class="disclaimer-content lang-content" id="confirmHireTagalog" style="display:none;">
                            <p><strong>Mahalaga:</strong> Direktang kasunduan ito sa pagitan mo at ng worker.</p>
                            <ul><li>I-confirm sa chat ang scope, oras, at bayad bago mag-send.</li><li>Ilagay sa chat ang lahat ng updates at napagkasunduan.</li><li>Magpatuloy lamang kung malinaw sa iyo ang direktang kasunduan.</li></ul>
                        </div>
                    </div>
                </div>

                <div id="hireStatusFriendlyCard" class="verification-status-card">
                    <div id="hireStatusFriendlyIcon" class="status-friendly-icon">🆕</div>
                    <div id="hireStatusFriendlyTitle" class="status-friendly-title">New Member</div>
                    <div id="hireStatusFriendlyContent" class="status-friendly-content">No verification media found for this worker profile.</div>
                    <div id="hireFacePreviewBlock" class="fv-status-preview" style="display:none;">
                        <div class="fv-status-preview-media-frame">
                            <video id="hireFacePreviewVideo" class="fv-status-preview-video" playsinline preload="metadata" controlsList="nodownload nofullscreen noremoteplayback noplaybackrate" disablePictureInPicture disableRemotePlayback x-webkit-airplay="deny" style="display:none;"></video>
                            <img id="hireFacePreviewImage" class="fv-status-preview-image" src="" alt="Face verification thumbnail" style="display:none;">
                            <button type="button" id="hireFacePreviewPlayBtn" class="fv-status-preview-play-btn" style="display:none;" aria-label="Play face verification video">PLAY VIDEO</button>
                        </div>
                        <div id="hireFacePreviewCaption" class="fv-status-preview-caption">Face Verification Video</div>
                    </div>
                </div>

                <div class="hire-confirmation-footer">
                    <div class="confirmation-warning" id="confirmHireWarning">
                        <span class="final-warning-icon">📖</span>
                        <span class="final-warning-text">Please read the disclaimer above to continue</span>
                    </div>
                    <div class="hire-confirmation-buttons">
                        <button id="cancelHireBtn" class="cancel-hire-btn" type="button"><span>Cancel</span></button>
                        <button id="confirmHireBtn" class="confirm-hire-btn" type="button" disabled><span>I Agree - Offer Gig to Worker</span></button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    function resolveStatusFromProfile(profile) {
        const verification = profile && profile.verification ? profile.verification : null;
        const media = verification || {};
        const faceVerified = !!(verification && (verification.faceVerified || verification.status === 'face_verified'));
        if (faceVerified) {
            return {
                type: 'face',
                icon: '🪪',
                title: 'Face Verified',
                description: 'This worker completed face verification.',
                posterUrl: media.facePosterUrl || '',
                videoUrl: media.faceVideoUrl || ''
            };
        }
        return {
            type: 'new-member',
            icon: '🆕',
            title: 'New Member',
            description: 'No verification media found for this worker profile.',
            posterUrl: '',
            videoUrl: ''
        };
    }

    function applyHireStatusToOverlay(status, workerName) {
        const iconEl = getElement('hireStatusFriendlyIcon');
        const titleEl = getElement('hireStatusFriendlyTitle');
        const contentEl = getElement('hireStatusFriendlyContent');
        const previewBlock = getElement('hireFacePreviewBlock');
        const previewImage = getElement('hireFacePreviewImage');
        const previewVideo = getElement('hireFacePreviewVideo');
        const previewPlayBtn = getElement('hireFacePreviewPlayBtn');
        const previewCaption = getElement('hireFacePreviewCaption');

        if (iconEl) iconEl.textContent = status.icon;
        if (titleEl) titleEl.textContent = status.title;
        if (contentEl) contentEl.textContent = status.description;
        if (previewCaption) previewCaption.textContent = `${workerName || 'Worker'} Face Verification`;

        if (previewBlock) previewBlock.style.display = 'none';
        if (previewImage) {
            previewImage.style.display = 'none';
            previewImage.removeAttribute('src');
        }
        if (previewVideo) {
            previewVideo.pause();
            previewVideo.style.display = 'none';
            previewVideo.removeAttribute('src');
            previewVideo.load();
        }
        if (previewPlayBtn) {
            previewPlayBtn.style.display = 'none';
            previewPlayBtn.onclick = null;
        }

        if (status.type === 'face' && (status.posterUrl || status.videoUrl)) {
            if (previewBlock) previewBlock.style.display = 'block';
            if (previewImage && status.posterUrl) {
                previewImage.src = status.posterUrl;
                previewImage.style.display = 'block';
            }
            if (previewVideo && status.videoUrl) {
                previewVideo.src = status.videoUrl;
                previewVideo.style.display = 'none';
            }
            if (previewPlayBtn) {
                previewPlayBtn.style.display = status.videoUrl ? 'inline-flex' : 'none';
                previewPlayBtn.onclick = function () {
                    if (!previewVideo || !status.videoUrl) return;
                    if (previewVideo.style.display === 'none') {
                        previewVideo.style.display = 'block';
                        if (previewImage) previewImage.style.display = 'none';
                    }
                    if (previewVideo.paused) {
                        previewVideo.play().catch(function () {});
                    } else {
                        previewVideo.pause();
                    }
                };
            }
        }
    }

    function updateHireGateState() {
        const tabs = Array.from(document.querySelectorAll('#confirmHireLangTabs .lang-tab'));
        const warningEl = getElement('confirmHireWarning');
        const confirmBtn = getElement('confirmHireBtn');
        const hasActiveTab = tabs.some(function (tab) { return tab.classList.contains('active'); });
        if (confirmBtn) confirmBtn.disabled = !hasActiveTab;
        if (warningEl) {
            warningEl.style.display = hasActiveTab ? 'none' : 'flex';
        }
    }

    function hideHireConfirmationOverlay() {
        const overlay = getElement('hireConfirmationOverlay');
        if (!overlay) return;
        if (state.hireController) {
            state.hireController.abort();
            state.hireController = null;
        }
        if (state.hireEscapeHandler) {
            document.removeEventListener('keydown', state.hireEscapeHandler);
            state.hireEscapeHandler = null;
        }
        overlay.classList.remove('show');
    }

    async function showHireConfirmationOverlay(workerData) {
        const overlay = ensureHireConfirmationOverlay();
        const workerNameEl = getElement('hireWorkerName');
        const workerPhotoEl = getElement('hireWorkerPhoto');
        const workerReviewCountEl = getElement('hireWorkerReviewCount');
        const workerStarsEl = getElement('hireWorkerStars');
        const placeholderEl = getElement('confirmHirePlaceholder');
        const tabsContainer = getElement('confirmHireLangTabs');
        const confirmBtn = getElement('confirmHireBtn');
        const cancelBtn = getElement('cancelHireBtn');

        if (!overlay || !confirmBtn || !cancelBtn || !tabsContainer) return;

        if (state.hireController) {
            state.hireController.abort();
        }
        const hireController = new AbortController();
        const signal = hireController.signal;
        state.hireController = hireController;

        const workerName = String(workerData.userName || 'Worker').trim() || 'Worker';
        const userRating = Number(workerData.userRating || 0);
        const totalReviews = Number(workerData.totalReviews || 0);
        if (workerNameEl) workerNameEl.textContent = workerName;
        if (workerPhotoEl) {
            workerPhotoEl.src = workerData.userPhoto || 'public/users/default-user.jpg';
            workerPhotoEl.alt = workerName;
        }
        if (workerReviewCountEl) workerReviewCountEl.textContent = `(${totalReviews})`;
        if (workerStarsEl) {
            const filled = Math.max(0, Math.min(5, Math.round(userRating)));
            workerStarsEl.textContent = `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
        }

        const allContent = {
            english: getElement('confirmHireEnglish'),
            bisaya: getElement('confirmHireBisaya'),
            tagalog: getElement('confirmHireTagalog')
        };
        const langTabs = Array.from(tabsContainer.querySelectorAll('.lang-tab'));
        langTabs.forEach(function (tab) { tab.classList.remove('active'); });
        Object.keys(allContent).forEach(function (key) {
            if (allContent[key]) allContent[key].style.display = 'none';
        });
        if (placeholderEl) placeholderEl.style.display = 'block';
        updateHireGateState();

        const profile = (typeof window.getUserProfile === 'function' && workerData.userId)
            ? await window.getUserProfile(workerData.userId).catch(function () { return null; })
            : null;
        const status = resolveStatusFromProfile(profile || {});
        applyHireStatusToOverlay(status, workerName);

        langTabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                const lang = String(tab.getAttribute('data-lang') || '').toLowerCase();
                langTabs.forEach(function (entry) { entry.classList.toggle('active', entry === tab); });
                Object.keys(allContent).forEach(function (key) {
                    if (allContent[key]) allContent[key].style.display = key === lang ? 'block' : 'none';
                });
                if (placeholderEl) placeholderEl.style.display = 'none';
                updateHireGateState();
            }, { signal: signal });
        });

        cancelBtn.addEventListener('click', function () {
            hideHireConfirmationOverlay();
        }, { signal: signal });

        confirmBtn.addEventListener('click', async function () {
            const applicationId = String(workerData.applicationId || '').trim();
            const jobId = String(workerData.jobId || '').trim();
            if (!applicationId || !jobId || typeof window.hireWorker !== 'function') {
                if (typeof window.showTemporaryNotification === 'function') {
                    window.showTemporaryNotification('Unable to send offer right now.');
                }
                return;
            }

            confirmBtn.disabled = true;
            const originalLabel = confirmBtn.textContent;
            confirmBtn.textContent = 'Sending Offer...';
            if (typeof window.showLoadingOverlay === 'function') {
                window.showLoadingOverlay('Sending offer...');
            }
            try {
                const result = await window.hireWorker(jobId, applicationId);
                if (result && result.success) {
                    hideHireConfirmationOverlay();
                    if (typeof window.showTemporaryNotification === 'function') {
                        window.showTemporaryNotification(`Offer sent to ${workerName}.`);
                    }
                } else {
                    if (typeof window.showTemporaryNotification === 'function') {
                        window.showTemporaryNotification((result && result.message) || 'Failed to send offer.');
                    }
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = originalLabel;
                }
            } catch (error) {
                console.error('Failed sending hire offer from shared overlay', error);
                if (typeof window.showTemporaryNotification === 'function') {
                    window.showTemporaryNotification('Failed to send offer. Please try again.');
                }
                confirmBtn.disabled = false;
                confirmBtn.textContent = originalLabel;
            } finally {
                if (typeof window.hideLoadingOverlay === 'function') {
                    window.hideLoadingOverlay();
                }
            }
        }, { signal: signal });

        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                hideHireConfirmationOverlay();
            }
        }, { signal: signal });

        state.hireEscapeHandler = function (event) {
            if (event.key === 'Escape' && overlay.classList.contains('show')) {
                hideHireConfirmationOverlay();
            }
        };
        document.addEventListener('keydown', state.hireEscapeHandler);

        overlay.classList.add('show');
    }

    window.GigOverlays = {
        showApplicationActionOverlay: showApplicationActionOverlay,
        hideApplicationActionOverlay: hideApplicationActionOverlay,
        showHireConfirmationOverlay: showHireConfirmationOverlay,
        hideHireConfirmationOverlay: hideHireConfirmationOverlay
    };
}(window));
