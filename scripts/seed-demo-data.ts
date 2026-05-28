import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";

type DemoEmail = {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  labels: string[];
  body: string;
};

type DemoEvent = {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
};

const root = process.cwd();
const sampleDir = path.join(root, "sample-data");
const credentialsPath = path.join(root, "credentials", "google-oauth.json");
const tokenPath = path.join(root, "credentials", "google-token.json");
const demoRecipient = process.env.DEMO_GOOGLE_EMAIL ?? "liferisk.demo@gmail.com";

const demoEmails: DemoEmail[] = [
  {
    id: "gmail_notion",
    from: "Notion Billing <billing@notion.example>",
    to: demoRecipient,
    subject: "Your Notion AI trial renews on May 30 for $96/year",
    date: "Tue, 26 May 2026 09:00:00 +0000",
    labels: ["LifeRisk/Renewals"],
    body: "Your Notion AI trial ends on May 30, 2026. Your annual plan will renew for $96/year unless canceled before renewal. Manage billing before the deadline."
  },
  {
    id: "gmail_amazon",
    from: "Amazon Returns <returns@amazon.example>",
    to: demoRecipient,
    subject: "Return eligible until May 31: Noise Cancelling Headphones",
    date: "Sun, 24 May 2026 13:00:00 +0000",
    labels: ["LifeRisk/Receipts"],
    body: "Order total: $129.00. Return window closes May 31, 2026. Item: Noise Cancelling Headphones."
  },
  {
    id: "gmail_adobe",
    from: "Adobe <billing@adobe.example>",
    to: demoRecipient,
    subject: "Adobe payment receipt - $19.99",
    date: "Fri, 22 May 2026 08:15:00 +0000",
    labels: ["LifeRisk/Receipts"],
    body: "Adobe Creative Cloud monthly payment received: $19.99. Thank you for your payment."
  },
  {
    id: "gmail_booking",
    from: "Booking.com <bookings@booking.example>",
    to: demoRecipient,
    subject: "Hotel free cancellation ends May 29",
    date: "Mon, 25 May 2026 10:30:00 +0000",
    labels: ["LifeRisk/Travel"],
    body: "Your hotel booking can be canceled for free until May 29, 2026. After that, cancellation fee is $280."
  },
  {
    id: "gmail_passport",
    from: "Passport Office <appointments@passport.example>",
    to: demoRecipient,
    subject: "Passport appointment checklist for May 30",
    date: "Tue, 26 May 2026 12:00:00 +0000",
    labels: ["LifeRisk/Documents"],
    body: "Bring passport photo, address proof, old passport, and appointment receipt. Appointment date: May 30, 2026."
  },
  {
    id: "gmail_kyc",
    from: "Bank Alerts <alerts@bank.example>",
    to: demoRecipient,
    subject: "Submit bank KYC documents by June 3",
    date: "Tue, 26 May 2026 14:00:00 +0000",
    labels: ["LifeRisk/Documents"],
    body: "Your account access may be restricted unless KYC is submitted by June 3, 2026. Upload address proof and recent bank statement."
  },
  {
    id: "gmail_domain",
    from: "Namecheap Renewals <renewals@namecheap.example>",
    to: demoRecipient,
    subject: "sahil.dev renews tomorrow for $49",
    date: "Wed, 27 May 2026 06:30:00 +0000",
    labels: ["LifeRisk/Renewals"],
    body: "Your domain sahil.dev renews tomorrow for $49. Turn off auto-renew if you no longer need it."
  }
];

const demoEvents: DemoEvent[] = [
  {
    id: "cal_notion",
    summary: "Cancel Notion AI trial",
    description: "Avoid $96/year renewal. Check Gmail billing email.",
    start: "2026-05-30T09:00:00Z",
    end: "2026-05-30T09:30:00Z"
  },
  {
    id: "cal_booking",
    summary: "Hotel free cancellation deadline",
    description: "Cancel before this time to avoid $280 fee.",
    start: "2026-05-29T18:00:00Z",
    end: "2026-05-29T18:30:00Z"
  },
  {
    id: "cal_passport",
    summary: "Passport appointment",
    description: "Bring passport photo, address proof, old passport, and appointment receipt.",
    start: "2026-05-30T11:00:00Z",
    end: "2026-05-30T12:00:00Z"
  },
  {
    id: "cal_kyc",
    summary: "Submit bank KYC",
    description: "Account access may be restricted if KYC is not submitted.",
    start: "2026-06-03T10:00:00Z",
    end: "2026-06-03T10:30:00Z"
  }
];

