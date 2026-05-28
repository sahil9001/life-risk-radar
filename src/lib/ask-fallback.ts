import { loadLocalRows } from "@/lib/risk-model";
import type { AskRow } from "@/lib/ask";

// Mirrors the topic dimension in queries/ask/*.sql so the deployed app (which has
// no `coral` binary) can still answer the curated questions from seeded JSONL.
const TOPIC: Record<string, string> = {
  deadline_notion: "notion",
  deadline_amazon: "amazon",
  deadline_booking: "hotel",
  deadline_passport: "passport",
  deadline_kyc: "kyc",
  deadline_domain: "sahil.dev"
};

function includesAny(haystacks: Array<string | undefined>, needle: string): boolean {
  return haystacks.some((value) => (value ?? "").toLowerCase().includes(needle));
}

type LocalRows = Awaited<ReturnType<typeof loadLocalRows>>;

function moneyThisWeek(rows: LocalRows): AskRow[] {
  return rows.deadlines
    .filter((deadline) => deadline.amount_at_risk > 0)
    .map((deadline) => {
      const kw = TOPIC[deadline.id] ?? deadline.title.toLowerCase();
      const email = rows.gmail.find((message) => includesAny([message.subject, message.body_text, message.from_domain], kw));
      const event = rows.calendar.find((calendarEvent) => includesAny([calendarEvent.title, calendarEvent.description], kw));
      return {
        title: deadline.title,
        due_at: deadline.due_at,
        amount_at_risk: deadline.amount_at_risk,
        currency: deadline.currency,
        email_evidence: email?.subject ?? null,
        calendar_evidence: event?.title ?? null
      };
    })
    .sort((a, b) => String(a.due_at).localeCompare(String(b.due_at)));
}

function duplicateCharges(rows: LocalRows): AskRow[] {
  const grouped = new Map<string, { count: number; total: number; currency: string }>();
  for (const transaction of rows.transactions) {
    const key = transaction.merchant;
    const existing = grouped.get(key) ?? { count: 0, total: 0, currency: transaction.currency };
    grouped.set(key, { count: existing.count + 1, total: existing.total + transaction.amount, currency: transaction.currency });
  }
  return Array.from(grouped.entries())
    .filter(([, value]) => value.count >= 2)
    .map(([merchant, value]) => {
      const receipt = rows.gmail.find((message) => includesAny([message.subject, message.body_text], merchant.toLowerCase()));
      return {
        merchant,
        charge_count: value.count,
        total_amount: Number(value.total.toFixed(2)),
        currency: value.currency,
        receipt_evidence: receipt?.subject ?? null
      };
    })
    .sort((a, b) => Number(b.total_amount) - Number(a.total_amount));
}

function blockingDocuments(rows: LocalRows): AskRow[] {
  return rows.documents
    .filter((document) => document.status === "missing")
    .map((document) => {
      const tags = document.tags.toLowerCase();
      const blocked = rows.deadlines.filter((deadline) => {
        const title = deadline.title.toLowerCase();
        return (
          (tags.includes("passport") && title.includes("passport")) ||
          (tags.includes("kyc") && (title.includes("kyc") || deadline.category === "kyc")) ||
          (tags.includes("bank") && title.includes("bank"))
        );
      });
      const earliest = blocked.map((deadline) => deadline.due_at).sort()[0] ?? null;
      return {
        missing_document: document.name,
        deadlines_blocked: blocked.length,
        blocked_items: blocked.map((deadline) => deadline.title).join(" | "),
        earliest_due: earliest
      };
    })
    .filter((row) => Number(row.deadlines_blocked) > 0)
    .sort((a, b) => Number(b.deadlines_blocked) - Number(a.deadlines_blocked));
}

function renewals(rows: LocalRows): AskRow[] {
  return rows.deadlines
    .filter((deadline) => deadline.category === "renewal")
    .map((deadline) => {
      const kw = TOPIC[deadline.id] ?? deadline.title.toLowerCase();
      const email = rows.gmail.find((message) => includesAny([message.subject, message.body_text], kw));
      return {
        title: deadline.title,
        due_at: deadline.due_at,
        amount_at_risk: deadline.amount_at_risk,
        currency: deadline.currency,
        billing_email: email?.subject ?? null
      };
    })
    .sort((a, b) => String(a.due_at).localeCompare(String(b.due_at)));
}

const COMPUTERS: Record<string, (rows: LocalRows) => AskRow[]> = {
  "money-this-week": moneyThisWeek,
  "duplicate-charges": duplicateCharges,
  "blocking-documents": blockingDocuments,
  renewals
};

/** Compute a template's answer rows directly from seeded JSONL when Coral is unavailable. */
export async function fallbackRows(templateId: string): Promise<AskRow[]> {
  const compute = COMPUTERS[templateId];
  if (!compute) return [];
  const rows = await loadLocalRows();
  return compute(rows);
}
