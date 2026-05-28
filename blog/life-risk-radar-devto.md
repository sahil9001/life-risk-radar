---
title: "I built 'Ask Your Life' — a personal Coral agent that answers questions about your money & deadlines with SQL"
tags: ai, sql, webdev, hackathon
description: "A deep dive into Life Risk Radar, my WeMakeDevs Coral hackathon agent: natural-language questions become real cross-source SQL joins over your inbox, calendar, and transactions — with the query, the evidence, and a drafted action shown every time."
---

> "Here are the personal admin risks that can cost me money, time, or access this week — with the receipts." 🪸

That one sentence is the whole pitch for **Life Risk Radar**, my entry for the WeMakeDevs **Pirates of the Coral-bean** hackathon (Personal Agent track). It's a personal agent you can *ask* — in plain English — about your inbox, calendar, and money, and it answers with a **real cross-source SQL join**, the **evidence behind every number**, and a **drafted action** you can send.

This post is the full build story: the problem, the architecture, how [Coral](https://www.wemakedevs.org/hackathons/coral) turns "your life" into a queryable database, the agent loop that pairs Claude with Coral SQL, the safety model, and the things that broke along the way (a `--` that wasn't a comment, a Cloudflare 403, and a moment where I realised my SQL wasn't actually joining anything).

---

## The problem: your life leaks money through admin

Money, time, and access leak through the cracks of everyday admin, and almost always silently:

- a free trial that **auto-renews tomorrow** for $96/year 💸
- an Amazon **return window** quietly closing 🧾
- a **duplicate subscription charge** you never noticed 🪞
- a hotel **free-cancellation deadline** that locks in a $280 fee ⏰
- a passport appointment you'll **fail because a document is missing** 📄
- a bank **KYC deadline** that could freeze your account 🪪

Here's the thing: the evidence for all of these is *already in your accounts.* The renewal email is in Gmail. The charge is in your card statement. The appointment is on your Calendar. The missing file is in your documents folder.

The problem was never a lack of data. **The problem is that nobody joins it.** Your email doesn't know about your transactions. Your calendar doesn't know which document you're missing. Each source is an island, and the risk lives in the gaps *between* them.

That gap is exactly what Coral is built to close.

---

## What I built

Life Risk Radar has two modes, and the order matters.

**1. Ask your life (the hero).** A command bar where you type a question:

- *"What is costing me money this week?"*
- *"Am I being double-charged anywhere?"*
- *"Which missing document is blocking the most deadlines?"*
- *"What subscriptions or trials are about to renew?"*

The agent turns your question into Coral SQL, runs a genuine cross-source join, and answers with a one-line verdict, a result card per row, **the exact SQL it ran**, and a ready-to-send drafted action.

**2. Scan everything (the fallback).** Don't want to ask? One button sweeps every source, ranks the risks, and lays them out as a board you can open for a step-by-step "close this risk" action plan.

The whole thing is light-mode, editorial, and deliberately *un*-dashboardy — because the star isn't a chart, it's the answer and the query behind it.

---

## The pivot: from dashboard to agent

I'll be honest about how this started, because the turning point is the most useful part of the story.

My first version was a tidy risk **dashboard**. Click "Scan", get ranked cards. It looked finished. Then I opened the SQL that powered it and caught myself:

```sql
WITH gmail AS (SELECT ... FROM life_files.gmail_messages),
     deadlines AS (SELECT ... FROM life_files.manual_deadlines),
     documents AS (SELECT ... FROM life_files.documents),
     calendar_events AS (SELECT ... FROM life_files.calendar_events)
SELECT * FROM duplicate_charges
UNION ALL
SELECT * FROM deadline_risks;
```

It *declared* CTEs for five sources… and then **joined none of them**. The "cross-source evidence" was actually being stitched together afterwards in TypeScript with a fuzzy string matcher. I was using Coral as a fancy file reader, not as a join engine.

That's backwards. The single most valuable thing Coral gives you is a **SQL interface that joins across totally different sources** — email, calendar, files, APIs — as if they were one database. If my SQL wasn't joining, I wasn't really using Coral.

So I pivoted. Not the data, not the UI work — the *thesis*. From "a dashboard that reads from Coral" to **"an agent whose entire job is to ask Coral the right cross-source question."** That reframe is what turned a fine project into one with a point of view.

---

## How Coral fits

If you haven't used it: Coral is a local-first SQL engine that points at "sources" — APIs, files, calendars, databases — described by small spec files, and lets you query (and **join**) them with plain SQL. It also ships an MCP server (`coral mcp-stdio`) so an agent can use it as a tool directly.

Life Risk Radar uses two sources, no extra plumbing:

- **`life_files`** — a JSONL-backed source exposing five tables: `transactions`, `documents`, `manual_deadlines`, `calendar_events`, and `gmail_messages`. This is the reproducible demo data, so the project runs end-to-end without touching a personal inbox.
- **`gmail`** — an HTTP source spec that hits the real Gmail API with an OAuth token, exposing `message_search` and `message_details` for going live later.

Registering a source is two commands:

```bash
coral source add --file sources/life_files/manifest.yaml
coral source test life_files
```

…and now five different "islands" are one schema you can join.

---

## The architecture

Here's the request flow for a free-text question:

```
You type a question
        │
        ▼
┌──────────────────────┐   schema + question
│  Claude (Opus 4.7)   │ ─────────────────────►  Coral SQL (read-only)
└──────────────────────┘
        │ validated against a SELECT-only allowlist
        ▼
┌──────────────────────┐
│   coral sql … --      │   runs a REAL cross-source JOIN
└──────────────────────┘
        │ rows + evidence
        ▼
┌──────────────────────┐
│  Claude (Opus 4.7)   │   reads the rows → headline + drafted action
└──────────────────────┘
        │
        ▼
   UI shows: verdict · result cards · THE SQL · draft to send
```

It's a genuine two-step agent loop:

1. **Question → SQL.** Claude is given the schema and writes one Coral query.
2. **Validate.** The generated SQL passes through a read-only allowlist before it can touch anything.
3. **Run.** Coral executes the join and returns rows with evidence attached.
4. **Rows → answer.** Claude reads the actual results and writes the headline and a drafted action.

The UI then shows **the SQL it ran**. That transparency is the design centerpiece — when you can see the query and the joined evidence, the agent stops feeling like magic and starts feeling *inspectable*. That matters a lot for a tool that's poking at your money.

The stack: **Next.js + TypeScript**, **Chakra UI** (a light editorial theme — Fraunces + Hanken Grotesk), **Coral** for the SQL/joins, and **Claude (Opus 4.7)** for NL→SQL and summarization, with prompt caching on the schema system prompt.

---

## The query I'm proud of: single point of failure

Here's a question a dashboard would never answer well: *"Which missing document is blocking the most deadlines?"*

```sql
SELECT
  doc.name AS missing_document,
  COUNT(DISTINCT dl.id) AS deadlines_blocked,
  STRING_AGG(DISTINCT dl.title, ' | ') AS blocked_items,
  MIN(dl.due_at) AS earliest_due
FROM life_files.documents doc
JOIN life_files.manual_deadlines dl
  ON (doc.tags LIKE '%passport%' AND LOWER(dl.title) LIKE '%passport%')
  OR (doc.tags LIKE '%kyc%'  AND (LOWER(dl.title) LIKE '%kyc%' OR dl.category = 'kyc'))
  OR (doc.tags LIKE '%bank%' AND LOWER(dl.title) LIKE '%bank%')
WHERE doc.status = 'missing'
GROUP BY doc.name
ORDER BY deadlines_blocked DESC;
```

The answer:

> **`address_proof.pdf` blocks 2 deadlines — a single point of failure.**
> (Your passport appointment *and* your bank KYC both need it.)

One missing file, two missed deadlines, surfaced in a single row. That's an insight a join *produces* and a list of cards never will.

The other two flagship questions map to equally real joins:

| Question | Cross-source join | What it attaches |
|----------|-------------------|------------------|
| "Am I being double-charged?" | `transactions` ⋈ `gmail_messages` | the receipt email next to the duplicate charge |
| "What's costing me money this week?" | `manual_deadlines` ⋈ `gmail_messages` ⋈ `calendar_events` | the billing email *and* the calendar reminder |

For example, the duplicate-charge query joins your card transactions to the receipt email that explains them:

```sql
SELECT t.merchant, COUNT(*) AS charge_count, SUM(t.amount) AS total_amount,
       MAX(g.subject) AS receipt_evidence
FROM life_files.transactions t
LEFT JOIN life_files.gmail_messages g
  ON LOWER(g.subject) LIKE '%' || LOWER(t.merchant) || '%'
  OR LOWER(g.body_text) LIKE '%' || LOWER(t.merchant) || '%'
GROUP BY t.merchant
HAVING COUNT(*) >= 2;
```

→ *"Adobe charged 2× — $39.98 to review,"* with the matching `"Adobe payment receipt - $19.99"` email pulled in by the join. Three sources, one row, every number traceable to where it came from.

---

## The agent loop, in code

Question → SQL is a single Claude call, schema-grounded and cached:

```ts
const message = await client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 700,
  system: [{ type: "text", text: schemaForPrompt(), cache_control: { type: "ephemeral" } }],
  messages: [{ role: "user", content: `Question: ${question}\nWrite exactly one Coral SQL query.` }]
});
const sql = validateReadOnlySql(stripFences(textOf(message)));  // throws if unsafe
```

Then Coral runs it, and a second Claude call reads the *actual* rows and writes the human answer:

```ts
const rows = await runCoral(sql);                 // real cross-source join
const summary = await summarizeWithClaude(question, columns, rows);
// → { headline: "…", draft: { subject, body } }
```

This is what makes it an agent rather than a search box: it reasons over the results, not just the question.

---

## Keeping it safe — and unbreakable in a demo

Two engineering constraints shaped the build.

**1. The generated SQL is sandboxed.** Anything Claude writes is validated before it can reach Coral — single statement, `SELECT`/`WITH` only, allowed schema only, no DDL/DML:

```ts
if (trimmed.includes(";"))        return reject("Only a single statement is allowed.");
if (!/^(select|with)\b/i.test(trimmed)) return reject("Only SELECT/WITH is allowed.");
if (FORBIDDEN.test(trimmed))      return reject("Write/DDL keywords are not allowed.");
// every schema-qualified reference must be `life_files.*`
```

I unit-tested it against `DROP TABLE`, `UPDATE`, multi-statement injection, and a `secrets.users` reference — all rejected; legit `SELECT`/`WITH` over `life_files` allowed.

**2. The demo can never break.** Three layers of graceful degradation:

- The four headline questions ship with **hand-vetted join queries**, so the app works with **no API key at all** — Claude only powers free-text questions.
- If the Coral CLI isn't present (e.g. a serverless deploy), it **falls back to computing the same answers from the local JSONL** in TypeScript.
- The demo runs on **seeded, reproducible data** — a dedicated demo Google account and local sample files — so anyone can run it end-to-end without touching a personal inbox.

That's the difference between "works on my machine at 2am" and "works on stage."

---

## Things that broke (and what they taught me)

No build is clean. The honest log:

- **My SQL wasn't joining.** Covered above — the most important fix wasn't code, it was the thesis. Real joins (`documents ⋈ deadlines`, `transactions ⋈ gmail`) replaced TypeScript string-matching.
- **A `--` that wasn't a comment.** My query files start with `-- "What is costing me money this week?"`. Passing that to `coral sql "<query>"` made the CLI read the leading `--` as a *flag* and error out. The fix: the end-of-options separator — `coral sql --format json -- "$(cat query.sql)"`.
- **A 403 that wasn't an auth problem.** Publishing this very post failed with `HTTP 403`. The API key was valid — Dev.to sits behind Cloudflare, which blocks the default `Python-urllib` User-Agent. A one-line `User-Agent` header fixed it. Good reminder that 403 ≠ "bad credentials."
- **A half-installed `node_modules`.** An interrupted install left empty package folders that passed a stale incremental typecheck but failed a clean build. A clean `npm ci` was the real fix — and a lesson to never trust a cached green check.

---

## What's next: connecting real accounts

The plumbing to read a live account already exists — the `gmail` HTTP source spec plus read-only OAuth. The remaining work is the genuinely hard part:

1. **Generalized extraction.** The demo's risk rules know about "Notion," "Adobe," "passport." A real inbox needs to turn *arbitrary* emails into amounts, dates, and intents — a great fit for an LLM extraction step feeding the same Coral tables.
2. **A live transactions feed** (statement import or an aggregator) so duplicate detection runs on real spend.
3. **A live Calendar source spec**, mirroring the Gmail one.

But the core bet is already proven: **your life is queryable, and the join is where the insight lives.**

---

## Try it / takeaways

If you build on Coral, the lesson I'd pass on is simple: **don't just read from your sources — join them.** A list of records is a chore; a joined row is an insight ("this one missing file blocks two deadlines"). And if you put the generated SQL on screen, your agent earns trust instead of asking for it.

Life Risk Radar is built for the WeMakeDevs **Pirates of the Coral-bean** hackathon (Personal Agent track). Natural-language questions in, real cross-source SQL out, evidence and a drafted action every time. 🪸
