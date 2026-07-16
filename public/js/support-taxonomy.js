// Shared support/contact category taxonomy.
// Compose Topic dropdown and Support Responses subtype filter use the SAME list
// so submitted requests filter cleanly under All Messages → Support Responses → topic.
// UI labels can change later while codes remain stable.
(function initSupportTaxonomy(global) {
  const SHARED_SUPPORT_TOPICS = Object.freeze([
    Object.freeze({ code: 'account_issues', label: 'Account Issues' }),
    Object.freeze({ code: 'complaints_disputes', label: 'Complaints & Disputes' }),
    Object.freeze({ code: 'feature_request', label: 'Feature Request' }),
    Object.freeze({ code: 'bug_report', label: 'Bug Report' }),
    Object.freeze({ code: 'safety_security', label: 'Safety & Security' }),
    Object.freeze({ code: 'payment_billing', label: 'Payment & Billing' }),
    Object.freeze({ code: 'partners_sponsors', label: 'Partners & Sponsors' }),
    Object.freeze({ code: 'other', label: 'Other' }),
  ]);

  const SUPPORT_TAXONOMY = Object.freeze({
    // Compose modal Topic (was publicContactTopics — now unified).
    publicContactTopics: SHARED_SUPPORT_TOPICS,
    // Inbox filter: All Messages → Support Responses → these subtypes.
    supportResponseSublabels: SHARED_SUPPORT_TOPICS,
    // Legacy contact codes → unified codes (for old support_requests docs).
    legacyContactTopicMap: Object.freeze({
      general_inquiry: 'other',
      website_issues: 'bug_report',
      general: 'other',
      'website-issues': 'bug_report',
      'feature-request': 'feature_request',
      'partners-sponsors': 'partners_sponsors',
    }),
  });

  global.GISUGO_SUPPORT_TAXONOMY = SUPPORT_TAXONOMY;
})(window);
