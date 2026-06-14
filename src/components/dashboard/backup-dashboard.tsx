"use client";

import { useMemo } from "react";
import { Cloud, CloudOff, ArrowUpFromLine, RefreshCw, BarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectInfo } from "@/lib/types";

interface BackupDashboardProps {
  projects: ProjectInfo[];
}

export function BackupDashboard({ projects }: BackupDashboardProps) {
  const stats = useMemo(() => {
    const gitProjects = projects.filter((p) => p.isGit);
    const total = projects.length;

    // 1. Projects Never Pushed
    const neverPushed = gitProjects.filter(
      (p) => p.hasRemote && (!p.githubMetadata || (p.githubMetadata.exists && !p.githubMetadata.lastPushDate))
    );

    // 2. Projects Missing Remotes
    const missingRemotes = gitProjects.filter((p) => !p.hasRemote);

    // 3. Projects With Unpushed Commits
    const withUnpushed = gitProjects.filter((p) => p.unpushedCommits > 0);

    // 4. Recently Backed Up Projects (pushed in last 7 days)
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const recentlyBackedUp = gitProjects.filter((p) => {
      if (!p.githubMetadata || !p.githubMetadata.lastPushDate) return false;
      const age = Date.now() - new Date(p.githubMetadata.lastPushDate).getTime();
      return age < SEVEN_DAYS_MS;
    });

    // 5. Backup Safety Distribution
    const distribution = {
      synchronized: 0,
      protected: 0,
      partially: 0,
      atRisk: 0,
      unprotected: 0,
      critical: 0,
    };

    let totalScore = 0;
    for (const p of projects) {
      const score = p.backupSafetyScore.score;
      totalScore += score;

      if (p.backupSafetyScore.status === "Fully Synchronized") distribution.synchronized++;
      else if (p.backupSafetyScore.status === "Protected") distribution.protected++;
      else if (p.backupSafetyScore.status === "Partially Protected") distribution.partially++;
      else if (p.backupSafetyScore.status === "At Risk") distribution.atRisk++;
      else if (p.backupSafetyScore.status === "Unprotected") distribution.unprotected++;
      else distribution.critical++;
    }

    const averageScore = total > 0 ? Math.round(totalScore / total) : 0;

    return {
      neverPushed,
      missingRemotes,
      withUnpushed,
      recentlyBackedUp,
      distribution,
      averageScore,
    };
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Average Score Gauge */}
        <Card className="bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent border-emerald-500/20">
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Avg Backup Score</span>
            <div className="flex items-baseline gap-1 mt-2">
              <h2 className="text-3xl font-extrabold text-emerald-500">{stats.averageScore}</h2>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {stats.averageScore >= 90 ? "Excellent coverage" : stats.averageScore >= 70 ? "Good coverage" : "High risk level"}
            </p>
          </CardContent>
        </Card>

        {/* Never Pushed */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Never Pushed</span>
              <CloudOff className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold mt-2">{stats.neverPushed.length}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Repositories without online push</p>
          </CardContent>
        </Card>

        {/* Missing Remotes */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">No Remotes</span>
              <CloudOff className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold mt-2">{stats.missingRemotes.length}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Repositories on local drive only</p>
          </CardContent>
        </Card>

        {/* Unpushed Commits */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Unpushed Commits</span>
              <ArrowUpFromLine className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold mt-2">{stats.withUnpushed.length}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Projects with unbacked changes</p>
          </CardContent>
        </Card>

        {/* Recently Backed Up */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Backed Up 7d</span>
              <Cloud className="h-4 w-4 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold mt-2">{stats.recentlyBackedUp.length}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Repositories synchronized recently</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution & Vuln Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup Distribution Visual */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              Backup Distribution
            </h3>
            
            <div className="space-y-4">
              {/* Synchronized */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Fully Synchronized</span>
                  <span className="text-muted-foreground">{stats.distribution.synchronized}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${projects.length > 0 ? (stats.distribution.synchronized / projects.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Protected */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Protected</span>
                  <span className="text-muted-foreground">{stats.distribution.protected}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500"
                    style={{ width: `${projects.length > 0 ? (stats.distribution.protected / projects.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Partially Protected */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Partially Protected</span>
                  <span className="text-muted-foreground">{stats.distribution.partially}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${projects.length > 0 ? (stats.distribution.partially / projects.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* At Risk */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">At Risk</span>
                  <span className="text-muted-foreground">{stats.distribution.atRisk}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${projects.length > 0 ? (stats.distribution.atRisk / projects.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Unprotected */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Unprotected</span>
                  <span className="text-muted-foreground">{stats.distribution.unprotected}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${projects.length > 0 ? (stats.distribution.unprotected / projects.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Critical */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Critical (No Backups)</span>
                  <span className="text-muted-foreground">{stats.distribution.critical}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${projects.length > 0 ? (stats.distribution.critical / projects.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings of vulnerable repositories */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              Backup Synchronization Required
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {stats.withUnpushed.length === 0 && stats.missingRemotes.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground font-light leading-relaxed">
                  No synchronization actions required. All repositories are backed up.
                </div>
              ) : (
                <>
                  {stats.withUnpushed.slice(0, 10).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40 text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{p.name}</span>
                        <p className="text-muted-foreground mt-0.5 font-light">Has {p.unpushedCommits} local commit{p.unpushedCommits > 1 ? "s" : ""} waiting for push.</p>
                      </div>
                      <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-mono uppercase">
                        Unpushed
                      </span>
                    </div>
                  ))}
                  {stats.missingRemotes.slice(0, 10).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40 text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{p.name}</span>
                        <p className="text-muted-foreground mt-0.5 font-light">Repository is local only. No remote backup target defined.</p>
                      </div>
                      <span className="text-[10px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full font-mono uppercase">
                        No Remote
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
