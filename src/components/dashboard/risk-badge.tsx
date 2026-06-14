import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@/lib/types";

const CONFIG: Record<
  RiskLevel,
  { label: string; className: string; dot: string }
> = {
  critical: {
    label: "Critical",
    className:
      "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    className:
      "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
    dot: "bg-emerald-500",
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const { label, className, dot } = CONFIG[level];
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 font-medium ${className}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${dot} ${
          level === "critical" ? "animate-pulse" : ""
        }`}
      />
      {label}
    </Badge>
  );
}
