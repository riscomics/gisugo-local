// Shared support/contact category taxonomy.
// UI labels can change later while codes remain stable.
(function initSupportTaxonomy(global) {
  const SUPPORT_TAXONOMY = Object.freeze({
    publicContactTopics: Object.freeze([
      Object.freeze({ code: 'general_inquiry', label: 'General Inquiry' }),
      Object.freeze({ code: 'website_issues', label: 'Website Issues' }),
      Object.freeze({ code: 'feature_request', label: 'Feature Request' }),
      Object.freeze({ code: 'partners_sponsors', label: 'Partners & Sponsors' }),
    ]),
    supportResponseSublabels: Object.freeze([
      Object.freeze({ code: 'account_issues', label: 'Account Issues' }),
      Object.freeze({ code: 'complaints_disputes', label: 'Complaints & Disputes' }),
      Object.freeze({ code: 'feature_request', label: 'Feature Request' }),
      Object.freeze({ code: 'bug_report', label: 'Bug Report' }),
      Object.freeze({ code: 'safety_security', label: 'Safety & Security' }),
      Object.freeze({ code: 'payment_billing', label: 'Payment & Billing' }),
      Object.freeze({ code: 'other', label: 'Other' }),
    ]),
  });

  global.GISUGO_SUPPORT_TAXONOMY = SUPPORT_TAXONOMY;
})(window);
