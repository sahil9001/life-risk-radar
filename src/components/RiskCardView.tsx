import NextLink from "next/link";
import { ChevronRight } from "lucide-react";
import { SourceChip } from "@/components/SourceChip";
import { AlertTriangle, categoryEmoji, categoryIcons, dateLabel, money, severityTone } from "@/lib/risk-ui";
import type { RiskCard } from "@/lib/types";

export function RiskCardView({ risk }: { risk: RiskCard }) {
  const CategoryIcon = categoryIcons[risk.category] ?? AlertTriangle;
  const tone = severityTone[risk.severity];

  return (
    <div className="relative group block w-full bg-white border border-[#E4E2D4] rounded-2xl shadow-[0_10px_40px_rgba(22,32,27,0.03)] hover:border-secondary hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,106,97,0.08)] transition-all duration-200 overflow-hidden">
      <NextLink href={`/risk/${risk.id}`} className="block p-5 h-full text-left" aria-label={`Open ${risk.title}`}>
        <div className="flex flex-col justify-between h-full gap-4">
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div 
                style={{ backgroundColor: tone.bg, color: tone.fg, borderColor: tone.border }} 
                className="border rounded-xl h-[38px] w-[38px] flex items-center justify-center"
              >
                <CategoryIcon size={18} aria-hidden="true" />
              </div>
              <span 
                style={{ backgroundColor: tone.bg, color: tone.fg }}
                className="px-2.5 py-1 text-[11px] font-bold rounded-full select-none"
              >
                {tone.emoji} {tone.label}
              </span>
            </div>
            <ChevronRight size={18} className="text-[#B6BCAF] group-hover:text-secondary group-hover:translate-x-0.5 transition-all duration-200" aria-hidden="true" />
          </div>

          <div className="flex-1 space-y-1.5">
            <h4 className="font-sans font-extrabold text-base text-[#111827] leading-snug">
              <span className="mr-1" aria-hidden="true">
                {categoryEmoji[risk.category]}
              </span>
              {risk.title}
            </h4>
            <p className="text-[#5C6960] text-sm leading-relaxed">
              {risk.reason}
            </p>
          </div>

          <div className="flex justify-between items-center text-sm font-extrabold text-[#26342E] border-t border-[#F1F0E8] pt-3 mt-1">
            <span>{money(risk.amountAtRisk, risk.currency)}</span>
            <span className="font-mono text-xs text-[#5C6960]">{dateLabel(risk.dueAt)}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {risk.sourceBadges.map((badge) => (
              <SourceChip key={badge} badge={badge} />
            ))}
          </div>
          
        </div>
      </NextLink>
    </div>
  );
}
