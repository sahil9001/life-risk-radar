# 🪸 Life Risk Radar

Life Risk Radar is a Coral-powered personal agent dashboard built for the **WeMakeDevs Coral Hackathon (Personal Track)**. 

It acts as an automated risk intelligence system that scans your inbox, calendar, and local transaction or document logs to uncover hidden financial liabilities, renewal traps, and scheduling bottlenecks before they cost you time or money.

---

## 🧭 The Core Challenge: Cloud vs. Local-First Agents (The Problem)

During development and deployment, a fundamental architectural conflict arises: **Why can't we run the Coral CLI directly on a standard cloud backend like Render?**

Running a local-first agent engine like Coral in a stateless, cloud-hosted container fails due to several constraints:

1. **Stateless Sandbox Environments**: Services like Render run your application in ephemeral Linux containers (such as Alpine, Debian, or Ubuntu-based Node buildpacks). These containers do not have package managers like macOS Homebrew pre-installed, nor do they support running local OS-specific compiler tools or binaries out-of-the-box.
2. **File & Data Isolation**: Coral is designed to act as a *local agent*—meaning it queries database files, transaction logs, private documents, and files stored natively on your developer machine or personal drive. A cloud instance is completely isolated from your local file system, making direct local joins impossible.
3. **Interactive Authentication & Portability**: Connecting Coral to live sources like Gmail or Google Calendar requires local credentials, configuration paths (`~/.coral`), and interactive OAuth login redirection prompts (which require a local web browser to complete). Headless, remote servers cannot run these interactive loops seamlessly.
4. **Data Security & Privacy**: Storing personal email OAuth tokens, calendar access scopes, and private financial logs on a public cloud server exposes highly sensitive user data, defeating the privacy benefits of running a local-first personal agent.

---

## 💡 The Architecture: Dual-Mode Hybrid Execution (The Solution)

To solve these cloud limitations while keeping the application **100% demoable, interactive, and functional in production**, we built a **Dual-Mode Hybrid Engine** in Next.js:

```
                  ┌──────────────────────────────────────────────┐
                  │              Life Risk Radar UI              │
                  └──────────────────────┬───────────────────────┘
                                         │
                        Queries /api/scan & /api/ask
                                         │
                                         ▼
                        Is Coral CLI installed locally?
                         /                       \
                      YES                         NO
                      /                             \
     ┌───────────────────────────────┐     ┌───────────────────────────────┐
     │          LOCAL MODE           │     │          CLOUD MODE           │
     │      (Real Personal Agent)    │     │      (High-Fidelity Demo)     │
     ├───────────────────────────────┤     ├───────────────────────────────┤
     │ • Runs `coral sql` CLI commands│     │ • Catches execution errors    │
     │ • Queries real local tables   │     │ • Queries local JSONL files   │
     │ • Integrates live Gmail/Cal   │     │ • Simulates SQL schemas       │
     │ • Preserves user data privacy │     │ • 100% Render/Cloud ready     │
     └───────────────────────────────┘     └───────────────────────────────┘
```

| Feature | Local Mode (True Agent) | Cloud Mode (Render/Cloud Demo) |
| :--- | :--- | :--- |
| **CLI Engine** | Real `coral` SQL command runner | Catches errors & uses Next.js Fallback engine |
| **Data Source** | Live Gmail/Calendar + local SQLite/JSONL | High-fidelity seed JSONL schemas under `sample-data/` |
| **Authentication** | Safe local OAuth secrets | No OAuth secrets required on the cloud |
| **Natural Language Queries** | Real-time Claude translation + Coral SQL execution | Claude SQL translation with mock dataset schema joins |
| **UI Indicator** | Displays `🪸 Coral Live` | Displays `🪸 Coral Live` (simulated schemas) |

This dual-mode design ensures that judges and web visitors can open the live Render URL and test every single dashboard interaction, bento metric, and free-form search query without installing anything, while developers can run the exact same dashboard locally connected to their real files.

---

## 🚀 Cloud Mode Deployment (Render Quick Start)

Deploy this project to Render in under 5 minutes without dealing with CLI installation issues:

1. **Push the Code to GitHub**: Create a repository (e.g., `life-risk-radar`) and push your codebase. Make sure `credentials/` and `.env.local` are ignored (handled automatically by our `.gitignore`).
2. **Create a Render Web Service**:
   - Connect your GitHub repository to Render.
   - **Environment**: Select `Node`.
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Start Command**: `npm run start`
3. **Environment Variables**: Add these key-value pairs in the Render dashboard:
   - `NODE_VERSION` = `24.14.1` (or matching your Node environment)
   - `CORAL_CONFIG_DIR` = `./.coral-config`
   - `PORT` = `3000`
   - `ANTHROPIC_API_KEY` = `your-api-key-here` *(optional; required to translate custom, typed questions to Coral SQL)*

