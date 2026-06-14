"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthScore } from "@/lib/types";

interface HealthGaugeProps {
  healthScore: HealthScore;
}

const LEVEL_CONFIG = {
  healthy: {
    color: "text-emerald-500",
    bg: "bg-emerald-500",
    ring: "ring-emerald-500/20",
    gradient: "from-emerald-500 to-emerald-400",
    label: "Healthy",
  },
  good: {
    color: "text-sky-500",
    bg: "bg-sky-500",
    ring: "ring-sky-500/20",
    gradient: "from-sky-500 to-sky-400",
    label: "Good",
  },
  warning: {
    color: "text-amber-500",
    bg: "bg-amber-500",
    ring: "ring-amber-500/20",
    gradient: "from-amber-500 to-amber-400",
    label: "Warning",
  },
  critical: {
    color: "text-red-500",
    bg: "bg-red-500",
    ring: "ring-red-500/20",
    gradient: "from-red-500 to-red-400",
    label: "Critical",
  },
} as const;

export function HealthGauge({ healthScore }: HealthGaugeProps) {
  const config = LEVEL_CONFIG[healthScore.level];

  // SVG arc for the gauge.
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = (healthScore.score / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Health Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pt-0">
        {/* Circular gauge */}
        <div className="relative h-40 w-40">
          <svg
            className="h-40 w-40 -rotate-90"
            viewBox="0 0 140 140"
          >
            {/* Background track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-muted/30"
            />
            {/* Progress arc */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={`${config.color} transition-all duration-1000 ease-out`}
            />
          </svg>
          {/* Score text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${config.color}`}>
              {healthScore.score}
            </span>
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        </div>

        {/* Penalties list */}
        {healthScore.penalties.length > 0 && (
          <div className="w-full space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Deductions
            </p>
            {healthScore.penalties.map((penalty) => (
              <div
                key={penalty.reason}
                className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-1.5 text-xs"
              >
                <span className="text-muted-foreground">{penalty.label}</span>
                <span className="font-mono font-medium text-red-500">
                  −{penalty.points}
                </span>
              </div>
            ))}
          </div>
        )}

        {healthScore.penalties.length === 0 && (
          <p className="text-sm text-emerald-500 font-medium">
            No issues detected!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
