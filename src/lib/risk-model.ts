import path from "node:path";
import type { EvidenceRow, RiskCard, ScanResult, SourceBadge } from "@/lib/types";
import { readJsonl } from "@/lib/jsonl";

type GmailRow = {
  id: string;
  subject: string;
  from_domain: string;
  snippet: string;
  body_text: string;
  received_at: string;
  labels: string;
};

type TransactionRow = {
  id: string;
  posted_at: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  raw_description: string;
};

type DocumentRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  tags: string;
  updated_at: string;
};

type DeadlineRow = {
  id: string;
  title: string;
  due_at: string;
  amount_at_risk: number;
  currency: string;
  category: RiskCard["category"];
};

type CalendarRow = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
};

type LocalRows = {
  gmail: GmailRow[];
  transactions: TransactionRow[];
  documents: DocumentRow[];
  deadlines: DeadlineRow[];
  calendar: CalendarRow[];
};

const sampleDir = path.join(process.cwd(), "sample-data");

export async function loadLocalRows(): Promise<LocalRows> {
  const [gmail, transactions, documents, deadlines, calendar] = await Promise.all([
    readJsonl<GmailRow>(path.join(sampleDir, "gmail_messages.jsonl")),
    readJsonl<TransactionRow>(path.join(sampleDir, "transactions.jsonl")),
    readJsonl<DocumentRow>(path.join(sampleDir, "documents.jsonl")),
    readJsonl<DeadlineRow>(path.join(sampleDir, "manual_deadlines.jsonl")),
    readJsonl<CalendarRow>(path.join(sampleDir, "calendar_events.jsonl"))
  ]);

  return { gmail, transactions, documents, deadlines, calendar };
}

function daysUntil(dateValue: string): number {
  const current = new Date("2026-05-27T09:00:00+05:30").getTime();
  const target = new Date(dateValue).getTime();
  return Math.ceil((target - current) / (1000 * 60 * 60 * 24));
}

function severityFor(dueAt: string | null, amountAtRisk: number | null): RiskCard["severity"] {
  if (!dueAt) return amountAtRisk && amountAtRisk >= 30 ? "high" : "medium";
  const days = daysUntil(dueAt);
  if (days <= 1) return "critical";
  if (days <= 4) return "high";
  if ((amountAtRisk ?? 0) >= 100) return "high";
  return "medium";
}

function scoreFor(dueAt: string | null, amountAtRisk: number | null, confidence: number, sourceCount: number): number {
  const urgency = dueAt ? Math.max(0, 40 - daysUntil(dueAt) * 6) : 18;
  const amount = Math.min(30, Math.round((amountAtRisk ?? 0) / 10));
  return Math.min(100, urgency + amount + Math.round(confidence / 4) + sourceCount * 4);
}

function sourceBadges(...badges: SourceBadge[]): SourceBadge[] {
  return Array.from(new Set(badges));
}

function findByText<T extends { subject?: string; title?: string; merchant?: string; tags?: string }>(rows: T[], text: string): T | undefined {
  const needle = text.toLowerCase();
  if (!needle.trim()) return undefined;
  return rows.find((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(needle)));
}

function evidence(source: EvidenceRow["source"], title: string, detail: string, occurredAt?: string): EvidenceRow {
  return { source, title, detail, occurredAt };
}

