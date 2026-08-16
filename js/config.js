/**
 * Cassian AI — site configuration
 * Edit this file for embeds, images, and integrations.
 * Pricing display strings live in index.html (#price-intro, #price-diagnostic, etc.).
 */
window.CASSIAN_CONFIG = {
  /** Calendly scheduling URL for the Book a call section and CTA links */
  calendlyUrl:
    "https://calendly.com/jahleeljackson-cassianconsultingai/30-minute-discovery-call",

  /**
   * About portrait path. Drop a file in /images then set this, e.g. "images/about.jpg".
   * Leave empty to show the placeholder.
   */
  aboutImage: "images/about-image2.png",

  /** Netlify Forms form name (must match the form name attribute) */
  formName: "contact",

  /**
   * Optional webhook (Zapier, Make, Apps Script, etc.).
   * If set, successful form submits also POST JSON to this URL.
   */
  formWebhookUrl: "",

  pricing: {
    /**
     * Numeric diagnostic amount used only for ROI payback-months math.
     * Display copy is edited in index.html (#price-diagnostic, #roi-diagnostic-label).
     */
    diagnosticForRoi: 1499,
  },

  roi: {
    reductions: {
      pessimistic: 0.15,
      expected: 0.25,
      optimistic: 0.5,
    },
  },
};
