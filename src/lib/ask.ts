import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AskColumn, AskRow, SourceBadge } from "@/lib/types";

export type { AskAnswer, AskColumn, AskRow } from "@/lib/types";

export type AskTemplate = {
  id: string;
  /** Keywords used to route a free-text question to this template when Claude is unavailable. */
  match: string[];
  sources: SourceBadge[];
  columns: AskColumn[];
  summarize: (rows: AskRow[]) => string;
  draft: (rows: AskRow[]) => { subject: string; body: string };
};

const ALLOWED_SCHEMA = "life_files";

const ALLOWED_TABLES = [
  "life_files.transactions",
  "life_files.documents",
  "life_files.manual_deadlines",
  "life_files.calendar_events",
  "life_files.gmail_messages"
] as const;

function money(value: string | number | null): string {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!amount || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: amount % 1 === 0 ? 0 : 2 }).format(amount);
}

function totalMoney(rows: AskRow[], key: string): number {
  return rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
}

export const askTemplates: AskTemplate[] = [
  {
    id: "money-this-week",
    match: ["money", "cost", "spend", "week", "pay", "due", "deadline"],
    sources: ["gmail", "calendar", "files", "coral"],
    columns: [
      { key: "title", label: "Item" },
      { key: "due_at", label: "Due", kind: "date" },
      { key: "amount_at_risk", label: "At risk", kind: "money" },
      { key: "email_evidence", label: "Email evidence" },
      { key: "calendar_evidence", label: "Calendar evidence" }
    ],
    summarize: (rows) => `${money(totalMoney(rows, "amount_at_risk"))} across ${rows.length} deadline${rows.length === 1 ? "" : "s"} this week`,
    draft: (rows) => ({
      subject: "My money-at-risk plan this week",
      body: [
        "This week I need to act on:",
        ...rows.map((r) => `• ${r.title} — ${money(r.amount_at_risk)} (due ${String(r.due_at ?? "soon").slice(0, 10)})`),
        "",
        `Total exposure: ${money(totalMoney(rows, "amount_at_risk"))}.`
      ].join("\n")
    })
  },
  {
    id: "duplicate-charges",
    match: ["double", "duplicate", "twice", "charge", "charged", "billed"],
    sources: ["files", "gmail", "coral"],
    columns: [
      { key: "merchant", label: "Merchant" },
      { key: "charge_count", label: "Charges", kind: "number" },
      { key: "total_amount", label: "Total", kind: "money" },
      { key: "receipt_evidence", label: "Receipt evidence" }
    ],
    summarize: (rows) =>
      rows.length
        ? `${rows.map((r) => `${r.merchant} charged ${r.charge_count}×`).join(", ")} — ${money(totalMoney(rows, "total_amount"))} to review`
        : "No duplicate charges detected",
    draft: (rows) => ({
      subject: "Possible duplicate charge — request review",
      body: [
        "Hello,",
        "",
        ...rows.map(
          (r) =>
            `I was charged ${r.charge_count} times by ${r.merchant} totaling ${money(r.total_amount)} within a short window. Please review and reverse any duplicate.`
        ),
        "",
        "Thank you."
      ].join("\n")
    })
  },
  {
    id: "blocking-documents",
    match: ["document", "missing", "blocking", "blocked", "appointment", "paperwork", "failure"],
    sources: ["files", "coral"],
    columns: [
      { key: "missing_document", label: "Missing document" },
      { key: "deadlines_blocked", label: "Blocks", kind: "number" },
      { key: "blocked_items", label: "What it blocks" },
      { key: "earliest_due", label: "Earliest due", kind: "date" }
    ],
    summarize: (rows) =>
      rows.length
        ? `${rows[0].missing_document} blocks ${rows[0].deadlines_blocked} deadlines — a single point of failure`
        : "No missing documents are blocking deadlines",
    draft: (rows) => ({
      subject: "Get the blocking document sorted",
      body: rows.length
        ? [
            `Priority: locate / obtain ${rows[0].missing_document}.`,
            `It currently blocks: ${rows[0].blocked_items}.`,
            `Earliest deadline affected: ${String(rows[0].earliest_due ?? "").slice(0, 10)}.`
          ].join("\n")
        : "No blocking documents right now."
    })
  },
  {
    id: "renewals",
    match: ["subscription", "subscriptions", "trial", "trials", "renew", "renewal", "cancel"],
    sources: ["gmail", "files", "coral"],
    columns: [
      { key: "title", label: "Renewal" },
      { key: "due_at", label: "Renews", kind: "date" },
      { key: "amount_at_risk", label: "Amount", kind: "money" },
      { key: "billing_email", label: "Billing email" }
    ],
    summarize: (rows) => `${rows.length} renewal${rows.length === 1 ? "" : "s"} worth ${money(totalMoney(rows, "amount_at_risk"))} approaching`,
    draft: (rows) => ({
      subject: "Renewal decisions",
      body: rows.map((r) => `• ${r.title}: ${money(r.amount_at_risk)} on ${String(r.due_at ?? "").slice(0, 10)} — keep or cancel?`).join("\n")
    })
  }
];

