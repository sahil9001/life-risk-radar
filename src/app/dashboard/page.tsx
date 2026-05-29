"use client";

import { useMemo, useState } from "react";
import { Copy, Database, Loader2, Activity, RefreshCw } from "lucide-react";
import { RiskCardView } from "@/components/RiskCardView";
import { SourceLogo } from "@/components/SourceLogo";
import Link from "next/link";
import {
  groupFor,
  groupMeta,
  groupOrder,
  metricEmoji,
  money,
  sourceMeta
} from "@/lib/risk-ui";
import type { ScanResult } from "@/lib/types";

export default function Dashboard() {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceStatus =
    scan?.sourceStatus ??
    ([
      { name: "gmail" as const, connected: true, detail: "Seeded Gmail mirror ready" },
      { name: "calendar" as const, connected: true, detail: "Seeded Calendar ready" },
      { name: "files" as const, connected: true, detail: "Sample JSONL ready" },
      { name: "coral" as const, connected: false, detail: "Run Coral setup to enable live SQL" }
    ] satisfies ScanResult["sourceStatus"]);

  const groups = useMemo(
    () =>
      groupOrder.map((group) => ({
        group,
        risks: scan?.risks.filter((risk) => groupFor(risk) === group) ?? []
      })),
    [scan]
  );

  const brief = scan
    ? scan.risks
        .slice(0, 5)
        .map(
          (risk, index) =>
            `${index + 1}. ${risk.title}\n   ${money(risk.amountAtRisk, risk.currency)} · ${risk.dueAt ? new Date(risk.dueAt).toDateString() : "review now"}\n   Action: ${risk.recommendedAction}`
        )
        .join("\n\n")
    : "Run a scan to generate the daily brief.";

  async function runScan() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/scan", { cache: "no-store" });
      if (!response.ok) throw new Error("Scan failed. Check that the dev server can read sample data.");
      const result = (await response.json()) as ScanResult;
      setScan(result);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed. Try again after verifying sample data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#111827] flex flex-col">
      <style>{`
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .radar-sweep {
          background: conic-gradient(from 0deg at 50% 50%, rgba(0, 106, 97, 0.15) 0%, transparent 45%);
          animation: radar-spin 3s linear infinite;
        }
      `}</style>

      {/* Floating Capsule Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 md:px-0">
        <div className="bg-white/80 backdrop-blur-md border border-[#E4E2D4] rounded-full flex items-center justify-between px-6 py-3 w-full max-w-2xl shadow-[0_10px_40px_rgba(22,32,27,0.03)]">
          <Link href="/" className="flex items-center gap-2 select-none hover:opacity-85 transition-opacity">
            <span className="text-lg" role="img" aria-label="satellite">🛰️</span>
            <span className="font-sans font-extrabold text-sm uppercase tracking-wider">Life Risk Radar</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider text-[#45464c]">
            <Link className="hover:text-black transition-colors" href="/">Ask Radar</Link>
            <Link className="text-[#000000] hover:text-black border-b-2 border-black pb-0.5" href="/dashboard">Risks Board</Link>
          </div>
          <button
            onClick={runScan}
            disabled={loading}
            className="bg-[#000000] text-white hover:opacity-90 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-2"
          >
            {loading ? <Loader2 size={13} className="spin" /> : <Database size={13} />}
            <span>Sweep</span>
          </button>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="pt-36 pb-12 px-4 max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#ECFDF5] border border-[#B7E4D1] shadow-sm select-none">
          <span className="text-xs font-semibold text-[#0F5F58] flex items-center gap-1.5">
            <span>🪸</span> Live Personal Risk Radar Sweep
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-primary leading-[1.1] max-w-3xl mx-auto font-normal">
          Personal Risk Board
        </h1>
        <p className="font-sans text-sm md:text-base text-[#5C6960] max-w-2xl mx-auto leading-relaxed">
          Monitor recurring threats, duplicate charges, scheduling windows, and compliance gaps. Start a sweep below to query your connected databases.
        </p>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 space-y-8 pb-20">
        
        {/* Radar sync & connections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch animate-fade-in">
          
          <div className="lg:col-span-1 border border-[#E4E2D4] bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden min-h-[300px]">
            {loading ? (
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 border border-secondary/20 rounded-full"></div>
                <div className="absolute inset-6 border border-secondary/15 rounded-full"></div>
                <div className="absolute inset-12 border border-secondary/10 rounded-full"></div>
                <div className="absolute inset-18 border border-secondary/5 rounded-full"></div>
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-secondary/10"></div>
                <div className="absolute left-1/2 top-0 w-[1px] h-full bg-secondary/10"></div>
                <div className="absolute inset-0 radar-sweep rounded-full"></div>
                <div className="absolute inset-[38%] bg-white border border-[#E4E2D4] rounded-full flex items-center justify-center shadow-sm z-10">
                  <RefreshCw size={26} className="spin text-secondary" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#ECFDF5] border border-[#B7E4D1] flex items-center justify-center">
                  <Activity size={24} className="text-secondary" />
                </div>
                <h4 className="font-display text-xl text-primary font-normal">Radar Status: Idle</h4>
                <p className="text-xs text-[#5C6960] max-w-[200px] mx-auto">
                  Ready to sweep all sources. Click &quot;Scan all risks&quot; below to launch.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sourceStatus.map((source, index) => (
              <SourceStatusCard key={source.name} source={source} index={index} />
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div role="alert" className="bg-[#FDE7E2] border border-[#F3B8A6] text-[#9C2A12] rounded-xl p-4 font-bold flex gap-2 items-center">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Metrics overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric emoji={metricEmoji.risks} label="Risks Identified" value={scan?.summary.totalRisks ?? 0} />
          <Metric emoji={metricEmoji.urgent} label="Critical This Week" value={scan?.summary.urgentThisWeek ?? 0} accent />
          <Metric emoji={metricEmoji.money} label="Money at Risk" value={money(scan?.summary.estimatedMoneyAtRisk ?? 0, "USD")} />
          <Metric emoji={metricEmoji.sources} label="Channels Joined" value={scan?.summary.sourceTypesJoined ?? 3} />
        </div>

        {/* Main Risk Board */}
        <section 
          id="risk-board" 
          className="border border-[#E4E2D4] bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_22px_60px_rgba(31,41,35,0.08)] p-6 md:p-8 space-y-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#F1F0E8]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-3xl text-primary font-normal">
                  🛰️ Personal Risk Board
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold select-none
                  ${scan?.usedCoral ? "bg-[#CFE6DD] text-[#0F5F58]" : "bg-[#F1F1E8] text-[#6B7368]"}`}>
                  {scan?.usedCoral ? "🪸 Coral Active" : "Setup Ready"}
                </span>
              </div>
              <p className="text-sm text-[#5C6960]">
                {scan 
                  ? "Coral sorted and ranked risks by financial exposure and urgency. Tap any card below to mitigate." 
                  : "Let the local agent search Gmail, Calendars, and local assets to catalog exposures."}
              </p>
            </div>
            
            <button
              onClick={runScan}
              disabled={loading}
              className="bg-[#000000] text-white hover:opacity-90 active:scale-[0.98] transition-all px-6 h-12 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 min-w-full md:min-w-[160px] select-none"
            >
              {loading ? (
                <Loader2 size={16} className="spin" aria-hidden="true" />
              ) : (
                <Database size={16} aria-hidden="true" />
              )}
              <span>{loading ? "Scanning..." : "Scan all risks"}</span>
            </button>
          </div>

          {/* Grids per category */}
          <div className="space-y-8">
            {groups.map(({ group, risks }) => (
              <div key={group} className="space-y-4">
                <div className="flex items-baseline justify-between select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" aria-hidden="true">{groupMeta[group].emoji}</span>
                    <h3 className="font-sans font-extrabold text-xs uppercase tracking-widest text-[#3C463F]">
                      {group}
                    </h3>
                    <span className="text-[10px] font-mono text-[#9AA295] bg-[#F4F4EC] px-2 py-0.5 rounded-md">
                      {groupMeta[group].hint}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-[#9AA295]">
                    {String(risks.length).padStart(2, "0")}
                  </span>
                </div>

                {risks.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {risks.map((risk) => (
                      <RiskCardView key={risk.id} risk={risk} />
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-[#CDD3C4] rounded-2xl p-6 text-center text-[#9AA295] text-sm">
                    No items in this lane. Run a scan to discover threats.
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Daily Brief */}
        <section className="border border-[#E4E2D4] bg-white rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="space-y-0.5">
              <h3 className="font-display text-2xl text-primary font-normal">
                📋 Daily Briefing
              </h3>
              <p className="text-xs text-[#5C6960]">
                A high-density textual digest of your top risks, structured to paste easily into your planner.
              </p>
            </div>
            
            <button
              onClick={() => navigator.clipboard.writeText(brief)}
              className="inline-flex items-center gap-1.5 px-4 h-9 border border-[#CDD3C4] hover:bg-[#F1F1E8] active:scale-95 text-[#111827] rounded-xl text-xs font-bold transition-all select-none"
            >
              <Copy size={13} aria-hidden="true" />
              <span>Copy Brief</span>
            </button>
          </div>
          
          <pre className="bg-[#13190F] text-[#EAF6E4] rounded-2xl p-5 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono">
            {brief}
          </pre>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E4E2D4] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="font-sans font-extrabold text-sm uppercase tracking-wider text-primary select-none">
              🛰️ LIFE RISK RADAR
            </span>
            <p className="text-xs text-[#5C6960]">
              © 2026 Life Risk Radar. Locally computed estate monitoring agent.
            </p>
          </div>
          
          <div className="flex gap-8 text-xs font-semibold text-[#45464c]">
            <div className="flex flex-col gap-1.5">
              <span className="text-primary font-bold uppercase tracking-wider select-none text-[10px]">Resources</span>
              <a href="#" className="hover:text-black transition-colors underline decoration-1">Security Audit</a>
              <a href="#" className="hover:text-black transition-colors underline decoration-1">Privacy Charter</a>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-primary font-bold uppercase tracking-wider select-none text-[10px]">Support</span>
              <a href="#" className="hover:text-black transition-colors underline decoration-1">Documentation</a>
              <a href="#" className="hover:text-black transition-colors underline decoration-1">Contact Details</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SourceStatusCard({ source, index }: { source: ScanResult["sourceStatus"][number]; index: number }) {
  const meta = sourceMeta[source.name];
  return (
    <div 
      style={{ animationDelay: `${80 + index * 60}ms` }}
      className="bg-white border border-[#E4E2D4] rounded-2xl p-5 shadow-sm hover:border-[#CFE6DD] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex gap-4 items-start"
    >
      <SourceLogo badge={source.name} />
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-1.5 select-none">
          <span className="font-sans font-extrabold text-sm text-primary">
            {meta.emoji} {meta.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase
            ${source.connected ? "bg-[#CFE6DD] text-[#0F5F58]" : "bg-[#F1F1E8] text-[#6B7368]"}`}>
            {source.connected ? "● Connected" : "Setup Needed"}
          </span>
        </div>
        <p className="text-xs text-[#3C463F] leading-normal font-medium">{meta.description}</p>
        <p className="text-[11px] text-[#7A8278] leading-tight font-mono">{source.detail}</p>
      </div>
    </div>
  );
}

function Metric({ emoji, label, value, accent = false }: { emoji: string; label: string; value: string | number; accent?: boolean }) {
  return (
    <div 
      className={`border rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden select-none
        ${accent 
          ? "bg-gradient-to-br from-[#FEF6E4] to-[#FFFDF8] border-[#F0CE85]" 
          : "bg-white border-[#E4E2D4]"}`}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7A8278]">
          {label}
        </span>
        <span className="text-base" aria-hidden="true">{emoji}</span>
      </div>
      <p className="font-sans font-extrabold text-2xl md:text-3xl text-primary mt-3 leading-none">
        {value}
      </p>
    </div>
  );
}
