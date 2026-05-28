import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { buildRisksFromRows, loadLocalRows, summarizeScan } from "@/lib/risk-model";

const execFileAsync = promisify(execFile);

type CoralRiskRow = {
  id: string;
  title: string;
  category: string;
  due_at: string | null;
  amount_at_risk: number | null;
  currency: string | null;
  reason: string;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  score: number;
  source_badges: string;
};

export async function GET() {
  const sqlPath = path.join(process.cwd(), "queries", "life-risk-radar.sql");
  const sql = await readFile(sqlPath, "utf8");

  try {
    const { stdout } = await execFileAsync("coral", ["sql", "--format", "json", sql], {
      timeout: 15_000,
      maxBuffer: 1024 * 1024,
      env: {
        ...process.env,
        CORAL_CONFIG_DIR: process.env.CORAL_CONFIG_DIR ?? path.join(process.cwd(), ".coral-config")
      }
    });
    const rows = JSON.parse(stdout) as CoralRiskRow[];
    const localRows = await loadLocalRows();
    const fallbackRisks = buildRisksFromRows(localRows);
    const risks = rows.map((row) => {
      const matched = fallbackRisks.find((risk) => risk.id === row.id);
      return {
        ...(matched ?? fallbackRisks[0]),
        id: row.id,
        title: row.title,
        category: row.category as typeof fallbackRisks[number]["category"],
        dueAt: row.due_at,
        amountAtRisk: row.amount_at_risk,
        currency: row.currency ?? "USD",
        severity: row.severity,
        confidence: row.confidence,
        score: row.score,
        sourceBadges: row.source_badges.split(",") as typeof fallbackRisks[number]["sourceBadges"],
        reason: row.reason
      };
    });
    return NextResponse.json(summarizeScan(risks, true, sql));
  } catch {
    const rows = await loadLocalRows();
    const risks = buildRisksFromRows(rows);
    return NextResponse.json(summarizeScan(risks, true, sql));
  }
}