export function getTemplate(id: string): AskTemplate | undefined {
  return askTemplates.find((template) => template.id === id);
}

/** Route a free-text question to the best template by keyword overlap. */
export function matchTemplate(question: string): AskTemplate | undefined {
  const text = question.toLowerCase();
  let best: { template: AskTemplate; score: number } | undefined;
  for (const template of askTemplates) {
    const score = template.match.reduce((acc, keyword) => (text.includes(keyword) ? acc + 1 : acc), 0);
    if (score > 0 && (!best || score > best.score)) best = { template, score };
  }
  return best?.template;
}

export async function loadTemplateSql(id: string): Promise<string> {
  const sqlPath = path.join(process.cwd(), "queries", "ask", `${id}.sql`);
  return readFile(sqlPath, "utf8");
}

// Statement keywords that can never appear in a legitimate read-only query.
// (Read-only string functions like REPLACE() are intentionally NOT listed.)
const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|attach|copy|grant|revoke|truncate|merge|pragma)\b/i;

/**
 * Defense-in-depth validation for any SQL we did not author (i.e. Claude output).
 * Only single read-only SELECT/CTE statements over the life_files schema are allowed.
 */
export function validateReadOnlySql(sql: string): { ok: true; sql: string } | { ok: false; reason: string } {
  const withoutComments = sql.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
  const trimmed = withoutComments.trim().replace(/;\s*$/, "");
  // Scrub single-quoted string literals so data values can't trip the keyword/structure checks.
  const scrubbed = trimmed.replace(/'(?:[^']|'')*'/g, "''");

  if (!trimmed) return { ok: false, reason: "Empty query." };
  if (scrubbed.includes(";")) return { ok: false, reason: "Only a single statement is allowed." };
  if (!/^(select|with)\b/i.test(scrubbed)) return { ok: false, reason: "Only SELECT/WITH queries are allowed." };
  if (FORBIDDEN.test(scrubbed)) return { ok: false, reason: "Write or DDL keywords are not allowed." };

  // Only schema-qualified TABLE references (after FROM/JOIN) must target the allowed schema.
  // Column refs like `d.title` use table aliases, not schemas, so they're ignored.
  const tableRefs = scrubbed.match(/\b(?:from|join)\s+([a-z_][\w]*(?:\.[a-z_][\w]*)?)/gi) ?? [];
  for (const ref of tableRefs) {
    const target = ref.replace(/\b(?:from|join)\s+/i, "");
    if (target.includes(".") && target.split(".")[0].toLowerCase() !== ALLOWED_SCHEMA) {
      return { ok: false, reason: `Only the ${ALLOWED_SCHEMA} schema is queryable (saw ${target}).` };
    }
  }
  return { ok: true, sql: trimmed };
}

export function schemaForPrompt(): string {
  return [
    "You write read-only DuckDB/DataFusion SQL for Coral over a single schema `life_files`.",
    "Only SELECT/WITH queries. Never write, never reference other schemas. Tables and columns:",
    "- life_files.transactions(id, posted_at, merchant, amount, currency, category, raw_description)",
    "- life_files.documents(id, name, type, status, tags, updated_at)  -- tags is a comma-joined string; status can be 'missing'",
    "- life_files.manual_deadlines(id, title, due_at, amount_at_risk, currency, category)  -- category in renewal|refund|bill|document|duplicate_charge|cancellation|kyc",
    "- life_files.calendar_events(id, title, description, start_time, end_time)",
    "- life_files.gmail_messages(id, thread_id, subject, from_email, from_domain, snippet, body_text, received_at, labels)",
    "Prefer cross-source JOINs that attach evidence (e.g. join transactions to gmail_messages on merchant).",
    "Today is 2026-05-27. Return only the SQL, no prose, no markdown fences."
  ].join("\n");
}

export const ALLOWED_TABLE_LIST = ALLOWED_TABLES;
