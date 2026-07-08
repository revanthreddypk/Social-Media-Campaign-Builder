// -----------------------------------------------------------------------------
// data.js — the knowledge baked into the free (logic) tier.
// All benchmark numbers are illustrative UAE planning ranges, not guarantees.
// Tune these to your own account data — that is the whole point of open source.
// -----------------------------------------------------------------------------

export const PLATFORMS = {
  meta: {
    label: "Meta (Facebook & Instagram)", short: "Meta",
    cpm: [28, 55], cpc: [2.4, 5.2],
    strength: "Unmatched for visual demand-gen, retargeting and lookalikes across Instagram + Facebook.",
    formats: ["9:16 Reels / Stories video", "Feed carousel (3–5 cards)", "Single-image offer", "UGC testimonial video", "Advantage+ catalogue (e-com)"]
  },
  google: {
    label: "Google (Search, PMax, YouTube)", short: "Google",
    cpm: [20, 45], cpc: [3, 9],
    strength: "Captures active high-intent demand — people already searching for what you sell.",
    formats: ["Responsive Search Ads (15 headlines)", "Performance Max asset group", "YouTube 6s bumper / 15s skippable", "Display remarketing banners"]
  },
  tiktok: {
    label: "TikTok", short: "TikTok",
    cpm: [18, 40], cpc: [1.8, 4.5],
    strength: "Cheapest reach and the home of native, trend-led video that actually spreads.",
    formats: ["Spark Ads (boosted native post)", "9:16 hook-led video <15s", "Creator / UGC demo", "Carousel image ads"]
  },
  snapchat: {
    label: "Snapchat", short: "Snapchat",
    cpm: [15, 35], cpc: [1.5, 4],
    strength: "Strong reach with under-35 UAE audiences — good for awareness and app installs.",
    formats: ["9:16 Snap Ad (3–5s hook)", "Story Ad", "Collection Ad", "AR Lens (higher budget)"]
  },
  linkedin: {
    label: "LinkedIn", short: "LinkedIn",
    cpm: [60, 140], cpc: [12, 30],
    strength: "The only real channel for B2B targeting by job title, seniority and industry.",
    formats: ["Single-image sponsored post", "Document / carousel ad", "Lead-gen form ad", "Thought-leader video ad"]
  },
  x: {
    label: "X (Twitter)", short: "X",
    cpm: [20, 50], cpc: [2, 6],
    strength: "Real-time, conversation- and event-led reach; good for launches and awareness.",
    formats: ["Image / video post ad", "Vertical video ad", "Carousel ad", "Trend takeover (high budget)"]
  }
};

export const OBJECTIVES = {
  leads:      { label: "Leads / enquiries",       metaObj: "Lead generation (forms + WhatsApp / Click-to-WhatsApp)", kpi: "cpl" },
  sales:      { label: "Online sales",            metaObj: "Conversions / Catalogue sales",                          kpi: "roas" },
  visits:     { label: "Store visits / footfall", metaObj: "Store traffic",                                          kpi: "cpc" },
  awareness:  { label: "Awareness / reach",       metaObj: "Reach & brand awareness",                                kpi: "cpm" },
  engagement: { label: "Engagement",              metaObj: "Engagement & community",                                 kpi: "cpe" },
  installs:   { label: "App installs",            metaObj: "App promotion",                                          kpi: "cpi" }
};

export const LANGUAGES = { en: "English", ar: "Arabic", both: "English + Arabic" };

// How well each platform fits each objective (used to split budget).
export const FIT = {
  leads:      { meta: 5, google: 5, tiktok: 3, snapchat: 2, linkedin: 4, x: 2 },
  sales:      { meta: 5, google: 5, tiktok: 4, snapchat: 2, linkedin: 1, x: 2 },
  visits:     { meta: 5, google: 4, tiktok: 4, snapchat: 3, linkedin: 1, x: 2 },
  awareness:  { meta: 4, google: 3, tiktok: 5, snapchat: 4, linkedin: 2, x: 4 },
  engagement: { meta: 5, google: 2, tiktok: 5, snapchat: 4, linkedin: 3, x: 5 },
  installs:   { meta: 5, google: 4, tiktok: 4, snapchat: 4, linkedin: 1, x: 2 }
};

// Per-platform audience-build guidance. `aud` = the owner's audience description.
export const AUDIENCE = {
  meta: (aud) => `Build 3 audience sets: (1) broad / Advantage+ and let the algorithm find ${aud} using your creative as the real targeting; (2) a 1–3% Lookalike of your customer list or past leads; (3) retargeting of site visitors, video-viewers and IG/FB engagers (last 30 days). Layer interests only lightly — modern Meta rewards broad + strong creative.`,
  google: (aud) => `Target intent, not people. Build tight keyword themes around what ${aud} actually types into search, plus a Performance Max asset group fed with audience signals. Add remarketing lists for site visitors. Use phrase/exact match for control and a negative-keyword list to cut waste.`,
  tiktok: (aud) => `Start broad and let the system optimise toward ${aud}; add interest & behaviour clusters and creator/hashtag targeting for your niche. Retarget video-viewers (25%+ watched) and profile engagers. Native, sound-on creative matters more here than tight targeting.`,
  snapchat: (aud) => `Focus on ${aud} skewed under 35: use Snap Lifestyle Categories, a location radius, and a Lookalike of your customer list. Retarget Snap engagers and Pixel visitors. Keep the first 2 seconds punchy — Snap is fast.`,
  linkedin: (aud) => `Target ${aud} by job title, seniority, function, industry and company size. Keep each audience 50k–400k. Add a matched-audience retargeting layer from your site and lead-form openers. Best reserved for B2B and high-value services.`,
  x: (aud) => `Reach ${aud} via follower look-alikes of relevant accounts, keyword & conversation targeting and interest categories. Strongest around events, launches and trending moments. Retarget profile and post engagers.`
};

// UAE compliance flags by detected sector.
export const COMPLIANCE = [
  { match: ["real estate", "property", "realty", "broker", "apartment", "villa", "rent"], flags: ["Real estate ads in the UAE need RERA/DLD compliance — include your permit/ORN number and Trakheesi permit where required.", "Never advertise a property or price you can't honour; portals and Meta both police this."] },
  { match: ["clinic", "health", "medical", "dental", "derma", "aesthetic", "hospital", "pharmacy", "doctor"], flags: ["Healthcare ads require DHA / DoH / MOHAP compliance — claims, before/afters and doctor titles are regulated.", "Avoid guaranteed-outcome language; it will get the ad rejected and can breach health-authority rules."] },
  { match: ["loan", "finance", "credit", "invest", "bank", "insurance", "crypto"], flags: ["Financial promotions are regulated by the UAE Central Bank / SCA — mandatory disclaimers and licensing usually apply.", "Meta & Google restrict finance/crypto ads; expect an advertiser verification step."] },
  { match: ["supplement", "weight loss", "slimming", "cosmetic", "beauty"], flags: ["Health & beauty claims must be substantiated — no miracle-cure or guaranteed-result wording.", "Before/after imagery is restricted on Meta; use lifestyle framing instead."] }
];

export const COMPLIANCE_DEFAULT = [
  "Confirm your ad account is linked to a valid UAE trade licence — Meta/Google may request it for verification.",
  "Keep claims truthful and substantiated; avoid absolute superlatives ('best', 'No.1') unless you can prove them.",
  "If you collect leads, state how data is used — UAE PDPL data-protection expectations apply."
];
