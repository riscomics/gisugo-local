(function (window) {
    'use strict';

    const state = {
        controller: null,
        escapeHandler: null,
        hireProfileCache: new Map()
    };

    const HIRE_PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
    const HIRE_PROFILE_CACHE_MAX = 80;

    function getElement(id) {
        return document.getElementById(id);
    }

    function getCachedHireProfile(userId) {
        const safeUserId = String(userId || '').trim();
        if (!safeUserId) return null;
        const entry = state.hireProfileCache.get(safeUserId);
        if (!entry) return null;
        if ((Date.now() - entry.cachedAt) > HIRE_PROFILE_CACHE_TTL_MS) {
            state.hireProfileCache.delete(safeUserId);
            return null;
        }
        return entry.profile;
    }

    function setCachedHireProfile(userId, profile) {
        const safeUserId = String(userId || '').trim();
        if (!safeUserId) return;
        state.hireProfileCache.set(safeUserId, {
            profile: profile || null,
            cachedAt: Date.now()
        });
        if (state.hireProfileCache.size <= HIRE_PROFILE_CACHE_MAX) return;
        const oldestKey = state.hireProfileCache.keys().next().value;
        if (oldestKey) {
            state.hireProfileCache.delete(oldestKey);
        }
    }

    async function getCachedProfileForGigStatus(userId) {
        const safeUserId = String(userId || '').trim();
        if (!safeUserId || typeof window.getUserProfile !== 'function') return null;
        const cached = getCachedHireProfile(safeUserId);
        if (cached) return cached;
        try {
            const profile = await window.getUserProfile(safeUserId);
            setCachedHireProfile(safeUserId, profile || null);
            return profile || null;
        } catch (error) {
            console.warn('Gig status verification lookup failed:', error);
            return null;
        }
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
            contactBtn.addEventListener('click', function () {
                const userName = String(data.userName || '').trim();
                const applicationId = String(data.applicationId || '').trim();
                if (!applicationId) return;

                // Direct model: reveal the worker's phone (call/text) via the
                // ownership-checked callable. Premium in-app chat waits in
                // messages.html for later; no chat thread is created here.
                hideApplicationActionOverlay();
                if (typeof window.startDirectContactReveal === 'function') {
                    window.startDirectContactReveal({ applicationId: applicationId, userName: userName });
                } else {
                    console.error('startDirectContactReveal is unavailable.');
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
                        <div class="hire-confirmation-icon">⚖️</div>
                        <div class="hire-confirmation-title">Confirm Hiring Decision</div>
                    </div>
                    <button id="hireConfirmationCloseBtn" class="hire-confirmation-close-btn" type="button">&times;</button>
                </div>
                
                <div class="hire-confirmation-content">
                    <div class="legal-disclaimer-section">
                        <div class="disclaimer-header">
                            <span class="disclaimer-icon">⚖️</span>
                            <span class="disclaimer-title">Legal Disclaimer & Terms</span>
                        </div>
                        
                        <div class="disclaimer-placeholder" id="confirmHirePlaceholder">
                            <div class="placeholder-text-container">
                                <div class="placeholder-text">Select a language to read the disclaimer</div>
                                <div class="placeholder-text">Pili og language para mabasa</div>
                                <div class="placeholder-text">Pumili ng wika para mabasa</div>
                            </div>
                        </div>
                        
                        <div class="disclaimer-lang-tabs" id="confirmHireLangTabs">
                            <button class="lang-tab" data-lang="english" data-modal="confirmHire" type="button">English</button>
                            <button class="lang-tab" data-lang="bisaya" data-modal="confirmHire" type="button">Bisaya</button>
                            <button class="lang-tab" data-lang="tagalog" data-modal="confirmHire" type="button">Tagalog</button>
                        </div>

                        <div class="disclaimer-content lang-content" id="confirmHireEnglish" style="display:none;">
                            <p><strong>IMPORTANT:</strong> By proceeding with this hiring decision, you acknowledge and agree to the following:</p>
                            <div class="disclaimer-points">
                                <div class="disclaimer-point"><span class="point-number">1.</span><span class="point-text"><strong>Independent Transaction:</strong> This is a direct transaction between you (Customer) and the Worker. GISUGO acts solely as a platform facilitator.</span></div>
                                <div class="disclaimer-point"><span class="point-number">2.</span><span class="point-text"><strong>Liability Limitation:</strong> GISUGO is not liable for work quality, damages, injuries, or disputes arising from this transaction.</span></div>
                                <div class="disclaimer-point"><span class="point-number">3.</span><span class="point-text"><strong>Background Verification:</strong> Workers undergo basic verification, but you are responsible for additional due diligence.</span></div>
                                <div class="disclaimer-point"><span class="point-number">4.</span><span class="point-text"><strong>Payment Responsibility:</strong> You agree to pay the worker according to agreed terms. GISUGO cannot collect payment on behalf of the worker, and GISUGO does not offer assistance in payment recovery if there are disputes in quality of work.</span></div>
                                <div class="disclaimer-point"><span class="point-number">5.</span><span class="point-text"><strong>No Employer/Employee Formation:</strong> I understand that the worker is an independent individual and not my employee, and this arrangement does not create an employer-employee relationship.</span></div>
                                <div class="disclaimer-point"><span class="point-number">6.</span><span class="point-text"><strong>No Insurance or Benefits Obligation:</strong> I understand that I am not providing, and am not required to provide, any health insurance, liability coverage, or other employee benefits to the worker.</span></div>
                                <div class="disclaimer-point"><span class="point-number">7.</span><span class="point-text"><strong>Risk & Responsibility:</strong> I understand that this is a direct arrangement between me and the worker, and that any issues related to the gig are handled between us.</span></div>
                                <div class="disclaimer-point"><span class="point-number">8.</span><span class="point-text"><strong>Platform Limitation:</strong> I understand that GISUGO does not manage or assume responsibility for this arrangement and does not provide guarantees, insurance, or liability coverage.</span></div>
                                <div class="disclaimer-point"><span class="point-number">9.</span><span class="point-text"><strong>Tax Compliance:</strong> You are responsible for keeping records of payments made to workers and complying with Philippine tax laws, including BIR reporting requirements if applicable to your situation. GISUGO does not process payments, withhold taxes, or issue BIR forms.</span></div>
                            </div>
                            <div class="safety-recommendations">
                                <div class="safety-header"><span class="safety-icon">🛡️</span><span class="safety-title">Safety Recommendations</span></div>
                                <ul class="safety-list">
                                    <li>Review the worker's profile and ratings thoroughly</li>
                                    <li>Meet in safe, public locations when possible</li>
                                    <li>Verify worker's identity before work begins</li>
                                    <li>Keep valuable items secure during service</li>
                                    <li>Trust your instincts - cancel if something feels wrong</li>
                                </ul>
                            </div>
                        </div>
                        <div class="disclaimer-content lang-content" id="confirmHireBisaya" style="display:none;">
                            <p><strong>IMPORTANTE:</strong> Kung mopadayon ka sa pag-hire, ikaw nagkauyon sa mosunod:</p>
                            <div class="disclaimer-points">
                                <div class="disclaimer-point"><span class="point-number">1.</span><span class="point-text"><strong>Direkta nga Transaksyon:</strong> Kini direkta nga transaksyon nimo (Customer) ug sa Worker. Ang GISUGO facilitator lang — dili apil sa inyong deal.</span></div>
                                <div class="disclaimer-point"><span class="point-number">2.</span><span class="point-text"><strong>Limitasyon sa Responsibilidad:</strong> Ang GISUGO dili responsable sa kalidad sa trabaho, damages, aksidente, o mga away gikan sa transaksyon.</span></div>
                                <div class="disclaimer-point"><span class="point-number">3.</span><span class="point-text"><strong>Background Verification:</strong> Ang mga worker adunay basic verification, pero ikaw ang responsable sa dugang nga pag-check.</span></div>
                                <div class="disclaimer-point"><span class="point-number">4.</span><span class="point-text"><strong>Bayad:</strong> Nagkauyon ka nga bayaran ang worker sumala sa inyong napagkasunduan. Ang GISUGO dili makakolekta ug bayad alang sa worker, ug ang GISUGO dili matabang sa pagkuha sa bayad kung adunay away sa kalidad sa trabaho.</span></div>
                                <div class="disclaimer-point"><span class="point-number">5.</span><span class="point-text"><strong>No Employer/Employee Formation:</strong> I understand that the worker is an independent individual and not my employee, and this arrangement does not create an employer-employee relationship.</span></div>
                                <div class="disclaimer-point"><span class="point-number">6.</span><span class="point-text"><strong>No Insurance or Benefits Obligation:</strong> I understand that I am not providing, and am not required to provide, any health insurance, liability coverage, or other employee benefits to the worker.</span></div>
                                <div class="disclaimer-point"><span class="point-number">7.</span><span class="point-text"><strong>Risk & Responsibility:</strong> I understand that this is a direct arrangement between me and the worker, and that any issues related to the gig are handled between us.</span></div>
                                <div class="disclaimer-point"><span class="point-number">8.</span><span class="point-text"><strong>Platform Limitation:</strong> I understand that GISUGO does not manage or assume responsibility for this arrangement and does not provide guarantees, insurance, or liability coverage.</span></div>
                                <div class="disclaimer-point"><span class="point-number">9.</span><span class="point-text"><strong>Tax Compliance:</strong> Ikaw ang responsable sa pag-record sa bayad nga imong gihatag sa mga workers ug pagsunod sa tax laws sa Pilipinas, lakip ang BIR reporting kung kinahanglan sa imong sitwasyon. Ang GISUGO dili mag-process ug bayad, dili mag-withhold ug tax, o mag-issue ug BIR forms.</span></div>
                            </div>
                            <div class="safety-recommendations">
                                <div class="safety-header"><span class="safety-icon">🛡️</span><span class="safety-title">Safety Tips</span></div>
                                <ul class="safety-list">
                                    <li>Tan-awa pag-ayo ang profile ug rating sa worker</li>
                                    <li>Pagkita sa safe ug public nga lugar kung mahimo</li>
                                    <li>Sigurohon ang identity sa worker before magsugod</li>
                                    <li>Bantayi ang imong mga bililhon samtang nagtrabaho siya</li>
                                    <li>Salig sa imong instinct — i-cancel kung dili ka komportable</li>
                                </ul>
                            </div>
                        </div>
                        <div class="disclaimer-content lang-content" id="confirmHireTagalog" style="display:none;">
                            <p><strong>MAHALAGA:</strong> Sa pagpapatuloy ng hiring decision na ito, kinikilala at sinasang-ayunan mo ang mga sumusunod:</p>
                            <div class="disclaimer-points">
                                <div class="disclaimer-point"><span class="point-number">1.</span><span class="point-text"><strong>Direktang Transaksyon:</strong> Ito ay direktang transaksyon sa pagitan mo (Customer) at ng Worker. Ang GISUGO ay facilitator lamang — hindi kasali sa inyong deal.</span></div>
                                <div class="disclaimer-point"><span class="point-number">2.</span><span class="point-text"><strong>Limitasyon ng Pananagutan:</strong> Ang GISUGO ay hindi responsable sa kalidad ng trabaho, damages, aksidente, o mga away mula sa transaksyon.</span></div>
                                <div class="disclaimer-point"><span class="point-number">3.</span><span class="point-text"><strong>Background Verification:</strong> Ang mga worker ay may basic verification, pero ikaw ang responsable sa karagdagang pag-check.</span></div>
                                <div class="disclaimer-point"><span class="point-number">4.</span><span class="point-text"><strong>Bayad:</strong> Sumasang-ayon ka na bayaran ang worker ayon sa napagkasunduan. Ang GISUGO ay hindi makakakolekta ng bayad para sa worker, at ang GISUGO ay hindi nag-aalok ng tulong sa pagkuha ng bayad kung may alitan sa kalidad ng trabaho.</span></div>
                                <div class="disclaimer-point"><span class="point-number">5.</span><span class="point-text"><strong>No Employer/Employee Formation:</strong> I understand that the worker is an independent individual and not my employee, and this arrangement does not create an employer-employee relationship.</span></div>
                                <div class="disclaimer-point"><span class="point-number">6.</span><span class="point-text"><strong>No Insurance or Benefits Obligation:</strong> I understand that I am not providing, and am not required to provide, any health insurance, liability coverage, or other employee benefits to the worker.</span></div>
                                <div class="disclaimer-point"><span class="point-number">7.</span><span class="point-text"><strong>Risk & Responsibility:</strong> I understand that this is a direct arrangement between me and the worker, and that any issues related to the gig are handled between us.</span></div>
                                <div class="disclaimer-point"><span class="point-number">8.</span><span class="point-text"><strong>Platform Limitation:</strong> I understand that GISUGO does not manage or assume responsibility for this arrangement and does not provide guarantees, insurance, or liability coverage.</span></div>
                                <div class="disclaimer-point"><span class="point-number">9.</span><span class="point-text"><strong>Tax Compliance:</strong> Ikaw ang may pananagutan na mag-record ng mga bayad na ginawa mo sa mga workers at sumunod sa tax laws ng Pilipinas, kasama ang BIR reporting kung kailangan sa iyong sitwasyon. Ang GISUGO ay hindi nag-process ng bayad, hindi nag-withhold ng tax, o nag-issue ng BIR forms.</span></div>
                            </div>
                            <div class="safety-recommendations">
                                <div class="safety-header"><span class="safety-icon">🛡️</span><span class="safety-title">Mga Payo sa Kaligtasan</span></div>
                                <ul class="safety-list">
                                    <li>Suriin mabuti ang profile at rating ng worker</li>
                                    <li>Magkita sa ligtas at pampublikong lugar kung maaari</li>
                                    <li>Siguraduhin ang identity ng worker bago magsimula</li>
                                    <li>Bantayan ang iyong mga mahahalagang gamit habang nagtatrabaho siya</li>
                                    <li>Magtiwala sa iyong instinct — i-cancel kung may kakaiba</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="worker-status-section">
                        <div class="worker-status-header">
                            <div class="worker-status-title">Worker Account Status</div>
                        </div>
                        <div id="workerStatusInfo" class="worker-status-info">
                            <div class="status-info-header">
                                <span id="statusFriendlyIcon" class="friendly-icon">🌱</span>
                                <span id="statusInfoTitle" class="info-title">Unverified Member</span>
                            </div>
                            <div id="statusInfoContent" class="status-info-content">This user has not completed Face Verification yet. You may continue, but Face Verification adds an extra trust signal for gig interactions.</div>
                            <div id="hireFacePreviewBlock" class="fv-status-preview" style="display: none;">
                                <div class="fv-status-preview-media-frame">
                                    <video id="hireFacePreviewVideo" class="fv-status-preview-video" playsinline preload="metadata" controlsList="nodownload nofullscreen noremoteplayback noplaybackrate" disablePictureInPicture disableRemotePlayback x-webkit-airplay="deny" style="display: none;"></video>
                                    <img id="hireFacePreviewImage" class="fv-status-preview-image" src="" alt="Face verification thumbnail" style="display: none;">
                                    <button type="button" id="hireFacePreviewPlayBtn" class="fv-status-preview-play-btn" style="display: none;" aria-label="Play face verification video">PLAY VIDEO</button>
                                </div>
                                <div id="hireFacePreviewCaption" class="fv-status-preview-caption">Face Verification Video</div>
                            </div>
                        </div>
                        <div class="verification-reminder-actions" id="hireUnverifiedReminder" style="display: none;">
                            <div class="verification-reminder-text" id="hireReminderText">
                                This worker is currently unverified. You can request Face Verification or continue sending the offer.
                            </div>
                            <div class="verification-reminder-meta" id="hireReminderMeta" style="display: none;"></div>
                            <div class="verification-reminder-buttons">
                                <button type="button" class="verification-reminder-btn request" id="hireRequestVerificationBtn">Request Verification</button>
                                <button type="button" class="verification-reminder-btn proceed" id="hireProceedAnywayBtn">Send Offer Anyway</button>
                            </div>
                        </div>
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
        const iconEl = getElement('statusFriendlyIcon');
        const titleEl = getElement('statusInfoTitle');
        const contentEl = getElement('statusInfoContent');
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
            if (previewBlock) previewBlock.style.display = 'flex';
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

    function formatGigStatusDate(dateValue) {
        if (!dateValue) return 'TBD';
        try {
            let dateObj = null;
            if (dateValue && typeof dateValue.toDate === 'function') {
                dateObj = dateValue.toDate();
            } else if (dateValue instanceof Date) {
                dateObj = dateValue;
            } else if (typeof dateValue === 'string') {
                dateObj = new Date(dateValue);
            }
            if (!dateObj || Number.isNaN(dateObj.getTime())) return 'TBD';
            return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
        } catch (error) {
            return 'TBD';
        }
    }

    function safeText(value, fallbackValue) {
        const trimmed = String(value || '').trim();
        return trimmed || fallbackValue;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderDecisionBodyHtml(contentText) {
        const lines = String(contentText || '')
            .split('\n')
            .map(function (line) { return line.trim(); })
            .filter(function (line) { return line.length > 0; });
        if (!lines.length) return '';

        let html = '<div class="gig-decision-line-bubbles">';
        lines.forEach(function (line) {
            const isBullet = line.startsWith('•');
            const isWarningLine = /^(WARNING:|BANTAY:|BABALA:)/i.test(line);
            const text = isBullet ? line.replace(/^•\s*/, '') : line;
            html += `
                <div class="gig-decision-line-bubble${isBullet ? ' bullet' : ''}${isWarningLine ? ' warning' : ''}">
                    ${isBullet ? '<span class="gig-decision-line-prefix">•</span>' : ''}
                    <span class="gig-decision-line-text">${escapeHtml(text)}</span>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function renderCompleteBodyHtml(contentText) {
        const lines = String(contentText || '')
            .split('\n')
            .map(function (line) { return line.trim(); })
            .filter(function (line) { return line.length > 0; });
        if (!lines.length) return '';

        let html = '<div class="gig-complete-line-bubbles">';
        lines.forEach(function (line) {
            const isBullet = line.startsWith('•');
            const isVerifyLine = /^(VERIFY:|SIGURUHA:|TIYAKIN:)/i.test(line);
            const text = isBullet ? line.replace(/^•\s*/, '') : line;
            html += `
                <div class="gig-complete-line-bubble${isBullet ? ' bullet' : ''}${isVerifyLine ? ' verify' : ''}">
                    ${isBullet ? '<span class="gig-complete-line-prefix">•</span>' : ''}
                    <span class="gig-complete-line-text">${escapeHtml(text)}</span>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    function ensureGigStatusOverlay() {
        let overlay = getElement('gigStatusOverlay');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'gigStatusOverlay';
        overlay.className = 'gig-status-overlay';
        overlay.innerHTML = `
            <div class="gig-status-sheet">
                <div class="gig-status-sheet-head">
                    <h3>Gig Status</h3>
                    <button id="gigStatusCloseBtn" class="gig-status-icon-btn" type="button">&times;</button>
                </div>
                <div id="gigStatusCardBody" class="gig-status-card-surface" aria-label="Gig status card">
                    <div id="gigStatusVisualCard" class="hiring-card customer gig-status-hiring-card">
                        <div class="hiring-title" id="gigStatusJobTitle">Gig</div>
                        <div class="hiring-date-time-row">
                            <div class="hiring-date-part">
                                <span class="hiring-date-label">DUE:</span>
                                <span class="hiring-date-value" id="gigStatusDue">TBD</span>
                            </div>
                            <div class="hiring-time-part">
                                <span class="hiring-time-label">FROM:</span>
                                <span class="hiring-time-value" id="gigStatusFrom">-</span>
                                <span class="hiring-time-label">TO:</span>
                                <span class="hiring-time-value" id="gigStatusTo">-</span>
                            </div>
                        </div>
                        <div class="hiring-main-row">
                            <div class="hiring-thumbnail">
                                <img id="gigStatusJobImage" src="public/images/Gisugo-icon.png" alt="Gig">
                            </div>
                            <div class="hiring-content">
                                <div class="hiring-left-content">
                                    <div class="hiring-price" id="gigStatusPrice">PHP 0</div>
                                    <div class="hiring-role-caption customer" id="gigStatusParty">-</div>
                                    <div class="hiring-status-badge in-progress" id="gigStatusStatusBadge"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="gig-status-sheet-footer">
                    <div id="gigStatusSheetActions" class="gig-status-sheet-actions"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    function ensureGigStatusMediaOverlay() {
        let overlay = getElement('gigStatusMediaOverlay');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'gigStatusMediaOverlay';
        overlay.className = 'gig-status-overlay';
        overlay.innerHTML = `
            <div class="gig-media-sheet">
                <h3>Face Verification</h3>
                <p id="gigStatusMediaName">Worker Verification</p>
                <div class="gig-media-preview">
                    <img id="gigStatusMediaPoster" alt="Verification preview">
                    <video id="gigStatusMediaVideo" controls playsinline preload="metadata"></video>
                    <button id="gigStatusMediaPlayBtn" class="gig-media-play-btn" type="button" aria-label="Play verification video">▶ Play</button>
                </div>
                <button id="gigStatusMediaCloseBtn" class="gig-status-secondary-btn" type="button">CLOSE</button>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    function ensureGigStatusDecisionOverlay() {
        let overlay = getElement('gigStatusDecisionOverlay');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'gigStatusDecisionOverlay';
        overlay.className = 'gig-status-overlay';
        overlay.innerHTML = `
            <div class="gig-decision-sheet">
                <div class="gig-decision-title-row">
                    <div id="gigStatusDecisionIcon" class="gig-decision-icon">♻️</div>
                    <h3 id="gigStatusDecisionTitle">Decision</h3>
                </div>
                <p id="gigStatusDecisionSubtitle">Confirm action for this gig.</p>
                <div class="gig-decision-tabs">
                    <button type="button" class="lang-tab active" data-lang="english">English</button>
                    <button type="button" class="lang-tab" data-lang="bisaya">Bisaya</button>
                    <button type="button" class="lang-tab" data-lang="tagalog">Tagalog</button>
                </div>
                <div id="gigStatusDecisionBody" class="gig-decision-body"></div>
                <div class="gig-decision-reason-wrap">
                    <label id="gigStatusReasonLabel" for="gigStatusReasonInput">Reason</label>
                    <textarea id="gigStatusReasonInput" maxlength="200"></textarea>
                    <div class="gig-decision-char-count"><span id="gigStatusReasonCount">0</span>/200 characters</div>
                </div>
                <div class="gig-decision-actions">
                    <button id="gigStatusDecisionCancelBtn" class="gig-status-secondary-btn" type="button">CANCEL</button>
                    <button id="gigStatusDecisionConfirmBtn" class="gig-status-primary-btn" type="button">CONFIRM</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    function ensureGigStatusCompleteOverlay() {
        let overlay = getElement('gigStatusCompleteOverlay');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'gigStatusCompleteOverlay';
        overlay.className = 'gig-status-overlay';
        overlay.innerHTML = `
            <div class="gig-complete-sheet">
                <div class="gig-complete-icon">✅</div>
                <h3>Mark Gig as Completed</h3>
                <p id="gigStatusCompleteSubtitle">Confirm this gig has been completed.</p>
                <div class="gig-decision-tabs">
                    <button type="button" class="lang-tab active" data-lang="english">English</button>
                    <button type="button" class="lang-tab" data-lang="bisaya">Bisaya</button>
                    <button type="button" class="lang-tab" data-lang="tagalog">Tagalog</button>
                </div>
                <div class="gig-complete-checklist">
                    <div id="gigStatusCompleteChecklistBody" class="gig-complete-checklist-content"></div>
                </div>
                <div class="gig-decision-actions">
                    <button id="gigStatusCompleteCancelBtn" class="gig-status-secondary-btn" type="button">NO, NOT YET</button>
                    <button id="gigStatusCompleteConfirmBtn" class="gig-status-primary-btn" type="button">YES, COMPLETED</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    function hideGigStatusOverlay() {
        const context = state.gigStatusContext;
        const ids = [
            'gigStatusOverlay',
            'gigStatusMediaOverlay',
            'gigStatusDecisionOverlay',
            'gigStatusCompleteOverlay'
        ];
        ids.forEach(function (id) {
            const overlay = getElement(id);
            if (overlay) overlay.classList.remove('show');
        });
        if (context && typeof context.onClose === 'function') {
            try {
                context.onClose();
            } catch (error) {
                console.warn('Gig status close callback failed:', error);
            }
        }
        state.gigStatusContext = null;
    }

    function showSingleGigStatusOverlay(targetOverlay) {
        const ids = [
            'gigStatusOverlay',
            'gigStatusMediaOverlay',
            'gigStatusDecisionOverlay',
            'gigStatusCompleteOverlay'
        ];
        ids.forEach(function (id) {
            const overlay = getElement(id);
            if (!overlay) return;
            if (overlay === targetOverlay) {
                overlay.classList.add('show');
            } else {
                overlay.classList.remove('show');
            }
        });
    }

    function buildGigStatusContext(job, role, payload, profile) {
        const counterpartName = role === 'customer'
            ? safeText(job.hiredWorkerName, 'WORKER')
            : safeText(job.posterName, 'CUSTOMER');
        const partyLabel = role === 'customer'
            ? `YOU HIRED ${counterpartName.toUpperCase()}`
            : `WORKING FOR ${counterpartName.toUpperCase()}`;
        return {
            jobId: String(job.id || payload.jobId || ''),
            jobCategory: String(job.category || payload.jobCategory || '').trim().toLowerCase(),
            role: role,
            jobTitle: safeText(job.title, 'Gig'),
            dueDate: formatGigStatusDate(job.jobDate || job.scheduledDate),
            timeFrom: safeText(job.startTime || job.timeFrom, '-'),
            timeTo: safeText(job.endTime || job.timeTo, '-'),
            priceLabel: `₱${safeText(job.agreedPrice || job.priceOffer || job.budget, '0')}`,
            partyLabel: partyLabel,
            statusLabel: safeText(job.status, 'accepted').replaceAll('_', ' ').toUpperCase(),
            jobThumbnail: safeText(job.thumbnail || job.imageUrl || job.photoUrl, 'public/images/Gisugo-icon.png'),
            verificationVideoUrl: safeText(profile?.verification?.faceVideoUrl, ''),
            verificationPosterUrl: safeText(profile?.verification?.faceImageUrl || profile?.photoURL, ''),
            counterpartId: safeText(payload?.counterpartId, ''),
            onUpdated: payload?.onUpdated,
            onClose: payload?.onClose
        };
    }

    async function openGigStatusMedia() {
        const context = state.gigStatusContext;
        if (!context) return;
        const overlay = ensureGigStatusMediaOverlay();
        const titleEl = getElement('gigStatusMediaName');
        const posterEl = getElement('gigStatusMediaPoster');
        const videoEl = getElement('gigStatusMediaVideo');
        const playBtn = getElement('gigStatusMediaPlayBtn');
        const closeBtn = getElement('gigStatusMediaCloseBtn');
        if (!overlay || !videoEl || !posterEl || !playBtn) return;

        if (!context.verificationVideoUrl && context.counterpartId) {
            const profile = await getCachedProfileForGigStatus(context.counterpartId);
            context.verificationVideoUrl = safeText(profile?.verification?.faceVideoUrl, '');
            context.verificationPosterUrl = safeText(profile?.verification?.faceImageUrl || profile?.photoURL, '');
        }

        if (!context.verificationVideoUrl) {
            if (typeof window.showTemporaryNotification === 'function') {
                window.showTemporaryNotification('Verification video unavailable.');
            }
            return;
        }

        if (titleEl) {
            titleEl.textContent = context.role === 'customer'
                ? 'Worker Verification'
                : 'Customer Verification';
        }
        posterEl.src = context.verificationPosterUrl || '';
        // Match original viewer behavior: portrait media with no native controls.
        videoEl.removeAttribute('controls');
        videoEl.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback noplaybackrate');
        videoEl.setAttribute('disablepictureinpicture', 'true');
        videoEl.setAttribute('playsinline', 'true');
        videoEl.muted = false;
        videoEl.loop = false;
        videoEl.preload = 'metadata';
        videoEl.poster = context.verificationPosterUrl || '';
        videoEl.src = context.verificationVideoUrl;
        posterEl.style.display = 'none';
        videoEl.style.display = 'block';
        videoEl.currentTime = 0;
        playBtn.style.display = 'inline-flex';
        playBtn.textContent = '▶ Play';
        playBtn.setAttribute('aria-label', 'Play verification video');

        const syncPlayUi = function () {
            const isPlaying = !videoEl.paused && !videoEl.ended;
            playBtn.textContent = isPlaying ? '❚❚ Pause' : '▶ Play';
            playBtn.setAttribute('aria-label', isPlaying ? 'Pause verification video' : 'Play verification video');
        };

        playBtn.onclick = function () {
            if (videoEl.paused || videoEl.ended) {
                void videoEl.play().then(syncPlayUi).catch(function () {});
            } else {
                videoEl.pause();
                syncPlayUi();
            }
        };
        videoEl.onclick = function () {
            if (videoEl.paused || videoEl.ended) {
                void videoEl.play().then(syncPlayUi).catch(function () {});
            } else {
                videoEl.pause();
                syncPlayUi();
            }
        };
        videoEl.onplay = syncPlayUi;
        videoEl.onpause = syncPlayUi;
        videoEl.onended = syncPlayUi;

        if (closeBtn) closeBtn.onclick = function () {
            videoEl.pause();
            videoEl.onplay = null;
            videoEl.onpause = null;
            videoEl.onended = null;
            videoEl.onclick = null;
            playBtn.onclick = null;
            showSingleGigStatusOverlay(ensureGigStatusOverlay());
        };
        overlay.onclick = function (event) {
            if (event.target === overlay) {
                videoEl.pause();
                videoEl.onplay = null;
                videoEl.onpause = null;
                videoEl.onended = null;
                videoEl.onclick = null;
                playBtn.onclick = null;
                showSingleGigStatusOverlay(ensureGigStatusOverlay());
            }
        };
        showSingleGigStatusOverlay(overlay);
    }

    function getDecisionContent(actionType, lang, workerName) {
        const targetName = safeText(workerName, 'Worker');
        if (actionType === 'relist') {
            const relistMap = {
                english: `WARNING:\n• This will void the current contract with ${targetName}\n• Remove them from this gig\n• Make this gig available for new applications\n\nPlease make sure you have notified ${targetName} before proceeding.`,
                bisaya: `BANTAY:\n• Kini mopahunong sa kasabutan nimo ug ${targetName}\n• Tangtangon sila gikan sa gig\n• Mahimong available pag-usab ang gig\n\nPalihug pahibaloa si ${targetName} sa dili pa mopadayon.`,
                tagalog: `BABALA:\n• Ito ay magpapawalang-bisa sa kasunduan ninyo ni ${targetName}\n• Tatanggalin siya sa gig na ito\n• Magiging bukas ulit ito sa applications\n\nPakisabihan muna si ${targetName} bago magpatuloy.`
            };
            return relistMap[lang] || relistMap.english;
        }
        const resignMap = {
            english: `WARNING:\n• This will void your contract with ${targetName}\n• Remove you from this gig\n• Make this gig available for new applications\n\nPlease ensure you contacted the customer before proceeding.`,
            bisaya: `BANTAY:\n• Kini mopahunong sa kasabutan nimo ug ${targetName}\n• Matangtang ka sa gig\n• Mabuksan pag-usab ang gig para sa applications\n\nSiguroha nga nakasulti ka sa customer sa dili pa mopadayon.`,
            tagalog: `BABALA:\n• Ito ay magpapawalang-bisa sa kontrata mo kay ${targetName}\n• Tatanggalin ka sa gig na ito\n• Magiging bukas ulit ito sa applications\n\nSiguraduhing nakausap mo ang customer bago magpatuloy.`
        };
        return resignMap[lang] || resignMap.english;
    }

    function getCompleteChecklistContent(lang) {
        const completeMap = {
            english: `VERIFY:\n• The work has been completed to your satisfaction\n• You have paid the worker for their services\n• Any follow-up arrangements have been made`,
            bisaya: `SIGURUHA:\n• Nahuman ang trabaho ug nakontento ka sa resulta\n• Nabayan na nimo ang worker alang sa iyang serbisyo\n• Nahimo na ang bisan unsang follow-up nga sabot`,
            tagalog: `TIYAKIN:\n• Natapos ang trabaho ayon sa iyong kasiyahan\n• Nabayaran mo na ang worker para sa kanyang serbisyo\n• Naisagawa na ang anumang follow-up na napagkasunduan`
        };
        return completeMap[lang] || completeMap.english;
    }

    function openGigStatusDecision(actionType) {
        const context = state.gigStatusContext;
        if (!context) return;
        const overlay = ensureGigStatusDecisionOverlay();
        const titleEl = getElement('gigStatusDecisionTitle');
        const iconEl = getElement('gigStatusDecisionIcon');
        const subtitleEl = getElement('gigStatusDecisionSubtitle');
        const bodyEl = getElement('gigStatusDecisionBody');
        const reasonLabel = getElement('gigStatusReasonLabel');
        const reasonInput = getElement('gigStatusReasonInput');
        const reasonCount = getElement('gigStatusReasonCount');
        const cancelBtn = getElement('gigStatusDecisionCancelBtn');
        const confirmBtn = getElement('gigStatusDecisionConfirmBtn');
        const tabs = overlay.querySelectorAll('.lang-tab');
        if (!overlay || !bodyEl || !reasonInput || !confirmBtn) return;

        const workerName = context.partyLabel.replace(/^YOU HIRED\s+/i, '').replace(/^WORKING FOR\s+/i, '');
        let activeLang = 'english';
        if (titleEl) titleEl.textContent = actionType === 'relist' ? 'Relist Gig' : 'Resign from Gig';
        if (iconEl) iconEl.textContent = actionType === 'relist' ? '🔄' : '👋';
        if (subtitleEl) {
            subtitleEl.textContent = actionType === 'relist'
                ? `This will void the contract with ${workerName}`
                : `This will void your contract with ${workerName}`;
        }
        if (reasonLabel) {
            reasonLabel.textContent = actionType === 'relist'
                ? `For records, please provide reason why you are firing ${workerName}:`
                : 'For records, please provide reason why you are quitting before the gig is complete:';
        }
        reasonInput.value = '';
        if (reasonCount) reasonCount.textContent = '0';
        reasonInput.placeholder = actionType === 'relist'
            ? 'Enter reason for termination (minimum 2 characters)'
            : 'Enter reason for resignation (minimum 2 characters)';
        bodyEl.innerHTML = renderDecisionBodyHtml(getDecisionContent(actionType, activeLang, workerName));
        confirmBtn.textContent = actionType === 'relist' ? 'YES, VOID & RELIST' : 'YES, RESIGN';
        confirmBtn.disabled = true;

        const updateReasonState = function () {
            const current = String(reasonInput.value || '');
            const trimmed = current.trim();
            if (reasonCount) reasonCount.textContent = String(current.length);
            confirmBtn.disabled = trimmed.length < 2;
        };
        reasonInput.oninput = updateReasonState;
        updateReasonState();

        tabs.forEach(function (tab) {
            tab.classList.toggle('active', String(tab.dataset.lang) === 'english');
            tab.onclick = function () {
                tabs.forEach(function (entry) { entry.classList.remove('active'); });
                tab.classList.add('active');
                activeLang = String(tab.dataset.lang || 'english');
                bodyEl.innerHTML = renderDecisionBodyHtml(getDecisionContent(actionType, activeLang, workerName));
            };
        });

        if (cancelBtn) cancelBtn.onclick = function () { showSingleGigStatusOverlay(ensureGigStatusOverlay()); };
        confirmBtn.onclick = async function () {
            const reason = String(reasonInput.value || '').trim();
            if (reason.length < 2) {
                if (typeof window.showTemporaryNotification === 'function') {
                    window.showTemporaryNotification('Please add a reason (minimum 2 characters).');
                }
                return;
            }

            confirmBtn.disabled = true;
            const oldLabel = confirmBtn.textContent;
            confirmBtn.textContent = actionType === 'relist' ? 'RELISTING...' : 'RESIGNING...';
            try {
                const result = actionType === 'relist'
                    ? (typeof window.relistGigFromChat === 'function' ? await window.relistGigFromChat(context.jobId, reason) : null)
                    : (typeof window.resignGigFromChat === 'function' ? await window.resignGigFromChat(context.jobId, reason) : null);
                if (!result || !result.success) {
                    if (typeof window.showTemporaryNotification === 'function') {
                        window.showTemporaryNotification(result?.message || 'Action failed.');
                    }
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = oldLabel;
                    return;
                }
                hideGigStatusOverlay();
                if (typeof window.showTemporaryNotification === 'function') {
                    window.showTemporaryNotification(actionType === 'relist' ? 'Gig relisted.' : 'Resignation submitted.');
                }
                if (typeof context.onUpdated === 'function') context.onUpdated();
            } catch (error) {
                console.error('Gig decision action failed:', error);
                if (typeof window.showTemporaryNotification === 'function') {
                    window.showTemporaryNotification('Action failed. Please try again.');
                }
                confirmBtn.disabled = false;
                confirmBtn.textContent = oldLabel;
            }
        };

        overlay.onclick = function (event) {
            if (event.target === overlay) showSingleGigStatusOverlay(ensureGigStatusOverlay());
        };
        showSingleGigStatusOverlay(overlay);
    }

    function openGigStatusCompleteConfirm() {
        const context = state.gigStatusContext;
        if (!context) return;
        const overlay = ensureGigStatusCompleteOverlay();
        const subtitleEl = getElement('gigStatusCompleteSubtitle');
        const bodyEl = getElement('gigStatusCompleteChecklistBody');
        const cancelBtn = getElement('gigStatusCompleteCancelBtn');
        const confirmBtn = getElement('gigStatusCompleteConfirmBtn');
        const tabs = overlay.querySelectorAll('.lang-tab');
        if (!overlay || !confirmBtn || !bodyEl) return;

        if (subtitleEl) {
            subtitleEl.textContent = `Confirm that "${context.jobTitle}" has been completed.`;
        }
        let activeLang = 'english';
        bodyEl.innerHTML = renderCompleteBodyHtml(getCompleteChecklistContent(activeLang));
        tabs.forEach(function (tab) {
            tab.classList.toggle('active', String(tab.dataset.lang) === 'english');
            tab.onclick = function () {
                tabs.forEach(function (entry) { entry.classList.remove('active'); });
                tab.classList.add('active');
                activeLang = String(tab.dataset.lang || 'english');
                bodyEl.innerHTML = renderCompleteBodyHtml(getCompleteChecklistContent(activeLang));
            };
        });

        if (cancelBtn) cancelBtn.onclick = function () { showSingleGigStatusOverlay(ensureGigStatusOverlay()); };
        confirmBtn.onclick = async function () {
            confirmBtn.disabled = true;
            const oldLabel = confirmBtn.textContent;
            confirmBtn.textContent = 'COMPLETING...';
            try {
                const result = typeof window.completeGigFromChat === 'function'
                    ? await window.completeGigFromChat(context.jobId)
                    : null;
                if (!result || !result.success) {
                    if (typeof window.showTemporaryNotification === 'function') {
                        window.showTemporaryNotification(result?.message || 'Failed to complete gig.');
                    }
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = oldLabel;
                    return;
                }
                hideGigStatusOverlay();
                if (typeof window.showTemporaryNotification === 'function') {
                    window.showTemporaryNotification('Gig marked as completed.');
                }
                if (typeof context.onUpdated === 'function') context.onUpdated();
            } catch (error) {
                console.error('Gig complete action failed:', error);
                if (typeof window.showTemporaryNotification === 'function') {
                    window.showTemporaryNotification('Failed to complete gig.');
                }
                confirmBtn.disabled = false;
                confirmBtn.textContent = oldLabel;
            }
        };
        overlay.onclick = function (event) {
            if (event.target === overlay) showSingleGigStatusOverlay(ensureGigStatusOverlay());
        };
        showSingleGigStatusOverlay(overlay);
    }

    async function showGigStatusOverlay(payload) {
        const overlay = ensureGigStatusOverlay();
        const closeBtn = getElement('gigStatusCloseBtn');
        const actionListEl = getElement('gigStatusSheetActions');
        const cardBody = getElement('gigStatusCardBody');
        const titleEl = getElement('gigStatusJobTitle');
        const dueEl = getElement('gigStatusDue');
        const fromEl = getElement('gigStatusFrom');
        const toEl = getElement('gigStatusTo');
        const priceEl = getElement('gigStatusPrice');
        const partyEl = getElement('gigStatusParty');
        const stateBadgeEl = getElement('gigStatusStatusBadge');
        const jobImageEl = getElement('gigStatusJobImage');
        const visualCardEl = getElement('gigStatusVisualCard');
        if (!overlay || !cardBody || !actionListEl) return;

        const jobId = String(payload?.jobId || '').trim();
        const role = String(payload?.currentUserRole || '').trim().toLowerCase() === 'worker' ? 'worker' : 'customer';
        if (!jobId || typeof window.getJobById !== 'function') {
            if (typeof window.showTemporaryNotification === 'function') {
                window.showTemporaryNotification('Gig status data is unavailable.');
            }
            return;
        }

        let job = payload?.jobData && typeof payload.jobData === 'object'
            ? payload.jobData
            : null;
        if (!job) {
            try {
                job = await window.getJobById(jobId);
            } catch (error) {
                console.warn('Gig status lookup failed:', error);
            }
        }
        if (!job) {
            if (typeof window.showTemporaryNotification === 'function') {
                window.showTemporaryNotification('Unable to load gig status.');
            }
            return;
        }

        const counterpartId = role === 'customer'
            ? String(job.hiredWorkerId || '').trim()
            : String(job.posterId || '').trim();
        const context = buildGigStatusContext(job, role, {
            ...payload,
            counterpartId: counterpartId
        }, {});
        state.gigStatusContext = context;

        if (titleEl) titleEl.textContent = context.jobTitle;
        if (dueEl) dueEl.textContent = context.dueDate;
        if (fromEl) fromEl.textContent = context.timeFrom;
        if (toEl) toEl.textContent = context.timeTo;
        if (priceEl) priceEl.textContent = context.priceLabel;
        if (partyEl) partyEl.textContent = context.partyLabel;
        if (stateBadgeEl) {
            const isInProgress = context.statusLabel === 'ACCEPTED' || context.statusLabel === 'HIRED';
            stateBadgeEl.textContent = isInProgress ? 'Work in Progress' : context.statusLabel;
            stateBadgeEl.classList.toggle('in-progress', isInProgress);
            stateBadgeEl.classList.toggle('pending', !isInProgress);
        }
        if (jobImageEl) jobImageEl.src = context.jobThumbnail;
        if (visualCardEl) {
            visualCardEl.classList.toggle('worker', context.role === 'worker');
            visualCardEl.classList.toggle('customer', context.role !== 'worker');
        }
        if (partyEl) {
            partyEl.classList.toggle('worker', context.role === 'worker');
            partyEl.classList.toggle('customer', context.role !== 'worker');
        }

        actionListEl.innerHTML = '';
        const addStatusAction = function (label, className, handler) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `gig-action-btn ${className || ''}`.trim();
            button.textContent = label;
            button.onclick = handler;
            actionListEl.appendChild(button);
        };

        addStatusAction(
            `WATCH ${context.role === 'customer' ? 'WORKER' : 'CUSTOMER'} FACE VERIFICATION VIDEO`,
            'success',
            function () {
                openGigStatusMedia();
            }
        );

        if (context.role === 'customer') {
            addStatusAction('MARK AS COMPLETED', 'primary', function () {
                openGigStatusCompleteConfirm();
            });
            addStatusAction('RELIST GIG', 'warning', function () {
                openGigStatusDecision('relist');
            });
        } else {
            addStatusAction('RESIGN FROM GIG', 'danger', function () {
                openGigStatusDecision('resign');
            });
        }
        addStatusAction('CLOSE', 'cancel', hideGigStatusOverlay);

        if (closeBtn) closeBtn.onclick = hideGigStatusOverlay;
        cardBody.onclick = null;
        cardBody.onkeydown = null;
        overlay.onclick = function (event) {
            if (event.target === overlay) hideGigStatusOverlay();
        };
        showSingleGigStatusOverlay(overlay);
    }

    async function showHireConfirmationOverlay(workerData) {
        const overlay = ensureHireConfirmationOverlay();
        const closeBtn = getElement('hireConfirmationCloseBtn');
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
        if (placeholderEl) placeholderEl.classList.remove('hidden');
        updateHireGateState();

        // Keep the overlay responsive while verification data resolves.
        applyHireStatusToOverlay({
            type: 'new-member',
            icon: '⌛',
            title: 'Checking Verification',
            description: 'Loading worker verification details...',
            posterUrl: '',
            videoUrl: ''
        }, workerName);

        langTabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                const lang = String(tab.getAttribute('data-lang') || '').toLowerCase();
                langTabs.forEach(function (entry) { entry.classList.toggle('active', entry === tab); });
                Object.keys(allContent).forEach(function (key) {
                    if (allContent[key]) allContent[key].style.display = key === lang ? 'block' : 'none';
                });
                if (placeholderEl) placeholderEl.classList.add('hidden');
                updateHireGateState();
            }, { signal: signal });
        });

        const cachedProfile = getCachedHireProfile(workerData.userId);
        const profilePromise = cachedProfile
            ? Promise.resolve(cachedProfile)
            : ((typeof window.getUserProfile === 'function' && workerData.userId)
                ? window.getUserProfile(workerData.userId).then(function (profile) {
                    setCachedHireProfile(workerData.userId, profile || null);
                    return profile || null;
                }).catch(function () { return null; })
                : Promise.resolve(null));
        void profilePromise.then(function (profile) {
            if (signal.aborted) return;
            const status = resolveStatusFromProfile(profile || {});
            applyHireStatusToOverlay(status, workerName);
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                hideHireConfirmationOverlay();
            }, { signal: signal });
        }

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
        hideHireConfirmationOverlay: hideHireConfirmationOverlay,
        showGigStatusOverlay: showGigStatusOverlay,
        hideGigStatusOverlay: hideGigStatusOverlay
    };
}(window));