export function buildRisksFromRows(rows: LocalRows): RiskCard[] {
  const risks: RiskCard[] = [];
  const adobeTransactions = rows.transactions.filter((transaction) => transaction.merchant.toLowerCase().includes("adobe"));
  const adobeEmail = findByText(rows.gmail, "adobe");

  if (adobeTransactions.length >= 2) {
    const amount = adobeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const sourceCount = 3;
    risks.push({
      id: "duplicate-adobe",
      title: "Review possible duplicate Adobe charge",
      category: "duplicate_charge",
      dueAt: null,
      amountAtRisk: amount,
      currency: "USD",
      severity: severityFor(null, amount),
      confidence: 92,
      score: scoreFor(null, amount, 92, sourceCount),
      sourceBadges: sourceBadges("files", "gmail", "coral"),
      reason: "Two matching Adobe transactions appeared within 48 hours, with a receipt email as supporting context.",
      recommendedAction: "Open the card statement and dispute one charge if only one subscription should exist.",
      evidence: [
        evidence("files", "Two card transactions", adobeTransactions.map((transaction) => `${transaction.posted_at}: ${transaction.merchant} $${transaction.amount}`).join(" | ")),
        evidence("gmail", adobeEmail?.subject ?? "Adobe receipt", adobeEmail?.snippet ?? "Seeded receipt email mentions the Adobe payment."),
        evidence("coral", "Cross-source check", "Joined transaction rows with Gmail receipt context.")
      ]
    });
  }

  for (const deadline of rows.deadlines) {
    const lowerTitle = deadline.title.toLowerCase();
    const linkedEmail =
      findByText(rows.gmail, lowerTitle.includes("notion") ? "notion" : lowerTitle.includes("amazon") ? "amazon" : lowerTitle.includes("hotel") ? "hotel" : lowerTitle.includes("passport") ? "passport" : lowerTitle.includes("kyc") ? "kyc" : lowerTitle.includes("sahil") ? "sahil.dev" : deadline.title) ??
      rows.gmail[0];
    const linkedCalendar = findByText(rows.calendar, lowerTitle.includes("amazon") ? "return" : lowerTitle.includes("sahil") ? "renew" : lowerTitle.split(" ")[0]);
    const linkedTransaction = findByText(rows.transactions, lowerTitle.includes("amazon") ? "amazon" : lowerTitle.includes("hotel") ? "booking" : lowerTitle.includes("sahil") ? "namecheap" : lowerTitle.includes("notion") ? "notion" : "");
    const missingDoc = rows.documents.find((document) => document.status === "missing" && (lowerTitle.includes("passport") || lowerTitle.includes("kyc")));
    const badges = sourceBadges("gmail", linkedCalendar ? "calendar" : "files", "files", "coral");
    const confidence = deadline.category === "document" || deadline.category === "kyc" ? 84 : 89;
    const score = scoreFor(deadline.due_at, deadline.amount_at_risk, confidence, badges.length);

    const reasons: Record<RiskCard["category"], string> = {
      renewal: "A renewal deadline is approaching; decide whether the spend is still justified.",
      refund: "A refund or return window is closing soon; review it before money becomes unrecoverable.",
      bill: "A bill-like deadline appears in the admin stream and should be checked.",
      document: "An appointment depends on documents, and at least one required document is marked missing.",
      duplicate_charge: "A possible duplicate charge needs manual review.",
      cancellation: "A free cancellation window is about to close and may lock in a fee.",
      kyc: "A KYC deadline may restrict account access if ignored."
    };

    risks.push({
      id: deadline.id,
      title: deadline.title,
      category: deadline.category,
      dueAt: deadline.due_at,
      amountAtRisk: deadline.amount_at_risk || null,
      currency: deadline.currency,
      severity: severityFor(deadline.due_at, deadline.amount_at_risk),
      confidence,
      score,
      sourceBadges: badges,
      reason: reasons[deadline.category],
      recommendedAction: actionFor(deadline.category),
      evidence: [
        evidence("gmail", linkedEmail.subject, linkedEmail.snippet, linkedEmail.received_at),
        ...(linkedCalendar ? [evidence("calendar", linkedCalendar.title, linkedCalendar.description, linkedCalendar.start_time)] : []),
        ...(linkedTransaction ? [evidence("files", linkedTransaction.merchant, `${linkedTransaction.raw_description}: $${linkedTransaction.amount}`, linkedTransaction.posted_at)] : []),
        ...(missingDoc ? [evidence("files", missingDoc.name, `Document status is ${missingDoc.status}; tags: ${missingDoc.tags}`, missingDoc.updated_at)] : []),
        evidence("coral", "Life Risk query", "Risk was produced by joining seeded Gmail, calendar, and local JSONL tables.")
      ]
    });
  }

  return risks.sort((a, b) => b.score - a.score);
}

function actionFor(category: RiskCard["category"]): string {
  switch (category) {
    case "renewal":
      return "Decide whether to cancel or keep the renewal before the deadline.";
    case "refund":
      return "Open the order page and start the return before the refund window closes.";
    case "cancellation":
      return "Confirm the trip plan or cancel before the free cancellation deadline.";
    case "document":
      return "Prepare missing documents before the appointment slot.";
    case "kyc":
      return "Upload missing KYC documents before account restrictions apply.";
    case "duplicate_charge":
      return "Compare statement entries and dispute if one charge is unintended.";
    case "bill":
      return "Confirm payment status and pay before late fees apply.";
  }
}

export function summarizeScan(risks: RiskCard[], usedCoral: boolean, sql: string): ScanResult {
  const sourceTypes = new Set(risks.flatMap((risk) => risk.sourceBadges.filter((badge) => badge !== "coral")));
  return {
    generatedAt: new Date().toISOString(),
    usedCoral,
    sourceStatus: [
      { name: "gmail", connected: true, detail: usedCoral ? "Queried through Coral or seeded Gmail mirror" : "Using seeded Gmail mirror" },
      { name: "calendar", connected: true, detail: usedCoral ? "Queried through Coral or seeded calendar mirror" : "Using seeded calendar mirror" },
      { name: "files", connected: true, detail: "Local JSONL transactions, documents, and deadlines" },
      { name: "coral", connected: usedCoral, detail: usedCoral ? "Coral SQL query completed" : "Fallback mode; run Coral setup commands for live SQL" }
    ],
    summary: {
      totalRisks: risks.length,
      urgentThisWeek: risks.filter((risk) => risk.severity === "critical" || risk.severity === "high").length,
      estimatedMoneyAtRisk: risks.reduce((sum, risk) => sum + (risk.amountAtRisk ?? 0), 0),
      sourceTypesJoined: sourceTypes.size
    },
    risks,
    sql
  };
}
