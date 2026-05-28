"use client";

import { use, useEffect, useState } from "react";
import NextLink from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CoralWordmark } from "@/components/CoralWordmark";
import { RiskDetail } from "@/components/RiskDetail";
import type { RiskCard, ScanResult } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "missing" }
  | { status: "ready"; risk: RiskCard; usedCoral: boolean };

export default function RiskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/scan", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not reach the scan service.");
        const result = (await response.json()) as ScanResult;
        const risk = result.risks.find((item) => item.id === id);
        if (!active) return;
        setState(risk ? { status: "ready", risk, usedCoral: result.usedCoral } : { status: "missing" });
      } catch (loadError) {
        if (!active) return;
        setState({ status: "error", message: loadError instanceof Error ? loadError.message : "Something went wrong." });
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen text-[#111827] px-4 lg:px-8 py-6 md:py-10 bg-[#FBFBF9] relative z-10">
      <div className="max-w-[860px] mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-4">
          <NextLink 
            href="/" 
            className="flex items-center gap-2 text-[#3C463F] font-bold bg-white/90 border border-[#E4E2D4] rounded-full px-4 py-2 hover:border-[#0F766E] hover:-translate-x-0.5 active:scale-95 transition-all duration-150 shadow-sm"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            <span>Back to Risk Board</span>
          </NextLink>
          <CoralWordmark height={24} />
        </div>

        <div className="w-full bg-white border border-[#E4E2D4] rounded-3xl shadow-[0_26px_70px_rgba(31,41,35,0.08)] p-6 md:p-10">
          {state.status === "loading" && <CenterNote emoji={null} title="Loading risk data..." />}
          {state.status === "error" && <CenterNote emoji="⚠️" title={state.message} />}
          {state.status === "missing" && (
            <CenterNote 
              emoji="🔍" 
              title="That risk is no longer on the radar." 
              subtitle="It may have aged out of this scan. Head back and run a fresh one." 
            />
          )}
          {state.status === "ready" && <RiskDetail risk={state.risk} />}
        </div>
        
      </div>
    </div>
  );
}

function CenterNote({ emoji, title, subtitle }: { emoji: string | null; title: string; subtitle?: string }) {
  return (
    <div className="min-h-[320px] flex flex-col justify-center items-center text-center gap-3 text-[#7A8278]">
      {emoji ? (
        <span className="text-5xl select-none" aria-hidden="true">
          {emoji}
        </span>
      ) : (
        <Loader2 size={34} className="spin text-secondary" aria-hidden="true" />
      )}
      <h1 className="font-display text-2xl font-normal text-primary leading-tight max-w-sm">
        {title}
      </h1>
      {subtitle && <p className="max-w-[360px] text-sm leading-relaxed">{subtitle}</p>}
    </div>
  );
}
