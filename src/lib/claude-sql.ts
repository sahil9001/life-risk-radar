import Anthropic from "@anthropic-ai/sdk";
import { schemaForPrompt, validateReadOnlySql } from "@/lib/ask";
import type { AskColumn, AskRow } from "@/lib/types";

const MODEL = "claude-opus-4-7";

export function claudeAvailable(apiKey?: string): boolean {
  return Boolean(apiKey || process.env.ANTHROPIC_API_KEY);
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

/**
 * Translate a free-text question into a single read-only Coral SQL query.
 * The system prompt (schema) is cached so repeated asks reuse the cached prefix.
 * The result is always run through validateReadOnlySql before it can execute.
 */
export async function generateSqlWithClaude(question: string, apiKey?: string): Promise<string> {
  const client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: [{ type: "text", text: schemaForPrompt(), cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Question: ${question}\n\nWrite exactly one concise Coral SQL query that answers it. Keep it short — prefer a single SELECT with simple JOINs and standard SQL functions over deeply nested CTEs.`
      }
    ]
  });

  const stripped = textOf(message)
    .replace(/^```(?:sql)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const validated = validateReadOnlySql(stripped);
  if (!validated.ok) {
    throw new Error(`Generated SQL rejected: ${validated.reason}`);
  }
  return validated.sql;
}

export type ClaudeSummary = {
  headline: string;
  draft: { subject: string; body: string };
};

/**
 * Second agent step: Claude reads the real query results and writes a one-line
 * answer plus a short, ready-to-send drafted action. Returns null on any failure
 * so the caller can fall back to a generic summary — the demo never breaks.
 */
export async function summarizeWithClaude(
  question: string,
  columns: AskColumn[],
  rows: AskRow[],
  apiKey?: string
): Promise<ClaudeSummary | null> {
  try {
    const client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: [
        {
          type: "text",
          text: [
            "You are a concise personal admin assistant. Given a user's question and the SQL result rows that answer it,",
            "reply with ONLY a JSON object: {\"headline\": string, \"draft\": {\"subject\": string, \"body\": string}}.",
            "headline: one punchy sentence stating the answer (include amounts/dates when present).",
            "draft: a short, ready-to-send message or checklist the user can act on. No markdown, no prose outside the JSON."
          ].join(" ")
        }
      ],
      messages: [
        {
          role: "user",
          content: `Question: ${question}\nColumns: ${JSON.stringify(columns.map((c) => c.key))}\nRows: ${JSON.stringify(rows.slice(0, 10))}`
        }
      ]
    });

    const parsed = JSON.parse(textOf(message).replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim());
    if (typeof parsed?.headline === "string" && typeof parsed?.draft?.subject === "string" && typeof parsed?.draft?.body === "string") {
      return { headline: parsed.headline, draft: { subject: parsed.draft.subject, body: parsed.draft.body } };
    }
    return null;
  } catch {
    return null;
  }
}