const transactions = [
  { id: "txn_adobe_1", posted_at: "2026-05-22", merchant: "Adobe", amount: 19.99, currency: "USD", category: "software", raw_description: "ADOBE CREATIVE CLOUD MONTHLY" },
  { id: "txn_adobe_2", posted_at: "2026-05-24", merchant: "Adobe", amount: 19.99, currency: "USD", category: "software", raw_description: "ADOBE CREATIVE CLOUD MONTHLY" },
  { id: "txn_amazon_headphones", posted_at: "2026-05-24", merchant: "Amazon", amount: 129, currency: "USD", category: "shopping", raw_description: "AMZN MKTP NOISE CANCELLING HEADPHONES" },
  { id: "txn_booking_hotel", posted_at: "2026-05-25", merchant: "Booking.com", amount: 280, currency: "USD", category: "travel", raw_description: "BOOKING.COM HOTEL RESERVATION" },
  { id: "txn_electricity", posted_at: "2026-05-26", merchant: "Electricity Board", amount: 28.1, currency: "USD", category: "utilities", raw_description: "ELECTRICITY BOARD BILL PAYMENT" },
  { id: "txn_domain", posted_at: "2026-05-27", merchant: "Namecheap", amount: 49, currency: "USD", category: "domains", raw_description: "NAMECHEAP DOMAIN RENEWAL SAHIL.DEV" }
];

const documents = [
  { id: "doc_passport_photo", name: "passport_photo.jpg", type: "photo", status: "ready", tags: "passport,appointment", updated_at: "2026-05-24" },
  { id: "doc_address_proof", name: "address_proof.pdf", type: "id_document", status: "missing", tags: "passport,kyc,bank,address", updated_at: "2026-05-24" },
  { id: "doc_old_passport", name: "old_passport.pdf", type: "id_document", status: "ready", tags: "passport,appointment", updated_at: "2026-05-24" },
  { id: "doc_bank_statement", name: "bank_statement.pdf", type: "financial", status: "ready", tags: "kyc,bank", updated_at: "2026-05-25" },
  { id: "doc_appointment_receipt", name: "passport_appointment_receipt.pdf", type: "receipt", status: "ready", tags: "passport,appointment", updated_at: "2026-05-25" }
];

const manualDeadlines = [
  { id: "deadline_notion", title: "Cancel Notion AI trial", due_at: "2026-05-30T09:00:00Z", amount_at_risk: 96, currency: "USD", category: "renewal", source: "manual" },
  { id: "deadline_amazon", title: "Amazon return window closes", due_at: "2026-05-31T23:59:00Z", amount_at_risk: 129, currency: "USD", category: "refund", source: "manual" },
  { id: "deadline_booking", title: "Hotel free cancellation ends", due_at: "2026-05-29T18:00:00Z", amount_at_risk: 280, currency: "USD", category: "cancellation", source: "manual" },
  { id: "deadline_passport", title: "Passport appointment document check", due_at: "2026-05-30T11:00:00Z", amount_at_risk: 0, currency: "USD", category: "document", source: "manual" },
  { id: "deadline_kyc", title: "Submit bank KYC documents", due_at: "2026-06-03T10:00:00Z", amount_at_risk: 0, currency: "USD", category: "kyc", source: "manual" },
  { id: "deadline_domain", title: "Decide whether to renew sahil.dev", due_at: "2026-05-28T12:00:00Z", amount_at_risk: 49, currency: "USD", category: "renewal", source: "manual" }
];

