"use client";

import { useState } from "react";
import { Download, Printer, FileSpreadsheet, FileJson, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProjectInfo } from "@/lib/types";

interface ReportingCenterProps {
  projects: ProjectInfo[];
}

export function ReportingCenter({ projects }: ReportingCenterProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  // Trigger file download helper
  const triggerDownload = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. JSON Export
  const exportJSON = (type: "portfolio" | "backup" | "recovery") => {
    setDownloading(type);
    const filename = `guardian-${type}-report-${Date.now()}.json`;
    let content = "";

    if (type === "portfolio") {
      const data = projects.map((p) => {
        const reg = p.registryMetadata || {
          category: "Personal",
          client: "",
          status: "Active",
          deploymentUrl: "",
          technologyStack: [] as string[],
          notes: "",
          createdDate: p.lastModified,
        };
        return {
          id: p.id,
          name: p.name,
          path: p.path,
          category: reg.category,
          client: reg.client,
          status: reg.status,
          repository: p.remoteUrl,
          deployment: reg.deploymentUrl,
          stack: reg.technologyStack,
          notes: reg.notes,
          created: reg.createdDate,
        };
      });
      content = JSON.stringify(data, null, 2);
    } else if (type === "backup") {
      const data = projects.map((p) => ({
        name: p.name,
        isGit: p.isGit,
        hasRemote: p.hasRemote,
        remoteUrl: p.remoteUrl,
        unpushedCommits: p.unpushedCommits,
        backupSafetyScore: p.backupSafetyScore.score,
        backupSafetyStatus: p.backupSafetyScore.status,
        penaltiesCount: p.backupSafetyScore.penalties.length,
      }));
      content = JSON.stringify(data, null, 2);
    } else {
      const data = projects.map((p) => ({
        name: p.name,
        isGit: p.isGit,
        hasReadme: !p.recoveryReadinessScore.penalties.some(pen => pen.reason === "no_readme"),
        hasGitignore: !p.recoveryReadinessScore.penalties.some(pen => pen.reason === "no_gitignore"),
        hasManifest: !p.recoveryReadinessScore.penalties.some(pen => pen.reason === "no_package_file"),
        recoveryReadinessScore: p.recoveryReadinessScore.score,
        recoveryReadinessStatus: p.recoveryReadinessScore.status,
      }));
      content = JSON.stringify(data, null, 2);
    }

    triggerDownload(filename, content, "application/json");
    setDownloading(null);
  };

  // 2. CSV Export
  const exportCSV = (type: "portfolio" | "backup" | "recovery") => {
    setDownloading(type);
    const filename = `guardian-${type}-report-${Date.now()}.csv`;
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === "portfolio") {
      headers = ["ID", "Name", "Path", "Category", "Client", "Status", "Repository URL", "Deployment URL", "Created Date"];
      rows = projects.map((p) => {
        const reg = p.registryMetadata || {
          category: "Personal",
          client: "",
          status: "Active",
          deploymentUrl: "",
          createdDate: p.lastModified,
        };
        return [
          p.id,
          p.name,
          p.path,
          reg.category,
          reg.client || "",
          reg.status,
          p.remoteUrl || "",
          reg.deploymentUrl || "",
          reg.createdDate,
        ];
      });
    } else if (type === "backup") {
      headers = ["Project Name", "Is Git", "Has Remote", "Remote URL", "Unpushed Commits", "Backup Safety Score", "Backup Status"];
      rows = projects.map((p) => [
        p.name,
        p.isGit ? "TRUE" : "FALSE",
        p.hasRemote ? "TRUE" : "FALSE",
        p.remoteUrl || "",
        p.unpushedCommits.toString(),
        p.backupSafetyScore.score.toString(),
        p.backupSafetyScore.status,
      ]);
    } else {
      headers = ["Project Name", "Is Git", "Has README", "Has .gitignore", "Has Manifest", "Recovery Score", "Recovery Status"];
      rows = projects.map((p) => [
        p.name,
        p.isGit ? "TRUE" : "FALSE",
        p.recoveryReadinessScore.penalties.some(pen => pen.reason === "no_readme") ? "FALSE" : "TRUE",
        p.recoveryReadinessScore.penalties.some(pen => pen.reason === "no_gitignore") ? "FALSE" : "TRUE",
        p.recoveryReadinessScore.penalties.some(pen => pen.reason === "no_package_file") ? "FALSE" : "TRUE",
        p.recoveryReadinessScore.score.toString(),
        p.recoveryReadinessScore.status,
      ]);
    }

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    triggerDownload(filename, csvContent, "text/csv");
    setDownloading(null);
  };

  // 3. Print HTML View
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Portfolio Report */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Project Portfolio Registry</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete database listing project categories, client names, stacks, and notes.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV("portfolio")}
                disabled={downloading !== null}
                className="flex-1 cursor-pointer text-xs"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportJSON("portfolio")}
                disabled={downloading !== null}
                className="flex-1 cursor-pointer text-xs"
              >
                <FileJson className="mr-1.5 h-3.5 w-3.5" /> JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup Safety Report */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Backup Safety Audits</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Log tracking synchronized tracking branches, unpushed modifications, and push ages.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV("backup")}
                disabled={downloading !== null}
                className="flex-1 cursor-pointer text-xs"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportJSON("backup")}
                disabled={downloading !== null}
                className="flex-1 cursor-pointer text-xs"
              >
                <FileJson className="mr-1.5 h-3.5 w-3.5" /> JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Readiness Report */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Recovery Readiness Audits</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Details listing readmes, ignore configurations, package manifests, and repository sizes.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV("recovery")}
                disabled={downloading !== null}
                className="flex-1 cursor-pointer text-xs"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportJSON("recovery")}
                disabled={downloading !== null}
                className="flex-1 cursor-pointer text-xs"
              >
                <FileJson className="mr-1.5 h-3.5 w-3.5" /> JSON
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Print Friendly Trigger Card */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Printable Portfolio Summary</h4>
            <p className="text-xs text-muted-foreground">
              Generate a print-ready document of your entire active software portfolio. Ideal for migration records.
            </p>
          </div>
          <Button
            onClick={handlePrint}
            className="cursor-pointer bg-primary text-primary-foreground text-xs"
          >
            <Printer className="mr-2 h-4 w-4" /> Print Portfolio Summary
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
