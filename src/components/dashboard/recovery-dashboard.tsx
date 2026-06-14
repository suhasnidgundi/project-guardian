"use client";

import { useMemo } from "react";
import { ShieldAlert, BookOpen, EyeOff, HardDrive, BarChart2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectInfo } from "@/lib/types";

interface RecoveryDashboardProps {
  projects: ProjectInfo[];
}

export function RecoveryDashboard({ projects }: RecoveryDashboardProps) {
  const stats = useMemo(() => {
    const total = projects.length;

    // 1. Projects missing README
    const missingReadme = projects.filter((p) => {
      // Non-git and git can both have README check
      return !p.recoveryReadinessScore.penalties.some((pen) => pen.reason === "no_readme") 
        ? false 
        : true;
    });

    // 2. Projects missing .gitignore
    const missingGitignore = projects.filter((p) => {
      return p.recoveryReadinessScore.penalties.some((pen) => pen.reason === "no_gitignore");
    });

    // 3. Projects missing dependency file
    const missingManifest = projects.filter((p) => {
      return p.recoveryReadinessScore.penalties.some((pen) => pen.reason === "no_package_file");
    });

    // 4. Large repositories > 1GB
    const largeRepos = projects.filter((p) => {
      return p.recoveryReadinessScore.penalties.some((pen) => pen.reason === "large_repo");
    });

    // 5. Recovery Readiness Distribution
    const distribution = {
      fullyReady: 0,
      ready: 0,
      partially: 0,
      notReady: 0,
      critical: 0,
    };

    let totalScore = 0;
    for (const p of projects) {
      const score = p.recoveryReadinessScore.score;
      totalScore += score;

      if (p.recoveryReadinessScore.status === "Fully Ready") distribution.fullyReady++;
      else if (p.recoveryReadinessScore.status === "Ready") distribution.ready++;
      else if (p.recoveryReadinessScore.status === "Partially Ready") distribution.partially++;
      else if (p.recoveryReadinessScore.status === "Not Ready") distribution.notReady++;
      else distribution.critical++;
    }

    const averageScore = total > 0 ? Math.round(totalScore / total) : 0;

    return {
      missingReadme,
      missingGitignore,
      missingManifest,
      largeRepos,
      distribution,
      averageScore,
    };
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Average Score Gauge */}
        <Card className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20">
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Avg Recovery Score</span>
            <div className="flex items-baseline gap-1 mt-2">
              <h2 className="text-3xl font-extrabold text-teal-500">{stats.averageScore}</h2>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {stats.averageScore >= 90 ? "Excellent recoverability" : stats.averageScore >= 70 ? "Ready for disaster" : "High configuration risk"}
            </p>
          </CardContent>
        </Card>

        {/* Missing READMEs */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">No README.md</span>
              <BookOpen className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold mt-2">{stats.missingReadme.length}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Projects missing instructions</p>
          </CardContent>
        </Card>

        {/* Missing Gitignores */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">No .gitignore</span>
              <EyeOff className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold mt-2">{stats.missingGitignore.length}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Projects without ignore filters</p>
          </CardContent>
        </Card>

        {/* Missing Manifests */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">No Manifests</span>
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold mt-2">{stats.missingManifest.length}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Missing dependency package files</p>
          </CardContent>
        </Card>

        {/* Large Repos >1GB */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Large Repos</span>
              <HardDrive className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-3xl font-bold mt-2">{stats.largeRepos.length}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Repositories exceeding 1GB in size</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recovery Readiness Distribution */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              Recovery Distribution
            </h3>

            <div className="space-y-4">
              {/* Fully Ready */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Fully Ready</span>
                  <span className="text-muted-foreground">{stats.distribution.fullyReady}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${projects.length > 0 ? (stats.distribution.fullyReady / projects.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Ready */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Ready</span>
                  <span className="text-muted-foreground">{stats.distribution.ready}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500"
                    style={{ width: `${projects.length > 0 ? (stats.distribution.ready / projects.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Partially Ready */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Partially Ready</span>
                  <span className="text-muted-foreground">{stats.distribution.partially}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${projects.length > 0 ? (stats.distribution.partially / projects.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Not Ready */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Not Ready</span>
                  <span className="text-muted-foreground">{stats.distribution.notReady}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${projects.length > 0 ? (stats.distribution.notReady / projects.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Critical */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Critical (High Risk)</span>
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

        {/* Listings of READMEs and ignore files missing */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              Recovery Configuration Checklist
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {stats.missingReadme.length === 0 && stats.missingGitignore.length === 0 && stats.missingManifest.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground font-light leading-relaxed">
                  No configuration warnings. All projects have readmes, ignore rules, and manifests.
                </div>
              ) : (
                <>
                  {stats.missingReadme.slice(0, 8).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40 text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{p.name}</span>
                        <p className="text-muted-foreground mt-0.5 font-light">Lacks instructions on how to install and setup after recovery.</p>
                      </div>
                      <span className="text-[10px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full font-mono uppercase">
                        Missing README
                      </span>
                    </div>
                  ))}
                  {stats.missingGitignore.slice(0, 8).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40 text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{p.name}</span>
                        <p className="text-muted-foreground mt-0.5 font-light">Prone to committing sensitive build environments or binary logs.</p>
                      </div>
                      <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-mono uppercase">
                        No .gitignore
                      </span>
                    </div>
                  ))}
                  {stats.missingManifest.slice(0, 8).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40 text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{p.name}</span>
                        <p className="text-muted-foreground mt-0.5 font-light">No standard package configuration manifest found in root.</p>
                      </div>
                      <span className="text-[10px] text-zinc-500 bg-zinc-500/15 px-2 py-0.5 rounded-full font-mono uppercase">
                        No Manifest
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
