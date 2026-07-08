// -----------------------------------------------------------------------------
// logic.js — turns the 11 inputs into the free-tier plan (outputs 1–7, 10–15).
// Pure functions, no network. AI outputs (8, 9, audit) live in the serverless fn.
// -----------------------------------------------------------------------------
import { PLATFORMS, OBJECTIVES, FIT, AUDIENCE, COMPLIANCE, COMPLIANCE_DEFAULT } from "./data.js";

export const fmt = (n) => Math.round(n).toLocaleString("en-US");
const band = (lo, hi) => `${fmt(lo)} – ${fmt(hi)}`;

// ---- 3. Budget split across selected platforms ----
export function budgetSplit(inputs) {
  const { platforms, objective, budget, period, weeks } = inputs;
  const monthly = period === "total" ? (budget / Math.max(1, weeks)) * 4.345 : budget;
  const fit = FIT[objective];
  const totalFit = platforms.reduce((s, p) => s + (fit[p] || 1), 0) || 1;
  const rows = platforms.map((p) => {
    const pct = Math.round(((fit[p] || 1) / totalFit) * 100);
    return { p, short: PLATFORMS[p].short, pct };
  });
  // fix rounding drift so it sums to 100
  const drift = 100 - rows.reduce((s, r) => s + r.pct, 0);
  if (rows.length) rows[0].pct += drift;
  const totalBudget = period === "total" ? budget : budget; // display value
  rows.forEach((r) => {
    r.monthly = monthly * (r.pct / 100);
    r.daily = r.monthly / 30.4;
    r.periodAmt = (period === "total" ? budget : budget) * (r.pct / 100);
  });
  return { rows, monthly, totalBudget };
}

// ---- 2. Projected results per platform ----
export function projections(inputs, split) {
  const { objective } = inputs;
  return split.rows.map((r) => {
    const P = PLATFORMS[r.p];
    const b = r.monthly;
    const impLo = (b / P.cpm[1]) * 1000, impHi = (b / P.cpm[0]) * 1000;
    const clLo = b / P.cpc[1], clHi = b / P.cpc[0];
    let primary;
    if (objective === "awareness") primary = { l: "People reached", v: band(impLo / 2, impHi / 1.7) };
    else if (objective === "engagement") primary = { l: "Engagements", v: band(impLo * 0.03, impHi * 0.08) };
    else if (objective === "visits") primary = { l: "Clicks / visits", v: band(clLo, clHi) };
    else if (objective === "installs") primary = { l: "Installs", v: band(clLo * 0.2, clHi * 0.4) };
    else if (objective === "sales") primary = { l: "Est. orders", v: band(clLo * 0.02, clHi * 0.05) };
    else primary = { l: "Leads", v: band(clLo * 0.06, clHi * 0.12) };

    let secondary;
    if (objective === "leads") secondary = { l: "Cost / lead", v: "AED " + band(P.cpc[0] / 0.12, P.cpc[1] / 0.06) };
    else if (objective === "sales") secondary = { l: "Target ROAS", v: "1.8x – 4.0x" };
    else if (objective === "installs") secondary = { l: "Cost / install", v: "AED " + band(P.cpc[0] / 0.4, P.cpc[1] / 0.2) };
    else secondary = { l: "Avg CPM", v: "AED " + band(P.cpm[0], P.cpm[1]) };

    return {
      p: r.p, short: r.short,
      metrics: [
        { l: "Impressions", v: band(impLo, impHi) },
        primary,
        secondary
      ]
    };
  });
}

// ---- 1. Campaign summary ----
export function summary(inputs) {
  const { business, objective, location, offer, audience, weeks, platforms } = inputs;
  const obj = OBJECTIVES[objective].label.toLowerCase();
  const plats = platforms.map((p) => PLATFORMS[p].short).join(", ");
  const idea = offer
    ? `Lead with the offer — "${offer}" — as the hook, and let proof (reviews, results) carry the click.`
    : `Lead with the single sharpest benefit for ${audience || "the target customer"}, backed by proof.`;
  return {
    objective: OBJECTIVES[objective].metaObj,
    big: idea,
    positioning: `${business} to ${audience || "its core audience"} in ${location}, running ${obj} across ${plats} over ${weeks} week${weeks > 1 ? "s" : ""}.`,
  };
}