Once Render builds the Next.js bundle, the API routes (`/api/scan` and `/api/ask`) will detect that the `coral` CLI is absent in Render's container, automatically routing queries to the high-fidelity mock JSONL tables. The UI will show the mock-data joins and work flawlessly.

---

## 💻 Local Mode Setup (Full Personal Agent)

To run the application locally as a real personal agent querying live/seeded data with the real Coral CLI:

### 1. Prerequisites
Install the dependencies and seed the local datasets:
```bash
# Install dependencies
npm install

# Generate high-fidelity local JSONL mirrors
npm run seed:local
```

### 2. Install & Configure Coral CLI
1. Install Coral using Homebrew:
   ```bash
   brew install withcoral/tap/coral
   ```
2. Lint and add the JSONL schema manifest:
   ```bash
   coral source lint sources/life_files/manifest.yaml
   coral source add --file sources/life_files/manifest.yaml
   coral source test life_files
   ```
3. Test that the CLI is running queries locally:
   ```bash
   coral sql --format json "$(cat queries/life-risk-radar.sql)"
   ```

### 3. Run the App Locally
Start the Next.js development server:
```bash
npm run dev
```
Open `http://localhost:3000` and click **Scan Risks**. The dashboard will query your local files using the real `coral` CLI!

---

## 🔑 Seeding a Fresh Google Demo Account (Optional)

If you want to test the custom Gmail source spec with real Google APIs instead of local mirrors, set up a sandboxed Google Account:

1. Create a fresh Google account (e.g., `liferisk.demo@gmail.com`).
2. Create a Google Cloud Project and enable both the **Gmail API** and **Google Calendar API**.
3. Create an OAuth Desktop Client credential, download the credentials file, and save it under `credentials/google-oauth.json` (do not commit this).
4. Run the seed script:
   ```bash
   DEMO_GOOGLE_EMAIL=liferisk.demo@gmail.com npm run seed:demo
   ```
   This script authenticates, updates local JSONL tables, and pushes synthetic Google Calendar events and Gmail messages directly into the cloud account.

---

## 🔮 Ask Your Life (Natural-Language → Coral SQL)

The headline feature of the dashboard is the interactive search console. Users can enter free-text questions which are translated to Coral SQL joins.

- **Suggested Commands**: Four deterministic, curated queries are provided at the top of the interface:
  - *"What is costing me money this week?"* → joins `manual_deadlines` × `gmail_messages` × `calendar_events`
  - *"Am I being double-charged anywhere?"* → joins `transactions` × `gmail_messages`
  - *"Which missing document is blocking the most deadlines?"* → joins `documents` × `manual_deadlines` (single points of failure)
  - *"What subscriptions or trials are about to renew?"* → joins `manual_deadlines` × `gmail_messages`
- **Claude Integration**: If `ANTHROPIC_API_KEY` is provided, custom questions are translated to structured Coral SQL schemas by Claude.
- **SQL Security Guardrail**: Every Claude-generated query is passed through a read-only validator (`validateReadOnlySql` in `src/lib/ask.ts`) ensuring only `SELECT`/`WITH` statements over authorized `life_files` tables can be executed.

---

## 🎭 Seeded Hackathon Scenarios

To make the application instantly evaluable for judges, the local seeds contain the following high-priority personal risk scenarios:
* **Adobe Double Charge**: Two `$19.99` transactions appeared in the same billing period, flagged by joining card records with Gmail receipt confirmation.
* **Notion Subscription Renewal**: Alerting the user to cancel or review a `$96/year` Notion plan.
* **Amazon Refund Closure**: Flagging an expiring item return window to recover `$129`.
* **Trip Cancellation Window**: Warning about a `$280` hotel fee that will lock in if not canceled within 24 hours.
* **Passport Access Document Block**: Passport renewal appointment is scheduled, but the database highlights that the required proof of address is missing.
* **Bank KYC Compliance**: Warning of account access restrictions due to an upcoming bank KYC deadline.

---

## 🎬 Hackathon Demo Script
1. **Introduction**: *"This dashboard uses Coral to scan personal files, transaction records, emails, and calendar events to highlight critical risks that cost you money or access."*
2. **Showcase Connected Sources**: Point out the dashboard source badges (Gmail, Calendar, Files, Coral).
3. **Execute Scan**: Click **Scan Risks** to trigger the background Coral query or fallback engine.
4. **Present Key Insights**: Review the bento grids (e.g. *Adobe Duplicate Charge*, *Hotel Cancellation Deadline*) and explain how Coral joined multiple logs to build the evidence timeline.
5. **Interactive terminal**: Click *"Am I being double-charged anywhere?"* to display the real SQL code block generated to solve the problem and show the drafted support email output.
