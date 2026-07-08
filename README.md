# 🚀 Campaign Co-Pilot

**An open-source AI marketing campaign planner.** Feed it a business brief — budget, objective, platforms, audience — and it generates a launch-ready plan across Meta, Google, TikTok, Snapchat, LinkedIn and X: budget split, per-platform targeting and creative, a week-by-week playbook, ad copy, creative hooks and a landing-page audit.

- **No key?** The planner runs 100% free in the browser using built-in benchmarks and logic.
- **Add a key?** The AI writes the *strategy sections* tailored to your exact business, and the AI Studio (copy, hooks, landing audit) switches on.
- **Any provider.** Anthropic, OpenAI, Google Gemini, or any OpenAI-compatible endpoint (OpenRouter, Groq, Together, local). Your key stays server-side, never exposed to the browser.

> Built and open-sourced by **Revanth** — digital marketing & AI automation, UAE.
> Portfolio: _add link_ · LinkedIn: _add link_

---

## ✨ What it generates

**Always free (runs in the browser, no key):** campaign summary · projected results per platform · budget split · campaign structure · target audience per platform · messaging angles · creative types · tracking plan · landing checklist · UAE compliance flags · pre-launch QA · weekly performance plan per platform · optimization & scaling rules.

**With a key (any provider):** the strategy sections above are re-written by AI from your exact inputs, plus — **AI ad copy** (EN/AR) · **creative hooks & concepts** · **landing-page audit** (reads your URL and grades it).

---

## 🟢 Make it live — step by step (no experience needed)

You'll do this in ~15 minutes. Three free accounts: GitHub (store the code), Vercel (host it), and one AI provider (the key).

### Step 1 — Put the code on GitHub
1. Create a free account at [github.com](https://github.com).
2. Easiest way to upload: install [GitHub Desktop](https://desktop.github.com), click **File → Add Local Repository**, pick this unzipped folder, then **Publish repository**.
   *(Prefer the website? On github.com click **New → repository**, then drag every file from this folder into the upload box and commit.)*

### Step 2 — Host it on Vercel
1. Go to [vercel.com](https://vercel.com) and **Sign up with GitHub**.
2. Click **Add New → Project**, pick your `campaign-copilot` repo, and press **Deploy**.
3. Vercel auto-detects Vite — you don't configure anything. In ~1 minute you get a live URL. **The free planner already works.**

### Step 3 — Turn on the AI (add your key)
1. Get an API key from your provider (e.g. [console.anthropic.com](https://console.anthropic.com), [platform.openai.com](https://platform.openai.com), or [aistudio.google.com](https://aistudio.google.com)).
2. In Vercel: **your project → Settings → Environment Variables**. Add:
   - `LLM_PROVIDER` = `anthropic` (or `openai` / `google` / `compatible`)
   - `LLM_API_KEY` = your key
   - `LLM_MODEL` = *(optional — leave blank for the default)*
3. Go to **Deployments → ⋯ → Redeploy**. Done — the AI features are now live on your site.

That's it. Share the URL on LinkedIn.

---

## 🔑 Provider settings

| Variable | Required | Example |
|---|---|---|
| `LLM_PROVIDER` | ✅ | `anthropic`, `openai`, `google`, or `compatible` |
| `LLM_API_KEY` | ✅ (for AI) | your key |
| `LLM_MODEL` | ⬜ | `claude-sonnet-5` · `gpt-4o-mini` · `gemini-1.5-flash` |
| `LLM_BASE_URL` | only for `compatible` | `https://openrouter.ai/api/v1` |

Defaults if `LLM_MODEL` is blank: anthropic→`claude-sonnet-5`, openai→`gpt-4o-mini`, google→`gemini-1.5-flash`. Set your own model id anytime.

---

## 💻 Run it on your own computer (optional)

```bash
npm install
npm run dev          # opens http://localhost:5173 — free planner works immediately
```

To test the **AI features locally**, run the serverless function too:
```bash
npm i -g vercel
cp .env.example .env.local     # paste your provider + key into .env.local
vercel dev                     # serves app + /api on http://localhost:3000
```

---

## 🎛️ Make it yours
- **`src/data.js`** — platforms, benchmark cost ranges, targeting templates, UAE compliance. Tune the numbers to your own account data.
- **`src/logic.js`** — how each output is calculated (budget split, weekly plan).
- **`api/generate.js`** — the AI prompts and the provider adapters.
- **`src/App.jsx`** — the UI; put your `PORTFOLIO_URL` / `LINKEDIN_URL` at the top.
- **`src/styles.css`** — theme colors (CSS variables at the top).

## 📁 Structure
```
campaign-copilot/
├── api/generate.js     # serverless AI (holds your key, any provider)
├── src/App.jsx         # UI
├── src/data.js         # platforms, benchmarks, templates
├── src/logic.js        # free-tier plan generation
├── src/styles.css      # theme
├── index.html · vercel.json · .env.example · package.json
```

## ⚠️ Notes
- Projected numbers are planning estimates from benchmark ranges — tune them.
- Arabic ad copy is AI-generated — have a native speaker review before launch.
- The landing audit fetches the page server-side; only audit pages you own or may analyse.

## 📄 License
MIT — do whatever you like, attribution appreciated. Built by Revanth.
