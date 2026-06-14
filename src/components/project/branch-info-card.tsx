"use client";

import { GitBranch, GitMerge, ArrowUpFromLine, ArrowDownToLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectInfo } from "@/lib/types";

interface BranchInfoCardProps {
  project: ProjectInfo;
}

export function BranchInfoCard({ project }: BranchInfoCardProps) {
  const gi = project.gitIntelligence;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <GitMerge className="h-4 w-4 text-muted-foreground" />
          Branch Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!project.isGit || !gi ? (
          <p className="text-sm text-muted-foreground">Not a Git repository.</p>
        ) : (
          <div className="space-y-4">
            {/* Current branch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitBranch className="h-4 w-4" />
                <span>Current</span>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 font-mono text-xs text-emerald-600 dark:text-emerald-400"
              >
                {project.branch ?? "detached"}
              </Badge>
            </div>

            {/* Default branch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitBranch className="h-4 w-4" />
                <span>Default</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {gi.defaultBranch ?? "unknown"}
              </Badge>
            </div>

            {/* Branch count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <GitMerge className="h-4 w-4" />
                <span>Total Branches</span>
              </div>
              <span className="text-sm font-medium">{gi.branchCount}</span>
            </div>

            {/* Ahead / Behind */}
            <div className="flex items-center gap-4 rounded-lg bg-muted/30 p-3">
              <div className="flex flex-1 items-center justify-center gap-1.5">
                <ArrowUpFromLine className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">{gi.aheadBehind.ahead}</span>
                <span className="text-xs text-muted-foreground">ahead</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex flex-1 items-center justify-center gap-1.5">
                <ArrowDownToLine className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{gi.aheadBehind.behind}</span>
                <span className="text-xs text-muted-foreground">behind</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
