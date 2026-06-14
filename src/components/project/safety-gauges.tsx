"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BackupSafetyScore, RecoveryReadinessScore } from "@/lib/types";

interface SafetyGaugesProps {
  backupSafetyScore: BackupSafetyScore;
  recoveryReadinessScore: RecoveryReadinessScore;
}

const LEVEL_COLORS = {
  critical: "text-red-500 bg-red-500/10 border-red-500/20",
  high: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  medium: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  low: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
} as const;

export function SafetyGauges({ backupSafetyScore, recoveryReadinessScore }: SafetyGaugesProps) {
  const renderGauge = (score: number, status: string, risk: "critical" | "high" | "medium" | "low", title: string) => {
    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const dashOffset = circumference - progress;

    const riskColor = 
      risk === "critical"
        ? "text-red-500"
        : risk === "high"
        ? "text-amber-500"
        : risk === "medium"
        ? "text-sky-500"
        : "text-emerald-500";

    return (
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        <div className="relative h-32 w-32">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 130 130">
            {/* Background track */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            {/* Progress arc */}
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={`${riskColor} transition-all duration-1000 ease-out`}
            />
          </svg>
          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${riskColor}`}>{score}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{status}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Safety & Resilience Indicators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Backup Score Gauge */}
          <div className="space-y-4">
            {renderGauge(
              backupSafetyScore.score,
              backupSafetyScore.status,
              backupSafetyScore.risk,
              "Backup Safety Score"
            )}
            
            {/* Backup Penalties */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Backup Penalties</span>
              {backupSafetyScore.penalties.length === 0 ? (
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2 text-center text-xs text-emerald-500 font-medium">
                  Fully protected & synchronized!
                </div>
              ) : (
                <div className="space-y-1 max-h-[140px] overflow-y-auto">
                  {backupSafetyScore.penalties.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
                      <span className="text-muted-foreground font-light">{p.label}</span>
                      <span className="font-mono text-red-500 font-semibold">-{p.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recovery Readiness Gauge */}
          <div className="space-y-4">
            {renderGauge(
              recoveryReadinessScore.score,
              recoveryReadinessScore.status,
              recoveryReadinessScore.risk,
              "Recovery Readiness Score"
            )}

            {/* Recovery Penalties */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recovery Penalties</span>
              {recoveryReadinessScore.penalties.length === 0 ? (
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2 text-center text-xs text-emerald-500 font-medium">
                  Perfect recovery configurations!
                </div>
              ) : (
                <div className="space-y-1 max-h-[140px] overflow-y-auto">
                  {recoveryReadinessScore.penalties.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
                      <span className="text-muted-foreground font-light">{p.label}</span>
                      <span className="font-mono text-red-500 font-semibold">-{p.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
