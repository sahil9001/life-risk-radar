import { sourceMeta } from "@/lib/risk-ui";
import type { SourceBadge } from "@/lib/types";

export function SourceLogo({ badge, small = false }: { badge: SourceBadge; small?: boolean }) {
  const meta = sourceMeta[badge];

  if (badge === "coral") {
    return (
      <div
        aria-label="Coral logo"
        role="img"
        className={`bg-[#ECFDF5] border border-[#B7E4D1] flex items-center justify-center overflow-hidden select-none
          ${small ? "rounded-[6px] h-5 w-5 text-[12px]" : "rounded-xl h-[46px] w-[46px] text-[24px]"}`}
      >
        <span aria-hidden="true">🪸</span>
      </div>
    );
  }

  const IconComponent = meta.icon as React.ElementType;
  return (
    <div
      aria-label={`${meta.label} logo`}
      role="img"
      style={{ color: meta.color }}
      className={`bg-white border border-[#DDE5E0] flex items-center justify-center select-none
        ${small ? "rounded-[6px] h-5 w-5" : "rounded-xl h-[46px] w-[46px]"}`}
    >
      <IconComponent size={small ? 13 : 24} aria-hidden="true" />
    </div>
  );
}
