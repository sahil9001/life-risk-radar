export type SourceBadge = "gmail" | "calendar" | "files" | "coral";

export type RiskCategory =
  | "renewal"
  | "refund"
  | "bill"
  | "document"
  | "duplicate_charge"
  | "cancellation"
  | "kyc";

export type Severity = "critical" | "high" | "medium" | "low";

export type EvidenceRow = {
  source: SourceBadge;
  title: string;
  detail: string;
  occurredAt?: string;
};

export type RiskCard = {
  id: string;
  title: string;
  category: RiskCategory;
  dueAt: string | null;
  amountAtRisk: number | null;
  currency: string;
  severity: Severity;
  confidence: number;
  score: number;
  sourceBadges: SourceBadge[];
  reason: string;
  recommendedAction: string;
  evidence: EvidenceRow[];
};

export type AskColumnKind = "text" | "money" | "date" | "number";

export type AskColumn = {
  key: string;
  label: string;
  kind?: AskColumnKind;
};

export type AskRow = Record<string, string | number | null>;

export type AskAnswer = {
  templateId: string | null;
  question: string;
  headline: string;
  columns: AskColumn[];
  rows: AskRow[];
  sources: SourceBadge[];
  sql: string;
  draft: { subject: string; body: string };
  usedCoral: boolean;
  usedClaude: boolean;
  note?: string;
};

export type ScanResult = {
  generatedAt: string;
  usedCoral: boolean;
  sourceStatus: Array<{
    name: SourceBadge;
    connected: boolean;
    detail: string;
  }>;
  summary: {
    totalRisks: number;
    urgentThisWeek: number;
    estimatedMoneyAtRisk: number;
    sourceTypesJoined: number;
  };
  risks: RiskCard[];
  sql: string;
};
