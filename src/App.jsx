import React, { useState, useEffect } from "react";
import { PLATFORMS, OBJECTIVES, LANGUAGES } from "./data.js";
import { generatePlan, fmt } from "./logic.js";

const PORTFOLIO_URL = "#";   // ← put your portfolio link here
const LINKEDIN_URL = "#";    // ← put your LinkedIn link here

const Spark = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
  </svg>
);
const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

function Block({ n, title, children, ai }) {
  return (
    <div className="block">
      <div className="b-hd"><span className="n">{n}</span><h4>{title}</h4>{ai && <span className="aitag"><Spark />AI</span>}</div>
      {children}
    </div>
  );
}

export default function App() {
  const [f, setF] = useState({
    business: "", budget: "8000", period: "monthly", location: "Dubai, UAE",
    objective: "leads", platforms: ["meta", "google"], language: "both",
    audience: "", website: "", brief: "", offer: "", weeks: "4"
  });
  const [plan, setPlan] = useState(null);
  const [aiPlan, setAiPlan] = useState(null);
  const [err, setErr] = useState("");
  const [adLang, setAdLang] = useState("en");
  const [building, setBuilding] = useState(false);

  const [aiEnabled, setAiEnabled] = useState(null); // null=checking, true/false=known
  const [ai, setAi] = useState({ copy: null, hooks: null, audit: null });
  const [busy, setBusy] = useState({});
  const [aiErr, setAiErr] = useState({});

  // Detect whether the deployment has an API key configured.
  useEffect(() => {
    fetch("/api/generate")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAiEnabled(!!(d && d.aiEnabled)))
      .catch(() => setAiEnabled(false));
  }, []);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const togglePlatform = (p) =>
    setF((s) => ({ ...s, platforms: s.platforms.includes(p) ? s.platforms.filter((x) => x !== p) : [...s.platforms, p] }));

  function aiPayload(inputs) {
    return {
      business: inputs.business, brief: inputs.brief, offer: inputs.offer,
      objective: OBJECTIVES[inputs.objective].label, audience: inputs.audience,
      location: inputs.location, language: inputs.language, url: inputs.website,
      platforms: inputs.platforms, budget: inputs.budget, period: inputs.period, weeks: inputs.weeks
    };
  }

  async function build() {
    if (!f.business.trim()) return setErr("Add your business name / what it does.");
    if (!(parseFloat(f.budget) > 0)) return setErr("Add a budget above zero.");
    if (!f.platforms.length) return setErr("Pick at least one platform.");
    setErr("");
    const inputs = {
      ...f, budget: parseFloat(f.budget), weeks: parseInt(f.weeks) || 4,
      audience: f.audience.trim(), offer: f.offer.trim(), business: f.business.trim(), location: f.location.trim()
    };
    const logicPlan = generatePlan(inputs);
    setPlan(logicPlan);
    setAiPlan(null);
    setAi({ copy: null, hooks: null, audit: null });
    setTimeout(() => document.querySelectorAll(".fill").forEach((el) => (el.style.width = el.dataset.w + "%")), 100);

    // If a key is connected, let the AI write the strategy sections from the inputs.
    if (aiEnabled) {
      setBuilding(true);
      try {
        const r = await fetch("/api/generate", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "plan", payload: aiPayload(inputs) })
        });
        const d = await r.json();
        if (r.ok && !d.error) setAiPlan(d);
      } catch { /* keep logic plan */ }
      setBuilding(false);
    }
  }

  async function runAI(type) {
    setBusy((b) => ({ ...b, [type]: true }));
    setAiErr((e) => ({ ...e, [type]: "" }));
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, payload: aiPayload(plan.inputs) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Request failed.");
      setAi((a) => ({ ...a, [type]: data }));
    } catch (e) {
      setAiErr((er) => ({ ...er, [type]: String(e.message || e) }));
    }
    setBusy((b) => ({ ...b, [type]: false }));
  }

  // ---- merge helpers: prefer AI section when present, else the logic version ----
  const mSummary = plan && (aiPlan?.summary
    ? { objective: plan.summary.objective, big: aiPlan.summary.big, positioning: aiPlan.summary.positioning }
    : plan.summary);
  const mAudiences = plan && (aiPlan?.audiences?.length
    ? plan.inputs.platforms.map((pk) => ({ p: pk, short: PLATFORMS[pk].short,
        text: aiPlan.audiences.find((a) => a.platform === pk)?.text || plan.audiences.find((a) => a.p === pk).text }))
    : plan.audiences);
  const mAngles = plan && (aiPlan?.angles?.length ? aiPlan.angles : plan.angles);
  const mLanding = plan && (aiPlan?.landing?.length ? aiPlan.landing : plan.landing);
  const mOpt = plan && (aiPlan?.optimization?.length ? aiPlan.optimization : plan.optimization);
  const creativeNote = (pk) => aiPlan?.creativeDirection?.find((c) => c.platform === pk)?.note;

  return (
    <div className="cc">
      <div className="wrap">
        <div className="top">
          <div className="brand">
            <div className="mark" aria-hidden="true"></div>
            <div><div className="ey">Open-source AI marketing planner</div><h1>Campaign Co-Pilot</h1></div>
          </div>
          <div className="byline">
            <span className={"dot" + (aiEnabled ? "" : " off")}></span>
            {aiEnabled === null ? "Checking AI…" : aiEnabled ? "AI connected" : "Free mode · add a key for AI"}
          </div>
        </div>

        <div className="lede">
          <h2>A business brief in. A <em>launch-ready plan</em> out.</h2>
          <p>Eleven inputs generate a full plan across your chosen channels. With an API key connected, the AI writes the strategy from your exact inputs and unlocks ad copy, creative hooks and a landing-page audit — using any provider you like.</p>
        </div>

        <div className="grid">
          {/* ---------- CONSOLE ---------- */}
          <div className="card console">
            <div className="hd"><span className="tag">Brief</span><h3>Campaign inputs</h3></div>

            <label className="f"><span>Business — name &amp; what it does <b className="req">*</b></span>
              <input type="text" value={f.business} onChange={(e) => set("business", e.target.value)} placeholder="e.g. Nova Interiors — home fit-out studio" /></label>

            <div className="row2">
              <label className="f"><span>Budget (AED) <b className="req">*</b></span>
                <input type="number" min="0" step="500" value={f.budget} onChange={(e) => set("budget", e.target.value)} /></label>
              <label className="f"><span>Period</span>
                <select value={f.period} onChange={(e) => set("period", e.target.value)}>
                  <option value="monthly">Per month</option><option value="total">Total for run</option></select></label>
            </div>

            <div className="row2">
              <label className="f"><span>Target location <b className="req">*</b></span>
                <input type="text" value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="Dubai / Abu Dhabi / UAE" /></label>
              <label className="f"><span>Duration (weeks)</span>
                <input type="number" min="1" max="12" value={f.weeks} onChange={(e) => set("weeks", e.target.value)} /></label>
            </div>

            <label className="f"><span>Objective <b className="req">*</b></span>
              <select value={f.objective} onChange={(e) => set("objective", e.target.value)}>
                {Object.keys(OBJECTIVES).map((k) => <option key={k} value={k}>{OBJECTIVES[k].label}</option>)}</select></label>

            <div className="f"><span className="lblspan">Platforms <b className="req">*</b></span>
              <div className="checks">
                {Object.keys(PLATFORMS).map((k) => (
                  <button key={k} type="button" className={"chk" + (f.platforms.includes(k) ? " on" : "")} onClick={() => togglePlatform(k)}>
                    <span className="box">{f.platforms.includes(k) && <Check />}</span>{PLATFORMS[k].short}
                  </button>))}
              </div>
            </div>

            <label className="f"><span>Language</span>
              <select value={f.language} onChange={(e) => set("language", e.target.value)}>
                {Object.keys(LANGUAGES).map((k) => <option key={k} value={k}>{LANGUAGES[k]}</option>)}</select></label>

            <label className="f"><span>Target audience</span>
              <input type="text" value={f.audience} onChange={(e) => set("audience", e.target.value)} placeholder="e.g. villa owners 30–55 planning a renovation" /></label>

            <label className="f"><span>Website / landing link</span>
              <input type="text" value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." /></label>

            <label className="f"><span>Product / brief</span>
              <textarea value={f.brief} onChange={(e) => set("brief", e.target.value)} placeholder="A few lines on what you're selling and why people buy it." /></label>

            <label className="f"><span>Offer (optional)</span>
              <input type="text" value={f.offer} onChange={(e) => set("offer", e.target.value)} placeholder="e.g. Free design consult + 10% off this month" /></label>

            {err && <div className="err">{err}</div>}
            <button className="build" onClick={build} disabled={building}>
              {building ? <span className="spin"></span> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>}
              {building ? "AI is thinking…" : "Build my plan"}
            </button>
            <p className="buildnote">{aiEnabled ? "AI will tailor the strategy to your inputs." : "Runs free in your browser. Connect a key for AI-written strategy."}</p>
          </div>

          {/* ---------- OUTPUT ---------- */}
          <div className="out">
            {!plan &&
              <div className="empty card">
                <div className="ic"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></svg></div>
                <h4>Your plan will appear here</h4>
                <p>Fill in the brief and press <b>Build my plan</b>.</p>
              </div>}

            {plan &&
              <div className="plan">
                <Block n="1" title="Campaign summary" ai={!!aiPlan?.summary}>
                  <div className="kv">
                    <span className="k">Objective</span><span className="v">{mSummary.objective}</span>
                    <span className="k">Big idea</span><span className="v">{mSummary.big}</span>
                    <span className="k">Positioning</span><span className="v">{mSummary.positioning}</span>
                  </div>
                </Block>

                <Block n="2" title="Projected results per platform">
                  {plan.projections.map((pr) => (
                    <div key={pr.p} className="pplat">
                      <div className="pplat-h">{pr.short}</div>
                      <div className="metrics">{pr.metrics.map((m, i) => (
                        <div className={"metric" + (i === 1 ? " hi" : "")} key={i}><p className="ml">{m.l}</p><div className="mv">{m.v}</div></div>))}</div>
                    </div>))}
                  <p className="disclaimer">Calculated from benchmark ranges in <code>src/data.js</code> — planning estimates, not guarantees.</p>
                </Block>

                <Block n="3" title={`Budget split · AED ${fmt(plan.split.totalBudget)} ${plan.inputs.period === "total" ? "total" : "/mo"}`}>
                  {plan.split.rows.map((r) => {
                    const max = Math.max(...plan.split.rows.map((x) => x.pct));
                    return (
                      <div className="bar-row" key={r.p}>
                        <span className="lbl">{r.short}</span>
                        <div className="track"><div className="fill" data-w={Math.round(r.pct / max * 100)} style={{ width: 0 }}></div></div>
                        <span className="amt">{r.pct}% · AED {fmt(r.periodAmt)}</span>
                      </div>);
                  })}
                  <p className="disclaimer">Daily pacing per platform ≈ its monthly share ÷ 30.4. Start each with 2–3 ad sets; scale winners.</p>
                </Block>

                <Block n="4" title="Campaign structure per platform">
                  {plan.structure.map((s) => (
                    <div key={s.p} className="stack">
                      <div className="stack-h">{s.short}</div>
                      <ul className="tight">{s.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
                    </div>))}
                </Block>

                <Block n="5" title="Target audience per platform" ai={!!aiPlan?.audiences?.length}>
                  {mAudiences.map((a) => (
                    <div key={a.p} className="stack"><div className="stack-h">{a.short}</div><p className="ptxt">{a.text}</p></div>))}
                </Block>

                <Block n="6" title="Audience & messaging angles" ai={!!aiPlan?.angles?.length}>
                  {mAngles.map((a, i) => (
                    <div className="angle" key={i}><span className="ai">{i + 1}</span><p><b>{a.t}</b> — <span>{a.d}</span></p></div>))}
                </Block>

                <Block n="7" title="Creative types per platform" ai={!!aiPlan?.creativeDirection?.length}>
                  <div className="fmt">{plan.creatives.map((c) => (
                    <div className="col" key={c.p}>
                      <h6>{c.short}</h6>
                      {creativeNote(c.p) && <p className="cdir">{creativeNote(c.p)}</p>}
                      {c.formats.map((x, j) => <span className="chip" key={j}>{x}</span>)}
                    </div>))}</div>
                </Block>

                <Block n="10" title="Tracking & measurement plan">
                  <ul className="tight">{plan.tracking.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </Block>

                <Block n="11" title="Landing / conversion checklist" ai={!!aiPlan?.landing?.length}>
                  <div className="check">{mLanding.map((l, i) => (
                    <div className="ci" key={i}><span className="cb"><Check /></span><span>{l}</span></div>))}</div>
                </Block>

                <Block n="12" title="Compliance & risk flags (UAE)">
                  <div className="note-list">{plan.compliance.map((c, i) => (
                    <div className="note" key={i}>{c}</div>))}</div>
                </Block>

                <Block n="13" title="Pre-launch QA checklist">
                  <div className="check">{plan.qa.map((q, i) => (
                    <div className="ci" key={i}><span className="cb"><Check /></span><span>{q}</span></div>))}</div>
                </Block>

                <Block n="14" title="Weekly performance plan per platform">
                  {plan.weekly.map((wp) => (
                    <div key={wp.p} className="stack">
                      <div className="stack-h">{wp.short}</div>
                      {wp.note && <div className="pnote">{wp.note}</div>}
                      {wp.weeks.map((w) => (
                        <div className="week" key={w.n}>
                          <div className="wk-h"><span className="wk-n">W{w.n}</span> {w.phase}</div>
                          <div className="wk-b"><b>Do:</b> {w.focus}</div>
                          <div className="wk-b"><b>Watch:</b> {w.watch}</div>
                          <div className="wk-b"><b>Expect:</b> {w.expect}</div>
                          <div className="wk-why">Why: {w.why}</div>
                        </div>))}
                    </div>))}
                </Block>

                <Block n="15" title="Optimization & scaling rules" ai={!!aiPlan?.optimization?.length}>
                  <ul className="tight">{mOpt.map((o, i) => <li key={i}>{o}</li>)}</ul>
                </Block>
              </div>}
          </div>
        </div>

        {/* ---------- AI STUDIO ---------- */}
        {plan &&
          <div className="studio">
            <div className="studio-hd">
              <div className="spark-badge"><Spark /></div>
              <div><h3>AI Studio</h3><div className="sub">{aiEnabled ? "Connected — generate copy, hooks and a landing audit." : "Add a key (any provider) to switch these on."}</div></div>
            </div>
            <div className="aigrid">
              <AIPanel title="Ad copy" desc="Polished variants in your selected language(s)." busy={busy.copy} err={aiErr.copy} onRun={() => runAI("copy")} disabled={!aiEnabled}>
                {ai.copy && ai.copy.variants && (
                  <>
                    <div className="tabs">
                      <button className={adLang === "en" ? "on" : ""} onClick={() => setAdLang("en")}>EN</button>
                      <button className={adLang === "ar" ? "on" : ""} onClick={() => setAdLang("ar")}>AR</button>
                    </div>
                    {ai.copy.variants.filter((v) => v.lang === adLang).map((v, i) => (
                      <div className={"ada" + (v.lang === "ar" ? " rtl" : "")} key={i}>
                        <div className="hl">{v.headline}</div><div>{v.primary}</div>
                        <div className="ct">{v.angle} · {v.cta}</div>
                      </div>))}
                    {!ai.copy.variants.some((v) => v.lang === adLang) && <p className="disclaimer">No {adLang.toUpperCase()} variants for this language setting.</p>}
                  </>)}
                {ai.copy && ai.copy.raw && <pre className="raw">{ai.copy.raw}</pre>}
              </AIPanel>

              <AIPanel title="Creative hooks & concepts" desc="Scroll-stopping hooks and shootable ideas." busy={busy.hooks} err={aiErr.hooks} onRun={() => runAI("hooks")} disabled={!aiEnabled}>
                {ai.hooks && ai.hooks.hooks && (
                  <div className="ai-out">
                    <h6>Hooks</h6><ul className="tight">{ai.hooks.hooks.map((h, i) => <li key={i}>{h}</li>)}</ul>
                    {ai.hooks.concepts && <><h6>Concepts</h6><ul className="tight">{ai.hooks.concepts.map((c, i) => <li key={i}><b>{c.format}:</b> {c.idea}</li>)}</ul></>}
                  </div>)}
                {ai.hooks && ai.hooks.raw && <pre className="raw">{ai.hooks.raw}</pre>}
              </AIPanel>

              <AIPanel title="Landing-page audit" desc="Reads your URL and grades it for this objective." busy={busy.audit} err={aiErr.audit} onRun={() => runAI("audit")} disabled={!aiEnabled || !plan.inputs.website}>
                {!plan.inputs.website && <p className="disclaimer">Add a website link in the brief to enable this.</p>}
                {ai.audit && ai.audit.fixes && (
                  <div className="ai-out">
                    <div className="score">{ai.audit.score}<small>/100</small></div>
                    <p className="verdict">{ai.audit.verdict}</p>
                    {ai.audit.wins && <><h6>Working</h6><ul className="tight">{ai.audit.wins.map((w, i) => <li key={i}>{w}</li>)}</ul></>}
                    <h6>Fixes</h6><ul className="tight">{ai.audit.fixes.map((x, i) => <li key={i}><b>[{x.priority}]</b> {x.issue} — {x.fix}</li>)}</ul>
                  </div>)}
                {ai.audit && ai.audit.raw && <pre className="raw">{ai.audit.raw}</pre>}
              </AIPanel>
            </div>
          </div>}

        {/* ---------- CREDIT ---------- */}
        <div className="hire">
          <div className="txt">
            <div className="ey">Built &amp; open-sourced by Revanth</div>
            <h4>Fork it, add your key, ship it.</h4>
            <p>An open-source AI marketing planner. Clone the repo, add any AI provider's key, deploy to Vercel in minutes. Built by a digital-marketing &amp; AI-automation professional in the UAE.</p>
          </div>
          <div className="cta-row">
            <a className="primary" href={PORTFOLIO_URL} target="_blank" rel="noopener">Portfolio</a>
            <a className="ghost" href={LINKEDIN_URL} target="_blank" rel="noopener">LinkedIn</a>
          </div>
        </div>

        <div className="foot">Free &amp; open source · estimates are planning aids, not guarantees · MIT licensed</div>
      </div>
    </div>
  );
}

function AIPanel({ title, desc, busy, err, onRun, disabled, children }) {
  return (
    <div className="ai-panel">
      <div className="ph"><span className="pi"><Spark /></span><h5>{title}</h5></div>
      <p className="pd">{desc}</p>
      <button className="aibtn" disabled={busy || disabled} onClick={onRun}>
        {busy ? <span className="spin"></span> : <Spark />} Generate
      </button>
      {err && <div className="err">{err}</div>}
      {children}
    </div>
  );
}
