// -----------------------------------------------------------------------------
// api/generate.js — Vercel serverless function.
//
// Works with ANY provider. Set these env vars in Vercel (or .env.local):
//   LLM_PROVIDER = anthropic | openai | google | compatible   (default: anthropic)
//   LLM_API_KEY  = your key                                    (required for AI)
//   LLM_MODEL    = a model id for your provider                (has a default per provider)
//   LLM_BASE_URL = base url, only for provider "compatible"    (e.g. OpenRouter/Groq/local)
//
// (For backward-compat, ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY are
//  also read if LLM_API_KEY is not set.)
//
// The key is used ONLY here on the server and is never sent to the browser.
// -----------------------------------------------------------------------------

const PROVIDER = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
const KEY =
  process.env.LLM_API_KEY ||
  process.env.ANTHROPIC_API_KEY ||
  process.env.OPENAI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";
const BASE_URL = process.env.LLM_BASE_URL || "";

const DEFAULT_MODEL = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-4o-mini",
  google: "gemini-1.5-flash",
  compatible: "gpt-4o-mini"
};
const MODEL = process.env.LLM_MODEL || DEFAULT_MODEL[PROVIDER] || "claude-sonnet-5";

// ---- provider adapters: all return a plain text string ----
async function callLLM(system, user, maxTokens = 1200) {
  if (PROVIDER === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] })
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const d = await r.json();
    return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  }

  if (PROVIDER === "google") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens }
      })
    });
    if (!r.ok) throw new Error(`Google ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const d = await r.json();
    return (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("\n");
  }

  // openai + compatible (OpenRouter, Groq, Together, local LM servers, etc.)
  const base = PROVIDER === "openai" ? "https://api.openai.com/v1" : (BASE_URL || "https://api.openai.com/v1");
  const r = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, { role: "user", content: user }]
    })
  });
  if (!r.ok) throw new Error(`LLM ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "";
}

function parseJSON(text) {
  const clean = String(text).replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(clean);
}

// ---- prompts ----
const PROMPTS = {
  plan: (p) => ({
    max: 1600,
    system: "You are a senior UAE performance-marketing strategist. Write specific, practical strategy tailored to THIS exact business — never generic filler. You know Meta, Google, TikTok, Snapchat, LinkedIn and X, and how audiences and creative differ on each.",
    user: `Build the strategy sections of a paid-media plan.
Business: ${p.business}
Product/brief: ${p.brief || "(not provided)"}
Offer: ${p.offer || "(none)"}
Objective: ${p.objective}
Audience the owner described: ${p.audience || "(not provided — infer a sensible target)"}
Location: ${p.location}
Languages: ${p.language}
Duration: ${p.weeks} weeks
Budget: AED ${p.budget} ${p.period === "total" ? "total" : "per month"}
Selected platforms (use these exact keys): ${p.platforms.join(", ")}

Return ONLY valid JSON, no markdown:
{
  "summary": { "big": "one-sentence big idea/hook", "positioning": "one sentence on how to position this business vs alternatives" },
  "audiences": [ { "platform": "<one of the keys>", "text": "2-3 sentences: exactly how to build & target this audience on THIS platform for THIS business" } ],
  "angles": [ { "t": "short angle name", "d": "one sentence on the angle" } ],
  "creativeDirection": [ { "platform": "<key>", "note": "one sentence of creative direction specific to this business & platform" } ],
  "landing": [ "conversion/landing-page point tailored to this offer" ],
  "optimization": [ "optimization or scaling rule tailored to this objective & budget" ]
}
Include one "audiences" and one "creativeDirection" entry per selected platform. 4 angles. 4-5 landing points. 4-5 optimization points. Keep every line tight and specific to this business.`
  }),
  copy: (p) => ({
    max: 1300,
    system: "You are a senior UAE performance-marketing copywriter, fluent in English and natural Gulf Arabic. When asked for Arabic you write native UAE marketing Arabic, never a literal translation.",
    user: `Write ad copy.
Business: ${p.business}
Product/brief: ${p.brief || "(not provided)"}
Offer: ${p.offer || "(none)"}
Objective: ${p.objective}
Audience: ${p.audience || "(general)"}
Location: ${p.location}
Languages: ${p.language}
Produce ${p.language === "English + Arabic" || p.language === "both" ? "2 English and 2 Arabic" : /arab/i.test(p.language) ? "3 Arabic" : "3 English"} variants.
Return ONLY valid JSON, no markdown:
{"variants":[{"lang":"en|ar","angle":"","headline":"","primary":"","cta":""}]}
Keep primary text to 2-3 short sentences.`
  }),
  hooks: (p) => ({
    max: 1000,
    system: "You are a UAE social creative director who briefs scroll-stopping ad creative for Meta, TikTok and Snapchat.",
    user: `Business: ${p.business}. Product: ${p.brief || "(n/a)"}. Offer: ${p.offer || "(none)"}. Objective: ${p.objective}. Audience: ${p.audience || "general"}. Location: ${p.location}.
Return ONLY valid JSON, no markdown:
{"hooks":["","","","",""],"concepts":[{"format":"Reel|TikTok|Static|Story","idea":""}]}
5 punchy hook lines (first 3 seconds) and 3 shootable concepts.`
  }),
  audit: (p) => ({
    max: 1000,
    system: "You are a CRO (conversion-rate optimisation) specialist. You audit landing pages for a specific ad objective and give blunt, prioritised fixes.",
    user: `Audit this landing page for the objective "${p.objective}".
URL: ${p.url}
Page content (may be partial):
"""${(p.pageText || "").slice(0, 6000)}"""
Return ONLY valid JSON, no markdown:
{"score":0-100,"verdict":"one line","wins":["",""],"fixes":[{"issue":"","fix":"","priority":"high|med|low"}]}
Base it on what the page actually says; 3-5 fixes.`
  })
};

async function fetchPageText(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 CampaignCoPilotBot" }, redirect: "follow" });
    const html = await r.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  // GET → status: lets the front-end know if AI is available and which provider.
  if (req.method === "GET") {
    res.status(200).json({ aiEnabled: !!KEY, provider: PROVIDER, model: KEY ? MODEL : null });
    return;
  }
  if (req.method !== "POST") { res.status(405).json({ error: "Use POST." }); return; }
  if (!KEY) {
    res.status(503).json({ error: "no_key", message: "AI is off. Set LLM_API_KEY (and LLM_PROVIDER) in your environment variables to enable AI features." });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { type, payload } = body;
    if (!PROMPTS[type]) { res.status(400).json({ error: "Unknown type." }); return; }

    const p = { ...payload };
    if (type === "audit") {
      if (!p.url) { res.status(400).json({ error: "A website URL is required for the audit." }); return; }
      p.pageText = await fetchPageText(p.url);
    }

    const { system, user, max } = PROMPTS[type](p);
    const raw = await callLLM(system, user, max || 1200);
    let json;
    try { json = parseJSON(raw); }
    catch { res.status(200).json({ raw }); return; }
    res.status(200).json(json);
  } catch (e) {
    res.status(500).json({ error: "ai_failed", message: String(e.message || e) });
  }
}
