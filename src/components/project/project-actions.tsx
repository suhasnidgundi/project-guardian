"use client";

import { useState } from "react";
import {
  Code2,
  FolderOpen,
  Copy,
  Link2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectInfo } from "@/lib/types";

interface ProjectActionsProps {
  project: ProjectInfo;
}

type CopyState = "idle" | "path" | "url";

export function ProjectActions({ project }: ProjectActionsProps) {
  const [copied, setCopied] = useState<CopyState>("idle");

  const copyToClipboard = async (text: string, which: CopyState) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied("idle"), 2000);
    } catch {
      // Clipboard API failed — silently ignore in local-first context.
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Open in VS Code */}
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer gap-1.5 text-xs"
        onClick={() => {
          window.open(`vscode://file${project.path}`, "_self");
        }}
        aria-label="Open in VS Code"
      >
        <Code2 className="h-3.5 w-3.5" />
        Open in VS Code
      </Button>

      {/* Open in Finder */}
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer gap-1.5 text-xs"
        onClick={() => {
          // Uses the custom protocol; works on macOS.
          // For cross-platform, a backend action endpoint would be needed.
          window.open(`file://${project.path}`, "_self");
        }}
        aria-label="Open in Finder"
      >
        <FolderOpen className="h-3.5 w-3.5" />
        Open in Finder
      </Button>

      {/* Copy path */}
      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer gap-1.5 text-xs"
        onClick={() => copyToClipboard(project.path, "path")}
        aria-label="Copy repository path"
      >
        {copied === "path" ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied === "path" ? "Copied!" : "Copy Path"}
      </Button>

      {/* Copy remote URL */}
      {project.remoteUrl && (
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1.5 text-xs"
          onClick={() => copyToClipboard(project.remoteUrl!, "url")}
          aria-label="Copy git remote URL"
        >
          {copied === "url" ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
          {copied === "url" ? "Copied!" : "Copy Remote URL"}
        </Button>
      )}
    </div>
  );
}
