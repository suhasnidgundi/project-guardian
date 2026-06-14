"use client";

import { useMemo } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deriveAlerts, RiskAlert } from "@/lib/safety-engine";
import type { ProjectInfo } from "@/lib/types";
import Link from "next/link";

interface DisasterPreventionProps {
  projects: ProjectInfo[];
}

export function DisasterPrevention({ projects }: DisasterPreventionProps) {
  // Aggregate all alerts across all projects
  const alerts = useMemo(() => {
    const list: RiskAlert[] = [];
    for (const p of projects) {
      const projectAlerts = deriveAlerts(
        p.id,
        p.name,
        p.backupSafetyScore,
        p.githubMetadata,
        p.isGit,
        p.hasRemote,
        p.unpushedCommits
      );
      list.push(...projectAlerts);
    }
    return list;
  }, [projects]);

  // Group alerts by severity
  const groupedAlerts = useMemo(() => {
    const critical = alerts.filter((a) => a.severity === "critical");
    const high = alerts.filter((a) => a.severity === "high");
    const warning = alerts.filter((a) => a.severity === "warning");
    const healthy = alerts.filter((a) => a.severity === "healthy");

    return { critical, high, warning, healthy };
  }, [alerts]);

  // Generate unique custom risk insights
  const riskInsights = useMemo(() => {
    const insights: { message: string; projectName: string; projectId: string }[] = [];
    
    for (const p of projects) {
      // 1. unpushed commits
      if (p.unpushedCommits > 0) {
        insights.push({
          projectName: p.name,
          projectId: p.id,
          message: `Project has ${p.unpushedCommits} local commit${p.unpushedCommits > 1 ? "s" : ""} that only exist${p.unpushedCommits === 1 ? "s" : ""} on this machine.`,
        });
      }
      // 2. exists locally but never pushed
      if (p.isGit && p.hasRemote && (!p.githubMetadata || (p.githubMetadata.exists && !p.githubMetadata.lastPushDate))) {
        insights.push({
          projectName: p.name,
          projectId: p.id,
          message: `Repository exists locally but has never been pushed.`,
        });
      }
      // 3. not backed up for 30+ days
      if (p.githubMetadata && p.githubMetadata.lastPushDate) {
        const age = Date.now() - new Date(p.githubMetadata.lastPushDate).getTime();
        const days = Math.floor(age / (24 * 60 * 60 * 1000));
        if (days > 30) {
          insights.push({
            projectName: p.name,
            projectId: p.id,
            message: `Repository has not been backed up for ${days} days.`,
          });
        }
      }
      // 4. remote deleted/inaccessible
      if (p.isGit && p.hasRemote && p.githubMetadata && !p.githubMetadata.exists) {
        insights.push({
          projectName: p.name,
          projectId: p.id,
          message: `Remote repository appears inaccessible or deleted.`,
        });
      }
    }

    // Return top 8 insights
    return insights.slice(0, 8);
  }, [projects]);

  const totalAlertsCount = alerts.filter((a) => a.severity !== "healthy").length;

  return (
    <div className="space-y-6">
      {/* Risk Insights Banner */}
      {riskInsights.length > 0 && (
        <Card className="border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent">
          <CardContent className="flex gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                  Active Backup & Recovery Insights
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI-detected vulnerabilities and optimization warnings across your folders.
                </p>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {riskInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-4 rounded-lg bg-muted/40 p-2 hover:bg-muted/60 transition-colors">
                    <span className="text-muted-foreground font-light leading-relaxed">
                      <strong className="text-foreground font-semibold">{insight.projectName}</strong>: {insight.message}
                    </span>
                    <Link
                      href={`/project/${insight.projectId}`}
                      className="text-cyan-500 hover:text-cyan-400 shrink-0 flex items-center gap-0.5 font-medium cursor-pointer"
                    >
                      Fix <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid count by severity */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-500/5 border-red-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-red-500/70 font-semibold uppercase tracking-wider">Critical Issues</p>
              <h3 className="text-2xl font-bold text-red-500">{groupedAlerts.critical.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-amber-500/70 font-semibold uppercase tracking-wider">High Issues</p>
              <h3 className="text-2xl font-bold text-amber-500">{groupedAlerts.high.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-400/5 border-amber-400/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-amber-400/70 font-semibold uppercase tracking-wider">Warnings</p>
              <h3 className="text-2xl font-bold text-amber-500 dark:text-amber-400">{groupedAlerts.warning.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-emerald-500/70 font-semibold uppercase tracking-wider">Synchronized</p>
              <h3 className="text-2xl font-bold text-emerald-500">{groupedAlerts.healthy.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Alert Feed */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Alert Resolution Center</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active alerts requiring your immediate backup or settings modifications.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-normal">
              {totalAlertsCount} alerts active
            </Badge>
          </div>

          <div className="space-y-3">
            {totalAlertsCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/60 rounded-xl">
                <CheckCircle className="h-10 w-10 text-emerald-500 mb-2" />
                <h4 className="font-semibold text-sm">Disaster Risk Minimized!</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  All repositories are tracked, have remotes, and are synchronized. Your data is highly protected.
                </p>
              </div>
            ) : (
              // Display Issues Grouped by Severity
              [...groupedAlerts.critical, ...groupedAlerts.high, ...groupedAlerts.warning].map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all hover:bg-muted/10 ${
                    alert.severity === "critical"
                      ? "border-red-500/20 bg-red-500/5"
                      : alert.severity === "high"
                      ? "border-amber-500/20 bg-amber-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="mt-0.5 shrink-0">
                      {alert.severity === "critical" && <ShieldAlert className="h-5 w-5 text-red-500" />}
                      {alert.severity === "high" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                      {alert.severity === "warning" && <AlertCircle className="h-5 w-5 text-amber-400" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{alert.projectName}</span>
                        <Badge
                          variant={
                            alert.severity === "critical"
                              ? "destructive"
                              : alert.severity === "high"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[9px] uppercase tracking-wider px-1 py-0"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                  <Link
                    href={`/project/${alert.projectId}`}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    View Project <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