function toJsonl(rows: unknown[]): string {
  return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

function toBase64Url(value: string): string {
  return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildMime(email: DemoEmail): string {
  return [
    `From: ${email.from}`,
    `To: ${email.to}`,
    `Subject: ${email.subject}`,
    `Date: ${email.date}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    email.body
  ].join("\r\n");
}

async function writeLocalFiles(): Promise<void> {
  await mkdir(sampleDir, { recursive: true });
  await writeFile(path.join(sampleDir, "transactions.jsonl"), toJsonl(transactions));
  await writeFile(path.join(sampleDir, "documents.jsonl"), toJsonl(documents));
  await writeFile(path.join(sampleDir, "manual_deadlines.jsonl"), toJsonl(manualDeadlines));
  await writeFile(
    path.join(sampleDir, "calendar_events.jsonl"),
    toJsonl(demoEvents.map((event) => ({
      id: event.id,
      title: event.summary,
      description: event.description,
      start_time: event.start,
      end_time: event.end,
      source: "seeded_calendar"
    })))
  );
  await writeFile(
    path.join(sampleDir, "gmail_messages.jsonl"),
    toJsonl(demoEmails.map((email) => ({
      id: email.id,
      thread_id: email.id.replace("gmail_", "thread_"),
      subject: email.subject,
      from_email: email.from.match(/<([^>]+)>/)?.[1] ?? email.from,
      from_domain: (email.from.match(/@([^>.]+(?:\.[^>]+)+)>/)?.[1] ?? "example").toLowerCase(),
      snippet: email.body.slice(0, 160),
      body_text: email.body,
      received_at: new Date(email.date).toISOString(),
      labels: email.labels.join(",")
    })))
  );
}

async function seedGoogle(): Promise<void> {
  const auth = await authenticate({
    keyfilePath: credentialsPath,
    scopes: [
      "https://www.googleapis.com/auth/gmail.insert",
      "https://www.googleapis.com/auth/gmail.labels",
      "https://www.googleapis.com/auth/calendar.events"
    ]
  });
  await mkdir(path.dirname(tokenPath), { recursive: true });
  await writeFile(tokenPath, JSON.stringify(auth.credentials, null, 2));

  const googleAuth = auth as unknown as Parameters<typeof google.gmail>[0] extends string ? never : NonNullable<Parameters<typeof google.gmail>[0]>["auth"];
  const gmail = google.gmail({ version: "v1", auth: googleAuth });
  const calendar = google.calendar({ version: "v3", auth: googleAuth });

  const labelsByName = new Map<string, string>();
  const labelResponse = await gmail.users.labels.list({ userId: "me" });
  for (const label of labelResponse.data.labels ?? []) {
    if (label.name && label.id) labelsByName.set(label.name, label.id);
  }

  for (const labelName of new Set(demoEmails.flatMap((email) => email.labels))) {
    if (labelsByName.has(labelName)) continue;
    const created = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name: labelName,
        labelListVisibility: "labelShow",
        messageListVisibility: "show"
      }
    });
    if (created.data.name && created.data.id) labelsByName.set(created.data.name, created.data.id);
  }

  for (const email of demoEmails) {
    const raw = toBase64Url(buildMime(email));
    await gmail.users.messages.insert({
      userId: "me",
      requestBody: {
        raw,
        labelIds: email.labels.map((label) => labelsByName.get(label)).filter((label): label is string => Boolean(label))
      }
    });
  }

  for (const event of demoEvents) {
    await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.start, timeZone: "Asia/Kolkata" },
        end: { dateTime: event.end, timeZone: "Asia/Kolkata" },
        extendedProperties: {
          private: { seededBy: "life-risk-radar", seedId: event.id }
        }
      }
    });
  }
}

async function main(): Promise<void> {
  const localOnly = process.argv.includes("--local-only");
  await writeLocalFiles();
  console.log("Wrote local JSONL demo data to sample-data/.");

  if (localOnly) {
    console.log("Skipped Google seeding because --local-only was provided.");
    return;
  }

  try {
    await seedGoogle();
    console.log("Seeded Gmail messages and Calendar events in the authenticated demo account.");
  } catch (error) {
    console.warn("Skipped Google seeding. Local demo data is still ready.");
    console.warn(error instanceof Error ? error.message : error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
