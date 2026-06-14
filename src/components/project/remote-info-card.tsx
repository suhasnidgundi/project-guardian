"use client";

import { Globe, Link2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProviderBadge } from "@/components/dashboard/provider-badge";
import type { ProjectInfo } from "@/lib/types";

interface RemoteInfoCardProps {
  project: ProjectInfo;
}

/** Normalise SSH git remote URLs into HTTPS for browser links. */
function normalizeRemoteUrl(url: string): string {
  const sshMatch = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://${sshMatch[1]}/${sshMatch[2]}`;
  }
  return url.replace(/\.git$/, "");
}

export function RemoteInfoCard({ project }: RemoteInfoCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Remote Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!project.hasRemote ? (
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
            >
              No Remote Configured
            </Badge>
            <p className="text-sm text-muted-foreground">
              This repository has no remote. Code is only stored locally
              and is at risk of data loss.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Provider */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Provider</span>
              <ProviderBadge provider={project.provider} />
            </div>

            {/* Remote URL */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link2 className="h-4 w-4" />
                <span>Remote URL</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2">
                <code className="flex-1 truncate font-mono text-xs">
                  {project.remoteUrl}
                </code>
                {project.remoteUrl && (
                  <a
                    href={normalizeRemoteUrl(project.remoteUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Open remote in browser"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
