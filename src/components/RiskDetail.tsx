"use client";

import { useState } from "react";
import { Check, Mail, Receipt, ExternalLink } from "lucide-react";
import { categoryEmoji, closeSteps, dateLabel, money, severityTone, sourceMeta } from "@/lib/risk-ui";
import type { RiskCard } from "@/lib/types";

export function RiskDetail({ risk }: { risk: RiskCard }) {
  const tone = severityTone[risk.severity];
  const steps = closeSteps(risk);
  const [done, setDone] = useState<boolean[]>(() => steps.map(() => false));

  const completed = done.filter(Boolean).length;
  const progress = steps.length ? Math.round((completed / steps.length) * 100) : 0;
  const resolved = completed === steps.length;

  function toggle(index: number) {
    setDone((prev) => prev.map((value, i) => (i === index ? !value : value)));
  }

  // SVG Progress Ring calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col gap-6 text-[#111827]">
      
      {/* Title Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-error-container text-on-error-container rounded-full text-xs font-bold select-none"
             style={{ backgroundColor: tone.bg, color: tone.fg }}>
          <span>{tone.emoji}</span>
          <span className="uppercase tracking-wide text-[10px]">{tone.label} ACTION</span>
        </div>
        
        <h2 className="font-display text-3xl md:text-4xl text-primary font-normal leading-tight">
          <span className="mr-2" aria-hidden="true">
            {categoryEmoji[risk.category]}
          </span>
          {risk.title}
        </h2>
        
        <p className="text-[#5C6960] text-base leading-relaxed">
          {risk.reason}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-sm p-4 bg-[#FBFBF9] rounded-2xl border border-[#E4E2D4] shadow-[0_10px_40px_rgba(22,32,27,0.02)]">
        <div className="text-center p-1">
          <p className="text-[10px] font-semibold text-[#7A8278] uppercase tracking-wider mb-1">Amount</p>
          <p className="text-lg md:text-xl font-bold font-sans text-primary leading-none">
            {money(risk.amountAtRisk, risk.currency)}
          </p>
        </div>
        <div className="text-center p-1 border-x border-[#E4E2D4]">
          <p className="text-[10px] font-semibold text-[#7A8278] uppercase tracking-wider mb-1">Deadline</p>
          <p className="text-xs md:text-sm font-semibold font-mono text-primary leading-tight break-words">
            {dateLabel(risk.dueAt)}
          </p>
        </div>
        <div className="text-center p-1">
          <p className="text-[10px] font-semibold text-[#7A8278] uppercase tracking-wider mb-1">Confidence</p>
          <p className="text-lg md:text-xl font-bold font-sans text-secondary leading-none">
            {risk.confidence}%
          </p>
        </div>
      </div>

      {/* Progress & Checklist Card */}
      <div 
        className={`border rounded-2xl p-5 transition-colors duration-300
          ${resolved ? "bg-gradient-to-br from-[#ECFDF5] to-[#F6FFFB] border-[#9BD8B3]" : "bg-white border-[#E4E2D4] shadow-[0_10px_40px_rgba(22,32,27,0.03)]"}`}
      >
        <div className="flex items-center gap-4 mb-5">
          {/* Progress Circle SVG */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                className="text-[#E6EEFF] stroke-current" 
                cx="50" 
                cy="50" 
                fill="transparent" 
                r={radius} 
                strokeWidth="8"
              />
              <circle 
                className="text-secondary stroke-current transition-all duration-300 origin-center -rotate-90" 
                cx="50" 
                cy="50" 
                fill="transparent" 
                r={radius} 
                strokeLinecap="round" 
                strokeWidth="8"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <span className="text-sm font-bold text-primary font-sans leading-none">{completed}/{steps.length}</span>
              <span className="text-[8px] font-bold text-[#7A8278] mt-0.5 tracking-wider uppercase">
                {resolved ? "RESOLVED" : "PENDING"}
              </span>
            </div>
          </div>
          
          <div className="flex-1 space-y-0.5">
            <h3 className="font-sans font-bold text-base text-primary">
              {resolved ? "✅ Risk mitigated" : "🛠️ Mitigation Roadmap"}
            </h3>
            <p className="text-[#5C6960] text-xs leading-normal">
              {resolved 
                ? "Every step is verified and complete. Good work." 
                : "Work through the steps below to securely handle this risk."}
            </p>
          </div>
        </div>

        {/* Recommended Move Alert Box */}
        <div className="bg-gradient-to-br from-[#ECFDF5] to-[#F6FFFB] border border-[#BBF7D0] rounded-xl p-4 mb-4">
          <p className="text-[10px] font-extrabold tracking-wider uppercase text-secondary mb-1">
            🎯 Recommended move
          </p>
          <p className="text-[#166534] text-sm leading-relaxed font-semibold">
            {risk.recommendedAction}
          </p>
        </div>

        {/* Checklist Steps */}
        <div className="space-y-2">
          {steps.map((step, index) => {
            const checked = done[index];
            return (
              <button
                key={step}
                type="button"
                onClick={() => toggle(index)}
                aria-pressed={checked}
                className={`group w-full text-left flex items-center gap-3 p-3.5 border rounded-xl transition-all duration-150 active:scale-[0.99]
                  ${checked 
                    ? "bg-[#F0FAF4] border-[#BBE6CB]" 
                    : "bg-white border-[#E4E2D4] hover:border-secondary shadow-sm"}`}
              >
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150
                    ${checked 
                      ? "bg-secondary text-white" 
                      : "border border-[#B6BCAF] text-transparent group-hover:border-secondary"}`}
                >
                  {checked ? (
                    <Check size={12} strokeWidth={3} />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-[#E4E2D4]" />
                  )}
                </div>
                
                <span 
                  className={`flex-grow font-sans text-sm font-semibold transition-all duration-150
                    ${checked ? "text-[#7A8278] line-through opacity-70" : "text-[#26342E]"}`}
                >
                  {step}
                </span>
                
                <span className="text-[#B6BCAF] opacity-0 group-hover:opacity-100 transition-opacity">
                  {checked ? <Check size={14} /> : <ExternalLink size={14} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Why Flagged Explain Box */}
      <div className="bg-[#FAFAF4] border border-[#E4E2D4] rounded-2xl p-5 shadow-sm space-y-1.5">
        <h4 className="font-sans font-extrabold text-sm text-primary uppercase tracking-wider select-none">
          🔍 Scan Logic
        </h4>
        <p className="text-[#5C6960] text-sm leading-relaxed">
          {risk.sourceBadges
            .filter((badge) => badge !== "coral")
            .map((badge) => sourceMeta[badge].label)
            .join(", ")}{" "}
          signals matched specific recurring patterns. Coral analyzed database state and structured this verification plan.
        </p>
      </div>

      {/* Evidence Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center select-none">
          <h3 className="font-sans font-extrabold text-xs text-[#3C463F] uppercase tracking-widest">
            📊 Evidence Logs ({risk.evidence.length})
          </h3>
        </div>
        
        <div className="space-y-3">
          {risk.evidence.map((row, index) => {
            const hasMail = row.source === "gmail";
            return (
              <div 
                key={`${row.source}-${index}`} 
                className="p-4 bg-white border border-[#E4E2D4] rounded-2xl flex gap-3 items-start shadow-sm hover:border-[#CFE6DD] transition-colors"
              >
                <div className="w-10 h-10 flex-shrink-0 bg-[#F4F4EC] text-[#3C463F] rounded-xl flex items-center justify-center">
                  {hasMail ? (
                    <Mail size={18} className="opacity-80" />
                  ) : (
                    <Receipt size={18} className="opacity-80" />
                  )}
                </div>
                
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#7A8278] uppercase select-none">
                    <span>{sourceMeta[row.source].label}</span>
                    <span className="w-1 h-1 rounded-full bg-[#B6BCAF]" />
                    <span>{row.occurredAt ? dateLabel(row.occurredAt) : "Seeded Record"}</span>
                  </div>
                  <h4 className="font-sans font-extrabold text-sm text-primary leading-snug break-words">
                    {row.title}
                  </h4>
                  <p className="text-[#5C6960] text-sm leading-relaxed break-words italic bg-[#FBFBF9] p-3 border border-[#E4E2D4] rounded-xl font-mono">
                    &quot;{row.detail}&quot;
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
