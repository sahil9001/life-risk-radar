import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  FileArchive,
  FileWarning,
  Mail,
  ReceiptText,
  RefreshCcw,
  ShieldAlert,
  WalletCards
} from "lucide-react";
import type { RiskCard, RiskCategory, Severity, SourceBadge } from "@/lib/types";

export const categoryIcons = {
  renewal: RefreshCcw,
  refund: ReceiptText,
  bill: WalletCards,
  document: FileWarning,
  duplicate_charge: ShieldAlert,
  cancellation: CalendarClock,
  kyc: FileWarning
} satisfies Record<RiskCategory, typeof RefreshCcw>;

export { AlertTriangle };

export const categoryEmoji = {
  renewal: "🔄",
  refund: "🧾",
  bill: "💳",
  document: "📄",
  duplicate_charge: "🪞",
  cancellation: "🗓️",
  kyc: "🪪"
} satisfies Record<RiskCategory, string>;

export const severityTone = {
  critical: { label: "Critical", emoji: "🔴", bg: "#FDE7E2", fg: "#9C2A12", border: "#F3B8A6" },
  high: { label: "High", emoji: "🟠", bg: "#FCEFD3", fg: "#92590C", border: "#F0CE85" },
  medium: { label: "Medium", emoji: "🔵", bg: "#DCEAFE", fg: "#1D4ED8", border: "#9FC0F4" },
  low: { label: "Low", emoji: "🟢", bg: "#DAF3E4", fg: "#166534", border: "#9BD8B3" }
} satisfies Record<Severity, { label: string; emoji: string; bg: string; fg: string; border: string }>;

export const sourceMeta = {
  gmail: {
    label: "Gmail",
    emoji: "📨",
    description: "receipts, renewals, bills, forms",
    color: "#EA4335",
    icon: Mail
  },
  calendar: {
    label: "Google Calendar",
    emoji: "📅",
    description: "appointments, reminders, deadlines",
    color: "#1A73E8",
    icon: CalendarDays
  },
  files: {
    label: "Local Files",
    emoji: "🗂️",
    description: "transactions, documents, JSONL records",
    color: "#475569",
    icon: FileArchive
  },
  coral: {
    label: "Coral",
    emoji: "🪸",
    description: "SQL joins, ranking, explainable evidence",
    color: "#0F766E",
    icon: null
  }
} satisfies Record<SourceBadge, { label: string; emoji: string; description: string; color: string; icon: unknown }>;

export const groupMeta = {
  "Due Soon": { emoji: "⏰", hint: "Clock is running" },
  "Money at Risk": { emoji: "💸", hint: "Cash on the line" },
  "Needs Document": { emoji: "📄", hint: "Blocked on paperwork" },
  "Review Charges": { emoji: "🔁", hint: "Possible double-billing" }
} as const;

export const groupOrder = ["Due Soon", "Money at Risk", "Needs Document", "Review Charges"] as const;

export const flowSteps = [
  { badge: "gmail" as const, emoji: "📨", title: "Read Signals", detail: "Receipts, renewals, bills, KYC requests" },
  { badge: "calendar" as const, emoji: "📅", title: "Find Deadlines", detail: "Appointments and cancellation windows" },
  { badge: "files" as const, emoji: "🗂️", title: "Match Records", detail: "Transactions, documents, local JSONL" },
  { badge: "coral" as const, emoji: "🪸", title: "Join with Coral", detail: "SQL ranks risks and returns evidence" }
];

export const metricEmoji = {
  risks: "🎯",
  urgent: "⚡",
  money: "💰",
  sources: "🔗"
} as const;

export function money(value: number | null, currency: string): string {
  if (!value) return "No direct amount";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

export function dateLabel(value: string | null): string {
  if (!value) return "Review now";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function groupFor(risk: RiskCard): (typeof groupOrder)[number] {
  if (risk.category === "document" || risk.category === "kyc") return "Needs Document";
  if (risk.category === "duplicate_charge") return "Review Charges";
  if (risk.dueAt) return "Due Soon";
  return "Money at Risk";
}

const closeStepsByCategory: Record<RiskCategory, string[]> = {
  renewal: [
    "Open the renewal notice in Gmail and confirm the amount",
    "Decide whether the service still earns its spend",
    "Turn off auto-renew or confirm the renewal before the deadline"
  ],
  refund: [
    "Open the order receipt and check the return window",
    "Start the return or refund request with the merchant",
    "Save the confirmation and expected refund date"
  ],
  bill: [
    "Review the bill and confirm the charge is expected",
    "Flag anything unfamiliar to the provider",
    "Schedule or pay before the due date"
  ],
  document: [
    "Locate the document the appointment requires",
    "Bring or upload it ahead of the appointment",
    "Confirm it satisfies the requirement"
  ],
  duplicate_charge: [
    "Compare the two charges side by side",
    "Contact the merchant or bank to dispute the duplicate",
    "Track the reversal until the refund posts"
  ],
  cancellation: [
    "Confirm whether you still need this booking",
    "Cancel before the free-cancellation deadline if not",
    "Save the cancellation confirmation"
  ],
  kyc: [
    "Open the verification request and review what is needed",
    "Submit the required identity details",
    "Confirm the account is no longer restricted"
  ]
};

export function closeSteps(risk: RiskCard): string[] {
  const steps = closeStepsByCategory[risk.category] ?? ["Review the evidence", "Take the recommended action"];
  return [...steps, "Mark this risk as handled for the week"];
}
