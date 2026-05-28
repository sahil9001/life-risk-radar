import { SourceLogo } from "@/components/SourceLogo";
import { sourceMeta } from "@/lib/risk-ui";
import type { SourceBadge } from "@/lib/types";

export function SourceChip({ badge }: { badge: SourceBadge }) {
  return (
    <div className="inline-flex items-center gap-1 bg-[#F1F1E8] text-[#3C463F] rounded-full px-2 py-1 text-xs font-semibold select-none">
      <SourceLogo badge={badge} small />
      <span>{sourceMeta[badge].label}</span>
    </div>
  );
}
