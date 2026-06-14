"use client";

import {
  GitBranch,
  GitCommitHorizontal,
  HardDrive,
  FileWarning,
  FilePlus2,
  ArrowUpFromLine,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectInfo } from "@/lib/types";

interface GitInfoCardProps {
  project: ProjectInfo;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueColor?: string;
}

function InfoRow({ icon, label, value, valueColor }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-sm font-medium ${valueColor ?? ""}`}>{value}</span>
    </div>
  );
}

export function GitInfoCard({ project }: GitInfoCardProps) {
  const gi = project.gitIntelligence;

  if (!project.isGit || !gi) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Git Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This project is not a Git repository.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Git Overview</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/40">
        <InfoRow
          icon={<GitBranch className="h-4 w-4" />}
          label="Current Branch"
          value={project.branch ?? "—"}
        />
        <InfoRow
          icon={<GitBranch className="h-4 w-4" />}
          label="Default Branch"
          value={gi.defaultBranch ?? "—"}
        />
        <InfoRow
          icon={<GitCommitHorizontal className="h-4 w-4" />}
          label="Total Branches"
          value={gi.branchCount}
        />
        <InfoRow
          icon={<FileWarning className="h-4 w-4" />}
          label="Uncommitted Files"
          value={gi.uncommittedFileCount}
          valueColor={gi.uncommittedFileCount > 0 ? "text-amber-500" : ""}
        />
        <InfoRow
          icon={<FilePlus2 className="h-4 w-4" />}
          label="Untracked Files"
          value={gi.untrackedFileCount}
          valueColor={gi.untrackedFileCount > 0 ? "text-orange-500" : ""}
        />
        <InfoRow
          icon={<ArrowUpFromLine className="h-4 w-4" />}
          label="Unpushed Commits"
          value={gi.localCommitsNotPushed}
          valueColor={gi.localCommitsNotPushed > 0 ? "text-sky-500" : ""}
        />
        <InfoRow
          icon={<ArrowUpFromLine className="h-4 w-4" />}
          label="Ahead / Behind"
          value={`↑${gi.aheadBehind.ahead}  ↓${gi.aheadBehind.behind}`}
        />
        <InfoRow
          icon={<HardDrive className="h-4 w-4" />}
          label="Repository Size"
          value={formatBytes(gi.repoSizeBytes)}
        />
      </CardContent>
    </Card>
  );
}
