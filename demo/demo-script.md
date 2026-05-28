# Life Risk Radar — Demo Script

**Project:** Life Risk Radar — "Ask your life," a Coral agent for your money, deadlines & documents
**Track:** WeMakeDevs *Pirates of the Coral-bean* — Personal Agent
**Target length:** ~2:45 (hard cap 3:00)
**One-liner:** *Ask your inbox, calendar, and money a question in plain English — Coral joins them with SQL and answers with the evidence.*

---

## Pre-flight checklist (do this before you hit record)

- [ ] `.env.local` has `ANTHROPIC_API_KEY` → free-text answers are live.
- [ ] `npm run dev` running; open `http://localhost:3000`.
- [ ] Coral is live — the badges show **🪸 Coral Live** (not "Seeded fallback").
- [ ] **Warm up the agent once** before recording (the first Claude call is the slowest). Ask one throwaway question so later calls feel snappy.
- [ ] Browser zoomed so the **dark "Coral SQL" panel** is readable on video.
- [ ] Verified beats to use:
  - Chip → *"Which missing document is blocking the most deadlines?"* → instant, deterministic.
  - Typed → *"which merchant did I pay the most to overall"* → `Booking.com … $280` (~8s).
- [ ] Tip: free-text takes ~8s. **Talk over the generation** ("watch — it's writing the SQL now…"), or record and trim the wait.

---

## The script (timed beats)

### 0:00 – 0:20 · Hook — make it personal
> **SAY:** "A while back, a free trial I'd completely forgotten about charged me ninety-six dollars. And the maddening part? The warning email was *right there* in my inbox. The renewal date was *right there* on my calendar. The charge was *right there* on my statement. The data existed — **nothing connected it.**"

> **DO:** You on camera, or a static title slide: **Life Risk Radar**.

### 0:20 – 0:35 · The idea
> **SAY:** "So I built **Life Risk Radar** — a personal agent you can just *ask* about your money, your deadlines, and your documents. It runs on **Coral**, which lets an agent query your inbox, calendar, and files — and *join across them* — with plain SQL."

> **DO:** Cut to the app. Hero reads **"Ask your life."** Hover the command bar.

### 0:35 – 1:25 · The "ask" — the live agent
> **SAY:** "Let me just ask it a question."

> **DO:** Type: **"which merchant did I pay the most to overall"** → hit **Ask**.

> **SAY (while it works, ~8s):** "Watch what's happening. Claude is writing a **Coral SQL query** from my question. Coral runs it across my sources and hands back the answer — and crucially, it **shows me the exact query it ran.**"

> **DO:** Answer appears → point to it: headline, the **✨ Claude wrote this SQL** badge, then expand/point at the **dark Coral SQL panel**.

> **SAY:** "There it is — *Booking dot com, two hundred and eighty dollars.* And this isn't a canned response. That's **live SQL**, joining my transactions to my Gmail receipts, generated on the fly. Then it even **drafts the action** for me." *(point to the drafted message)*

### 1:25 – 2:05 · The killer insight — only a join finds this
> **SAY:** "But here's the moment that sold *me* on it."

> **DO:** Click the chip → **"Which missing document is blocking the most deadlines?"** (instant).

> **SAY:** "One missing file — `address_proof.pdf` — is blocking **two** deadlines at once: my passport appointment *and* my bank KYC. That's a **single point of failure** in my week. No dashboard would ever surface that. **Only a join does** — and Coral makes the join one query." *(point at the SQL panel again)*

### 2:05 – 2:25 · Why this is the best use of Coral
> **SAY:** "That's the whole idea. Coral turned my inbox, my calendar, and my files into **one database I can join.** No ETL, no glue code. The agent writes the question, Coral does the join, and **every number traces straight back to its source** — the email, the charge, the calendar event."

> **DO:** Briefly scroll the source badges (Gmail · Calendar · Files · Coral) and a result's evidence row.

### 2:25 – 2:45 · Close — impact
> **SAY:** "Your life is already queryable. The risk just hides in the **gaps between your apps** — and the join is where the insight lives. That's **Life Risk Radar**: ask a question, get the answer, the evidence, and the SQL behind it. Thanks for watching."

> **DO:** End on the hero **"Ask your life."** with a freshly answered question on screen.

---

## Backup: 60-second elevator cut

> "Last month a forgotten free trial charged me ninety-six dollars — and the warning was already sitting in my inbox. The data existed; nothing joined it. **Life Risk Radar** is a Coral agent you ask in plain English. *[type a question]* Claude writes the SQL, **Coral joins my inbox, calendar, and transactions**, and it answers with the evidence — and shows the exact query. *[click the document chip]* It even spots single points of failure: one missing file blocking two deadlines. No ETL, no glue code — just SQL across your life, with every number traced to its source. **Your life is queryable; the join is where the insight lives.**"

---

## Delivery tips

- **Energy on the hook and the close** — those are what judges remember.
- Say the phrase **"cross-source join"** and **"the exact SQL it ran"** out loud — they map directly to the *Best Use of Coral* criterion.
- Let the **single-point-of-failure** beat breathe — it's your most original, most quotable moment.
- Don't apologize for the ~8s wait; **narrate it** ("watch it write the query…"). The wait is part of the wow.
- If anything is flaky live, the **chips are deterministic** — lean on them and use one typed question for the "live" beat.
- Keep one sentence of honesty if asked: the demo runs on **seeded, reproducible data** so anyone can run it end-to-end; the live Gmail/Calendar path is scaffolded via a read-only source spec.

---

## Soundbites (drop into your Devpost / Discord blurb)

- "Ask your life — Coral joins your inbox, calendar, and money with SQL."
- "One missing file was blocking two deadlines. Only a join finds that."
- "The agent writes the question; Coral does the join; every number traces to its source."
- "Your life is already queryable. The risk lives in the gaps between your apps."
