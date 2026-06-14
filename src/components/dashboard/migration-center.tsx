"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldAlert, FileText, HardDrive, RefreshCw, Folder } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MigrationReport } from "@/lib/types";

export function MigrationCenter() {
  const [report, setReport] = useState<MigrationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMigrationReport();
  }, []);

  const fetchMigrationReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/migration");
      if (res.ok) {
        const data = await res.json() as { report: MigrationReport };
        setReport(data.report);
      }
    } catch (err) {
      console.error("Failed to load migration report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: MigrationReport["status"]) => {
    switch (status) {
      case "SAFE":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20",
          text: "text-emerald-500",
          desc: "Safe to Format",
          icon: <CheckCircle2 className="h-12 w-12 text-emerald-500" />,
        };
      case "WARNING":
        return {
          bg: "bg-amber-500/10 border-amber-500/20",
          text: "text-amber-500",
          desc: "Proceed with Caution",
          icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
        };
      case "UNSAFE":
        return {
          bg: "bg-red-500/10 border-red-500/20",
          text: "text-red-500",
          desc: "Do Not Format",
          icon: <ShieldAlert className="h-12 w-12 text-red-500 animate-pulse" />,
        };
    }
  };

  const statusConfig = report ? getStatusConfig(report.status) : null;

  return (
    <div className="space-y-6">
      {/* Big macOS status banner */}
      <Card className={`border ${statusConfig?.bg || "border-border/40 bg-card/40"} backdrop-blur-xl transition-all duration-500`}>
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-6 flex-wrap md:flex-nowrap justify-center md:justify-start">
            <div className="shrink-0">{statusConfig?.icon || <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin" />}</div>
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Machine Migration readiness status</span>
              <h2 className="text-2xl font-bold tracking-tight">Can I safely format my computer today?</h2>
              {report ? (
                <p className="text-sm font-medium text-muted-foreground mt-1 leading-relaxed max-w-xl">
                  {report.message}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Loading report, verifying Git status, pushing indicators...</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <Button
              onClick={fetchMigrationReport}
              disabled={isLoading}
              variant="outline"
              className="cursor-pointer border-border/40 hover:bg-muted/50 w-full md:w-auto text-xs"
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Recalculate Readiness
            </Button>
            {report && (
              <Badge variant="outline" className={`text-sm py-1 justify-center ${statusConfig?.bg} ${statusConfig?.text} font-bold border`}>
                {statusConfig?.desc}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Summary checklist counts */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-sm">Audited Folders Breakdown</h3>
                <div className="divide-y divide-border/60">
                  <div className="flex justify-between py-2.5 text-xs">
                    <span className="text-muted-foreground font-light">Total Projects Checked</span>
                    <span className="font-bold font-mono">{report.checkSummary.totalChecked}</span>
                  </div>
                  <div className="flex justify-between py-2.5 text-xs">
                    <span className="text-muted-foreground font-light">Local-only Repositories</span>
                    <span className={`font-bold font-mono ${report.checkSummary.localOnlyCount > 0 ? "text-red-500" : ""}`}>
                      {report.checkSummary.localOnlyCount}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 text-xs">
                    <span className="text-muted-foreground font-light">Unpushed Local Commits</span>
                    <span className={`font-bold font-mono ${report.checkSummary.unpushedCount > 0 ? "text-amber-500" : ""}`}>
                      {report.checkSummary.unpushedCount}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 text-xs">
                    <span className="text-muted-foreground font-light">Inaccessible Online Remotes</span>
                    <span className={`font-bold font-mono ${report.checkSummary.deletedRemoteCount > 0 ? "text-amber-500" : ""}`}>
                      {report.checkSummary.deletedRemoteCount}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 text-xs">
                    <span className="text-muted-foreground font-light">Critical Backups Blocker</span>
                    <span className={`font-bold font-mono ${report.checkSummary.criticalCount > 0 ? "text-red-500" : ""}`}>
                      {report.checkSummary.criticalCount}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed alerts feed */}
          <div className="lg:col-span-2">
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl h-full">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm">Vulnerable Folders Checklist</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Resolve these issues to guarantee zero code loss during machine migration.
                  </p>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {report.blockedProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                      <h4 className="font-semibold text-sm">Backup Complete</h4>
                      <p className="text-xs text-muted-foreground mt-1">All registered project files are safely synchronized online.</p>
                    </div>
                  ) : (
                    report.blockedProjects.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
                          alert.severity === "critical"
                            ? "bg-red-500/5 border-red-500/10"
                            : alert.severity === "high"
                            ? "bg-amber-500/5 border-amber-500/10"
                            : "bg-muted/30 border-border/40"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {alert.severity === "critical" ? (
                            <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                          ) : (
                            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{alert.name}</span>
                            <Badge
                              variant={
                                alert.severity === "critical"
                                  ? "destructive"
                                  : alert.severity === "high"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[8px] uppercase px-1.5 py-0"
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed font-light">{alert.reason}</p>
                          <span className="font-mono text-[9px] text-muted-foreground/60 block pt-1">
                            Path: {alert.path}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
