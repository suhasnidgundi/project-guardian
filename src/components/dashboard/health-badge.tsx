import { Badge } from "@/components/ui/badge";
import type { HealthLevel } from "@/lib/types";

const CONFIG: Record<
  HealthLevel,
  { label: string; className: string }
> = {
  healthy: {
    label: "Healthy",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  good: {
    label: "Good",
    className:
      "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  warning: {
    label: "Warning",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  critical: {
    label: "Critical",
    className:
      "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

interface HealthBadgeProps {
  level: HealthLevel;
  score: number;
}

export function HealthBadge({ level, score }: HealthBadgeProps) {
  const { label, className } = CONFIG[level];
  return (
    <Badge variant="outline" className={`gap-1 font-medium ${className}`}>
      <span className="font-mono text-xs">{score}</span>
      <span className="hidden sm:inline">· {label}</span>
    </Badge>
  );
}
