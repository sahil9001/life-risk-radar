# Life Risk Radar

Life Risk Radar is a Coral-powered personal agent dashboard for the WeMakeDevs Coral hackathon personal track.

It finds the money and deadline risks hidden across your inbox, calendar, and local files:

- trials about to renew
- refund windows closing
- duplicate charges
- cancellation deadlines
- appointments blocked by missing documents
- KYC or account-access deadlines

The demo uses a dedicated seeded Google account plus local sample JSONL files, so it runs end-to-end and reproducibly: Coral queries the sources and joins them with SQL.

## Demo Pitch

> "Here are the personal admin risks that can cost me money, time, or access this week, with evidence."

This is not a todo app. The user does not manually create tasks. The agent finds risks from existing records and explains the evidence behind each recommendation.

## Ask Your Life (natural-language → Coral SQL)

The headline interaction: ask a plain-English question and the agent answers it with a
**real cross-source Coral SQL join**, showing the exact query it ran plus a drafted action.

- "What is costing me money this week?" → joins `manual_deadlines` × `gmail_messages` × `calendar_events`
- "Am I being double-charged anywhere?" → joins `transactions` × `gmail_messages`
- "Which missing document is blocking the most deadlines?" → joins `documents` × `manual_deadlines` (single point of failure)
- "What subscriptions or trials are about to renew?" → joins `manual_deadlines` × `gmail_messages`

The four vetted queries live in `queries/ask/*.sql` and can be run directly:

```bash
coral sql --format json -- "$(cat queries/ask/blocking-documents.sql)"
```

**Free-form questions** (anything beyond the four suggestions) are translated to Coral SQL
by Claude when `ANTHROPIC_API_KEY` is set:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Every Claude-generated query is passed through a read-only allowlist
(`validateReadOnlySql` in `src/lib/ask.ts`) — only single `SELECT`/`WITH` statements over
the `life_files` schema can execute. Without a key, the four curated questions still work
fully, so the demo never breaks.

> Coral also ships an MCP server (`coral mcp-stdio`) if you prefer to wire Claude Desktop
> directly to Coral as a tool; this app uses the `coral sql` CLI path for portability.

## Tech Stack

- Next.js + TypeScript
- Coral SQL over source specs
- Custom Gmail source spec scaffold
- JSONL-backed source for reproducible demo data
- Seed script for Gmail, Calendar, and local sample files

## Quick Start

Install dependencies:

```bash
npm install
```

Generate local seeded JSONL files:

```bash
npm run seed:local
```

Run the dashboard:

```bash
npm run dev
```

Open `http://localhost:3000` and click **Scan Risks**.

If Coral is not installed or sources are not added yet, the app falls back to the same seeded local data so the UI remains demoable.

## Seed A Fresh Google Demo Account

Use this only with a fresh demo account, not your personal Gmail.

1. Create a Google account such as `liferisk.demo@gmail.com`.
2. Create a Google Cloud project.
3. Enable Gmail API and Google Calendar API.
4. Create an OAuth Desktop client.
5. Save the file as `credentials/google-oauth.json`.
6. Run:

```bash
DEMO_GOOGLE_EMAIL=liferisk.demo@gmail.com npm run seed:demo
```

The script will:

- write local JSONL files under `sample-data/`
- insert synthetic Gmail messages
- create synthetic Google Calendar events

Credentials and tokens under `credentials/*.json` are ignored by git.

## Coral Setup

Install Coral first:

```bash
brew install withcoral/tap/coral
```

Add the reproducible JSONL demo source:

```bash
coral source lint sources/life_files/manifest.yaml
coral source add --file sources/life_files/manifest.yaml
coral source test life_files
```

Run the headline query:

```bash
coral sql --format json "$(cat queries/life-risk-radar.sql)"
```

The app's `/api/scan` route also tries to run this Coral query. If it fails, it uses the same sample files directly.

## Gmail Source Spec

The repo includes `sources/gmail/manifest.yaml` as the custom source-spec path for the hackathon bounty.

The first version exposes:

- `gmail.message_search`
- `gmail.message_details`

Use a fresh demo account access token:

```bash
GMAIL_ACCESS_TOKEN="<token>" coral source lint sources/gmail/manifest.yaml
GMAIL_ACCESS_TOKEN="<token>" coral source add --file sources/gmail/manifest.yaml
coral source test gmail
```

The reliable end-to-end dashboard demo uses `life_files.gmail_messages`, a JSONL mirror of the seeded Gmail messages, so judges can reproduce it without needing your OAuth token.

## Seeded Scenarios

The demo guarantees these risk cards:

- Notion trial renewal: avoid `$96/year`
- Amazon return window: recover `$129`
- Duplicate Adobe charge: review two `$19.99` charges
- Hotel cancellation: avoid `$280` fee
- Passport appointment: missing address proof
- Bank KYC: avoid account restriction
- Domain renewal: decide whether to renew `sahil.dev`

## Demo Script

1. Say: "This uses a fresh seeded Google account, not my personal data."
2. Show source badges: Gmail, Calendar, Files, Coral.
3. Click **Scan Risks**.
4. Show total money at risk and urgent risks.
5. Open duplicate Adobe charge evidence.
6. Open hotel cancellation deadline evidence.
7. Open passport missing-document evidence.
8. Show the Daily Brief and Coral SQL query file.
9. Close with: "Coral lets the agent join email, calendar, and local files without building an ETL pipeline."

## Verification

```bash
npm run typecheck
npm run build
npm run seed:local
```

Optional when Coral is installed:

```bash
coral source lint sources/life_files/manifest.yaml
coral source add --file sources/life_files/manifest.yaml
coral source test life_files
coral sql --format json "$(cat queries/life-risk-radar.sql)"
```
