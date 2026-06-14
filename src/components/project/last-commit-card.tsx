"use client";

import { GitCommitHorizontal, User, Clock, MessageSquare, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectInfo } from "@/lib/types";

interface LastCommitCardProps {
  project: ProjectInfo;
}

export function LastCommitCard({ project }: LastCommitCardProps) {
  const commit = project.gitIntelligence?.lastCommit;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />
          Last Commit
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!commit ? (
          <p className="text-sm text-muted-foreground">
            {project.isGit ? "No commits yet." : "Not a Git repository."}
          </p>
        ) : (
          <div className="space-y-3">
            {/* Commit message */}
            <div className="flex items-start gap-2">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm font-medium leading-snug">
                {commit.message}
              </p>
            </div>

            {/* Hash */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="h-4 w-4" />
              <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs">
                {commit.hash}
              </code>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                {commit.author}{" "}
                <span className="text-muted-foreground/60">
                  &lt;{commit.email}&gt;
                </span>
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{new Date(commit.date).toLocaleString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
