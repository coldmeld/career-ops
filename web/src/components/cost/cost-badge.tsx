import { Leaf, Coins, Sparkles } from "lucide-react";
import { COST_META, type CostClass } from "@/lib/explore-cost";

<<<<<<< HEAD
// One primitive, four variants. free/free-network/free-gemini = emerald (no cost);
// spend = BRAND ORANGE (not red — spending on a chosen evaluation is the valuable
// action, not a hazard; red stays reserved for the usage-meter plan brake).
// Co-located style per the Tailwind v4 stale-CSS HMR gotcha.
const CSS = `
.co-cost{display:inline-flex;align-items:center;gap:.28rem;border-radius:999px;font-weight:600;line-height:1;white-space:nowrap;border:1px solid transparent}
.co-cost[data-size="xs"]{font-size:9.5px;padding:.16rem .4rem;letter-spacing:.04em;text-transform:uppercase}
.co-cost[data-size="sm"]{font-size:11px;padding:.24rem .5rem}
.co-cost[data-tone="free"]{color:hsl(160 70% 38%);background:hsl(160 64% 46% / .12);border-color:hsl(160 64% 46% / .28)}
html.dark .co-cost[data-tone="free"]{color:hsl(158 64% 60%);background:hsl(158 64% 52% / .13);border-color:hsl(158 64% 52% / .26)}
.co-cost[data-tone="spend"]{color:hsl(26 78% 42%);background:hsl(26 73% 51% / .12);border-color:hsl(26 73% 51% / .30)}
html.dark .co-cost[data-tone="spend"]{color:hsl(26 86% 66%);background:hsl(26 80% 55% / .14);border-color:hsl(26 80% 55% / .30)}
.co-cost svg{width:.85em;height:.85em}
`;
=======
// One primitive, four variants — the app's cost color-semantics (career-ops-ux
// lock, for DESIGN_SYSTEM.md): GREEN = free/positive (celebrate); NEUTRAL/muted
// (+ coin icon) = spend ("Uses tokens") — it INFORMS, it must not alarm nor
// celebrate, and crucially it must NOT be brand-orange: orange is reserved for
// the primary action (e.g. "Run your first FREE scan"), so an orange spend badge
// would collide ("go/free" vs "costs") and shout louder than the action itself.
// Muted spend AA-verified in both themes. Styles live in globals.css (.co-cost).
>>>>>>> e14ec69774f99feb00dc10fc052e0b397d4d7cae

export function CostBadge({ kind, size = "sm", className = "" }: { kind: CostClass; size?: "xs" | "sm"; className?: string }) {
  const tone = kind === "spend" ? "spend" : "free";
  const Icon = kind === "spend" ? Coins : kind === "free-gemini" ? Sparkles : Leaf;
  const meta = COST_META[kind];
  return (
    <span className={`co-cost ${className}`} data-tone={tone} data-size={size} title={meta.tip}>
<<<<<<< HEAD
      <style>{CSS}</style>
=======
>>>>>>> e14ec69774f99feb00dc10fc052e0b397d4d7cae
      <Icon aria-hidden />
      {meta.label}
    </span>
  );
}
