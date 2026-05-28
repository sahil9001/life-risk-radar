# Life Risk Radar — Submission

**Tagline:** *Ask your life. Coral joins your inbox, calendar & money with SQL — and answers with the evidence.*

**Track:** WeMakeDevs *Pirates of the Coral-bean* — Personal Agent
**Built with:** Coral · Claude (Opus 4.7) · Next.js · TypeScript · Chakra UI

**Links**
- 🔗 GitHub: `<add repo URL>`
- 🌐 Live demo: `<add deployed URL>`
- ▶️ Demo video (≤3 min): `<add YouTube URL>`

---

## The problem

Money, time, and access leak through the cracks of everyday admin — and they leak *silently*:

- a free trial that auto-renews tomorrow,
- an Amazon return window quietly closing,
- a duplicate subscription charge nobody noticed,
- a hotel free-cancellation deadline that locks in a fee,
- an appointment you'll fail because a document is missing,
- a bank KYC deadline that could freeze your account.

Here's the insight that started the project: **the evidence for every one of these is already in your accounts.** The renewal email is in Gmail. The charge is on your statement. The appointment is on your Calendar. The missing file is in your documents.

The problem was never a lack of data. **The problem is that nobody joins it.** Your email doesn't know about your transactions; your calendar doesn't know which document you're missing. Each source is an island, and the risk lives in the gaps *between* them.

## The solution: Ask your life

**Life Risk Radar** is a personal agent you query in plain English. Ask a question and it:

1. turns your question into a **Coral SQL query**,
2. runs a **real cross-source join** over your inbox, calendar, and transactions,
3. answers with a one-line verdict, the supporting **evidence**, **the exact SQL it ran**, and a **ready-to-send drafted action**.

Two modes, by design:

- **Ask (the hero):** type anything — *"what can I get refunded and by when?"*, *"where am I wasting money on subscriptions?"* — and Claude writes the SQL live.
- **Scan (the fallback):** one click sweeps every source and ranks the risks into a board, each opening a step-by-step "close this risk" action plan.

Showing the generated SQL is deliberate. When you can see the query and the joined evidence, the agent stops feeling like magic and becomes **inspectable** — which matters a lot for a tool poking at your money.

## How we used Coral

Coral is the core, not a side feature. It turns "query an API / a file / a calendar" into plain SQL and — crucially — lets the agent **join across those sources** as if they were one database.

- **Two sources, zero ETL:** a `life_files` JSONL source (transactions, documents, deadlines, calendar events, Gmail mirror) and a real `gmail` HTTP source spec (read-only Gmail API). Registering them is two commands (`coral source add` / `coral source test`).
- **Genuine cross-source joins** power every answer, for example:
  - `transactions ⋈ gmail_messages` — match a duplicate charge to its receipt email.
  - `documents ⋈ manual_deadlines` — find the **single point of failure**: one missing `address_proof.pdf` blocking *both* a passport appointment and a bank KYC deadline.
  - `manual_deadlines ⋈ gmail_messages ⋈ calendar_events` — a deadline with its billing email *and* its calendar reminder, in one row.
- **An LLM→SQL agent loop:** Claude reads the schema, writes one Coral query, we validate it, Coral runs it, then Claude reads the *actual rows* and writes the human answer. Coral also ships an MCP server (`coral mcp-stdio`) for wiring it straight into an agent as a tool.
- **Safety:** every Claude-generated query passes a read-only allowlist (single `SELECT`/`WITH`, `life_files` schema only, no DDL/DML) before it can run.

The "single point of failure" insight is the clearest example of *why* Coral matters: it's an answer a list of cards can never give you, and a join produces in one query.

## Impact

Life Risk Radar surfaces, with evidence, exactly the admin risks that quietly cost people money, time, or access — and turns each into a one-click action. It's not a todo app: the user never enters tasks. The agent reads what's already there and explains itself, every number traceable to the email, charge, or event it came from.

## Aesthetics & UX

A light, editorial interface (Fraunces + Hanken Grotesk), an ask-first layout, animated source flow, and a transparent "Coral SQL" panel on every answer. The risk board opens a per-risk action plan with a progress checklist. Nothing is a generic dashboard — the answer and its query are the stars.

## Challenges we ran into

- **My SQL wasn't actually joining.** The first build declared CTEs for five sources and joined none of them — the "cross-source" work was happening in TypeScript. Realizing that reframed the whole project around real Coral joins.
- **A `--` that wasn't a comment.** Queries beginning with a `--` SQL comment made the CLI parse it as a flag; the fix was the `--` end-of-options separator.
- **Read-only guardrails that were too strict.** The SQL allowlist initially rejected the legit read-only `REPLACE()` function and treated table aliases as schemas — both fixed so Claude's valid queries run while writes/DDL stay blocked.
- **Truncated generations.** A low token cap cut Claude's elaborate queries mid-statement; raising it (and nudging toward concise standard SQL) fixed execution.

## What we learned

Don't just *read* from your sources — **join** them. A list of records is a chore; a joined row is an insight. And if you put the generated SQL on screen, your agent earns trust instead of asking for it.

## What's next: connecting real accounts

The plumbing to read a live account already exists — the `gmail` HTTP source spec plus read-only OAuth. The remaining work is the genuinely hard part: **generalized extraction** (turning arbitrary emails into amounts, dates, and intents), a **live transactions feed**, and a **live Calendar source spec**. The core bet is already proven: your life is queryable, and the join is where the insight lives.
