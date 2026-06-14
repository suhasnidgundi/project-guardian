"use client";

import { ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import type { ProjectInfo } from "@/lib/types";

interface RiskAnalysisCardProps {
  project: ProjectInfo;
}

interface CheckItem {
  label: string;
  passed: boolean;
  detail: string;
}

export function RiskAnalysisCard({ project }: RiskAnalysisCardProps) {
  const gi = project.gitIntelligence;

  const checks: CheckItem[] = [
    {
      label: "Git Initialised",
      passed: project.isGit,
      detail: project.isGit ? "Repository is tracked by Git" : "No Git — critical data loss risk",
    },
    {
      label: "Remote Configured",
      passed: project.hasRemote,
      detail: project.hasRemote
        ? `Remote: ${project.provider}`
        : "No remote — code only exists locally",
    },
    {
      label: "Clean Working Tree",
      passed: !project.uncommittedChanges,
      detail: project.uncommittedChanges
        ? `${gi?.uncommittedFileCount ?? "?"} uncommitted file(s)`
        : "All tracked changes are committed",
    },
    {
      label: "No Untracked Files",
      passed: (gi?.untrackedFileCount ?? 0) === 0,
      detail:
        (gi?.untrackedFileCount ?? 0) > 0
          ? `${gi?.untrackedFileCount} untracked file(s)`
          : "All files are tracked",
    },
    {
      label: "All Commits Pushed",
      passed: project.unpushedCommits === 0,
      detail:
        project.unpushedCommits > 0
          ? `${project.unpushedCommits} commit(s) not pushed to remote`
          : "All commits are pushed upstream",
    },
    {
      label: "Recently Active",
      passed: isRecentlyActive(project.lastModified),
      detail: isRecentlyActive(project.lastModified)
        ? "Active within the last 30 days"
        : "No activity in 30+ days",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-semibold">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            Risk Analysis
          </span>
          <RiskBadge level={project.riskLevel} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{passedCount}</span> of{" "}
          {checks.length} checks passed
        </div>

        <div className="space-y-2">
          {checks.map((check) => (
            <div
              key={check.label}
              className="flex items-start gap-2.5 rounded-md px-2 py-1.5"
            >
              {check.passed ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function isRecentlyActive(lastModified: string): boolean {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(lastModified).getTime() < THIRTY_DAYS_MS;
}