// ---- 4. Campaign structure per platform ----
export function structure(inputs) {
  const { objective, platforms } = inputs;
  const obj = OBJECTIVES[objective];
  return platforms.map((p) => ({
    p, short: PLATFORMS[p].short,
    obj: obj.metaObj,
    lines: [
      `Campaign: 1 objective-led campaign (${obj.metaObj}).`,
      `Ad sets: 2–3 to start — split by audience angle, not by tiny interests.`,
      `Ads: 3–5 creatives per ad set so the algorithm has variety to optimise.`,
      `Naming: {Platform}_{Objective}_{Audience}_{Creative} — e.g. ${PLATFORMS[p].short}_${objective}_LAL_ReelA.`
    ]
  }));
}

// ---- 5. Target audience per platform ----
export function audiencePerPlatform(inputs) {
  const aud = inputs.audience || "your core customer";
  return inputs.platforms.map((p) => ({ p, short: PLATFORMS[p].short, text: AUDIENCE[p](aud) }));
}

// ---- 6. Audience & messaging angles ----
export function angles(inputs) {
  const a = inputs.audience || "your customer";
  const base = [
    { t: "Problem / solution", d: `Open on the pain ${a} feels, then position ${inputs.business} as the fix.` },
    { t: "Offer-led", d: inputs.offer ? `Push "${inputs.offer}" with urgency and a clear deadline.` : `Build a compelling offer (bundle, first-time deal, guarantee) and lead with it.` },
    { t: "Social proof", d: `Reviews, ratings, results and UGC — let customers do the selling.` },
    { t: "Retargeting", d: `Different message for warm audiences: handle objections, add a reason to act now.` }
  ];
  return base;
}

// ---- 7. Creative types per platform ----
export function creativePerPlatform(inputs) {
  return inputs.platforms.map((p) => ({ p, short: PLATFORMS[p].short, formats: PLATFORMS[p].formats }));
}

// ---- 10. Tracking & measurement ----
export function tracking(inputs) {
  const events = {
    leads: "Lead / CompleteRegistration + qualified-lead value",
    sales: "Purchase (with value + currency) + AddToCart + InitiateCheckout",
    visits: "Store-visit / LandingPageView + Direction clicks",
    awareness: "Reach & frequency (no conversion event needed)",
    engagement: "Post engagement, video-views, saves",
    installs: "App install + key in-app event"
  }[inputs.objective];
  return [
    `Install the Meta Pixel + Conversions API (server-side) and the Google tag / GA4 before spending a dirham.`,
    `Primary event to optimise: ${events}.`,
    `UTM every link: utm_source={platform}, utm_medium=paid, utm_campaign={campaign}, utm_content={creative}.`,
    `Route conversions into your CRM / WhatsApp so you can measure real closed business, not just platform-reported results.`,
    `Report from one dashboard (GA4 or a sheet) so numbers reconcile across platforms.`
  ];
}

// ---- 11. Landing / conversion checklist ----
export function landing(inputs) {
  return [
    `One page, one goal — match the ad's offer and headline exactly (message match).`,
    `Above the fold: the offer, one clear CTA, and a trust signal (rating / logo / guarantee).`,
    `Mobile-first and fast — under ~3s load; most UAE traffic is on a phone.`,
    inputs.language !== "en" ? `Provide the page (or a version) in Arabic with proper RTL layout.` : `Keep copy tight and skimmable; lead with benefits.`,
    `Make contact frictionless: WhatsApp button, short form (name + phone), or one-tap call.`,
    `Add a thank-you page that fires the conversion event and sets expectations for follow-up.`
  ];
}

// ---- 12. Compliance & risk ----
export function compliance(inputs) {
  const text = (inputs.business + " " + (inputs.brief || "")).toLowerCase();
  let flags = [];
  COMPLIANCE.forEach((c) => { if (c.match.some((m) => text.includes(m))) flags = flags.concat(c.flags); });
  return flags.length ? flags.concat(COMPLIANCE_DEFAULT.slice(0, 1)) : COMPLIANCE_DEFAULT;
}

// ---- 13. Pre-launch QA ----
export function qa() {
  return [
    "Tracking verified — fire a test lead/purchase and confirm it lands in Events Manager + CRM.",
    "Every link works and carries the right UTMs.",
    "Copy proofread in each language; Arabic checked by a native speaker.",
    "Creatives meet each platform's spec and safe-zone (no cut-off text).",
    "Billing active with a valid payment method and enough limit for the first week.",
    "Budgets, schedule and geo double-checked; compliance items cleared.",
    "Approvals signed off by the decision-maker before you hit publish."
  ];
}

