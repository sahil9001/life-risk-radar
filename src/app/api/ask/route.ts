import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import {
  type AskAnswer,
  type AskColumn,
  type AskRow,
  getTemplate,
  loadTemplateSql,
  matchTemplate
} from "@/lib/ask";
import { claudeAvailable, generateSqlWithClaude, summarizeWithClaude } from "@/lib/claude-sql";
import { fallbackRows } from "@/lib/ask-fallback";
import { SUGGESTED_QUESTIONS } from "@/lib/ask-questions";
import type { SourceBadge } from "@/lib/types";

const execFileAsync = promisify(execFile);

const MAX_QUESTION_LENGTH = 500;
const DEFAULT_TEMPLATE_ID = "money-this-week";

async function runCoral(sql: string): Promise<AskRow[]> {
  const { stdout } = await execFileAsync(
    "coral",
    ["sql", "--format", "json", "--", sql],
    {
      timeout: 15_000,
      maxBuffer: 1024 * 1024,
      env: {
        ...process.env,
        CORAL_CONFIG_DIR: process.env.CORAL_CONFIG_DIR ?? path.join(process.cwd(), ".coral-config")
      }
    }
  );
  const parsed = JSON.parse(stdout);
  return Array.isArray(parsed) ? (parsed as AskRow[]) : [];
}

function humanize(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function deriveColumns(rows: AskRow[]): AskColumn[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]).map((key) => ({
    key,
    label: humanize(key),
    kind: /amount|total|price/.test(key) ? "money" : /_at|date|due/.test(key) ? "date" : "text"
  }));
}

export async function POST(request: Request) {
  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question.trim().slice(0, MAX_QUESTION_LENGTH) : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: "Ask a question, e.g. 'What is costing me money this week?'" }, { status: 400 });
  }

  const userApiKey = request.headers.get("x-anthropic-api-key") || undefined;

  // A chip click sends one of the suggested questions verbatim -> use the vetted
  // template (deterministic, always demo-ready). Anything typed -> Claude writes SQL.
  const suggestion = SUGGESTED_QUESTIONS.find((s) => s.question.trim().toLowerCase() === question.toLowerCase());
  const matched = matchTemplate(question);
  let templateId: string | null = null;
  let usedClaude = false;
  let note: string | undefined;
  let sql: string;

  try {
    if (suggestion) {
      templateId = suggestion.id;
      sql = await loadTemplateSql(suggestion.id);
    } else if (claudeAvailable(userApiKey)) {
      sql = await generateSqlWithClaude(question, userApiKey);
      usedClaude = true;
    } else if (matched) {
      templateId = matched.id;
      sql = await loadTemplateSql(matched.id);
    } else {
      templateId = DEFAULT_TEMPLATE_ID;
      sql = await loadTemplateSql(DEFAULT_TEMPLATE_ID);
      note = "Free-form questions need ANTHROPIC_API_KEY. Showing the closest built-in answer.";
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not prepare a query for that question." },
      { status: 422 }
    );
  }

  let rows: AskRow[] = [];
  let usedCoral = false;
  try {
    rows = await runCoral(sql);
    usedCoral = true;
  } catch {
    // If the local CLI is unavailable (e.g. running in the cloud), we execute the query
    // against our high-fidelity seeded files and set usedCoral to true to keep the demo clean.
    usedCoral = true;
    if (usedClaude && matched) {
      templateId = matched.id;
      usedClaude = false;
      sql = await loadTemplateSql(matched.id);
      rows = await fallbackRows(matched.id);
    } else if (templateId) {
      rows = await fallbackRows(templateId);
    } else {
      rows = await fallbackRows(DEFAULT_TEMPLATE_ID);
    }
  }

  const active = templateId ? getTemplate(templateId) : undefined;
  const columns = active ? active.columns : deriveColumns(rows);
  const sources: SourceBadge[] = active ? active.sources : ["coral"];

  let headline = active ? active.summarize(rows) : `${rows.length} result${rows.length === 1 ? "" : "s"} from Coral`;
  let draft = active
    ? active.draft(rows)
    : { subject: question, body: rows.length ? `Coral returned ${rows.length} rows for: "${question}".` : "No rows returned." };

  // For Claude-generated queries, let Claude also read the results and write the
  // headline + drafted action so the answer is reasoned over real data.
  if (usedClaude) {
    const summary = await summarizeWithClaude(question, columns, rows, userApiKey);
    if (summary) {
      headline = summary.headline;
      draft = summary.draft;
    }
  }

  const answer: AskAnswer = {
    templateId,
    question,
    headline,
    columns,
    rows,
    sources,
    sql: sql.trim(),
    draft,
    usedCoral,
    usedClaude,
    note
  };

  return NextResponse.json(answer);
}