// ---- 14. Weekly performance plan per platform ----
const WEEK_PHASES = [
  { phase: "Launch & learn", focus: "Go live with all ad sets and creatives. Do NOT edit — let each ad set exit the learning phase.", watch: "Delivery, CTR, CPM, early cost-per-result.", expect: "Metrics are unstable this week — it's data-gathering, not judgement time.", why: "Editing during learning resets it and burns budget." },
  { phase: "Read & cut", focus: "Pause the bottom 20–30% by cost-per-result. Shift that budget to the top ad sets.", watch: "Cost-per-result stabilising, frequency, CTR.", expect: "Cost-per-result should start trending down.", why: "You now have enough data to trust the winners over the losers." },
  { phase: "Scale winners", focus: "Raise winning ad-set budgets 20–30% every 2–3 days. Turn on retargeting.", watch: "Does efficiency hold as spend rises? Frequency creep.", expect: "More volume while staying inside your target cost band.", why: "Gradual scaling keeps the algorithm stable; big jumps reset learning." },
  { phase: "Refresh creative", focus: "Fatigue is setting in — launch new hooks/angles and refresh top performers.", watch: "Frequency (>2.5–3), CTR decline, CPM rising.", expect: "New creative resets CTR and pulls CPM back down.", why: "Same audience + same creative = costs climb over time." },
  { phase: "Expand & optimise", focus: "Broaden winning audiences, test a new geo or angle, tighten bids.", watch: "Incremental cost-per-result of new segments vs core.", expect: "Steady scale without efficiency falling apart.", why: "Controlled expansion finds fresh demand once the core is proven." },
  { phase: "Review & report", focus: "Full readout: cost-per-result vs target, what to keep and what to cut next flight.", watch: "Blended CPL/CPA/ROAS and closed business from the CRM.", expect: "A clear verdict and a sharper plan for the next cycle.", why: "Platform numbers only matter if they map to real revenue." }
];
const PLATFORM_NOTE = {
  meta: "Meta learning phase ≈ 50 conversions/ad set/week — keep budgets high enough to reach it.",
  google: "Let Smart Bidding gather conversions before judging; add negative keywords weekly.",
  tiktok: "Refresh creative fastest here — TikTok fatigues in days, not weeks.",
  snapchat: "Front-load the hook; Snap viewers decide in the first 2 seconds.",
  linkedin: "Higher CPMs mean slower data — give it more time and use lead-gen forms to lift conversion.",
  x: "Lean into timely, event-led angles; evergreen creative underperforms here."
};
export function weeklyPlan(inputs) {
  const w = Math.max(1, Math.min(12, inputs.weeks));
  return inputs.platforms.map((p) => {
    const weeks = [];
    for (let i = 0; i < w; i++) {
      let phase;
      if (i === 0) phase = WEEK_PHASES[0];
      else if (i === w - 1 && w >= 3) phase = WEEK_PHASES[5];
      else if (i === 1) phase = WEEK_PHASES[1];
      else if (i === 2) phase = WEEK_PHASES[2];
      else phase = WEEK_PHASES[3 + ((i - 3) % 2)]; // alternate refresh / expand
      weeks.push({ n: i + 1, ...phase });
    }
    return { p, short: PLATFORMS[p].short, note: PLATFORM_NOTE[p], weeks };
  });
}

// ---- 15. Optimization & scaling rules ----
export function optimization(inputs) {
  const kpi = OBJECTIVES[inputs.objective].kpi.toUpperCase();
  return [
    `Scale rule: if an ad set beats target ${kpi} for 3+ days, raise its budget 20–30% every 2–3 days.`,
    `Kill rule: pause any ad that spends ~2x your target cost-per-result with zero results.`,
    `Creative rule: refresh when frequency passes ~2.5–3 or CTR drops 20%+ from its peak.`,
    `Always-on retargeting: site visitors, engagers and add-to-cart / lead-starters get their own campaign.`,
    `Retention layer: pipe buyers/leads into email + WhatsApp flows so you stop renting the same customers.`
  ];
}

// ---- master generator ----
export function generatePlan(inputs) {
  const split = budgetSplit(inputs);
  return {
    inputs,
    summary: summary(inputs),
    projections: projections(inputs, split),
    split,
    structure: structure(inputs),
    audiences: audiencePerPlatform(inputs),
    angles: angles(inputs),
    creatives: creativePerPlatform(inputs),
    tracking: tracking(inputs),
    landing: landing(inputs),
    compliance: compliance(inputs),
    qa: qa(),
    weekly: weeklyPlan(inputs),
    optimization: optimization(inputs)
  };
}
