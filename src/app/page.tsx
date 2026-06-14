"use client";

import { useCallback, useState, useTransition } from "react";
import { Header } from "@/components/dashboard/header";
import { FolderPicker } from "@/components/dashboard/folder-picker";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { AnalyticsCards } from "@/components/dashboard/analytics-cards";
import { ProjectTable } from "@/components/dashboard/project-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ScanSkeleton } from "@/components/dashboard/scan-skeleton";
import { DisasterPrevention } from "@/components/dashboard/disaster-prevention";
import { BackupDashboard } from "@/components/dashboard/backup-dashboard";
import { RecoveryDashboard } from "@/components/dashboard/recovery-dashboard";
import { ProjectVault } from "@/components/dashboard/project-vault";
import { SnapshotCenter } from "@/components/dashboard/snapshot-center";
import { MigrationCenter } from "@/components/dashboard/migration-center";
import { ActivityCenter } from "@/components/dashboard/activity-center";
import { ReportingCenter } from "@/components/dashboard/reporting-center";
import { SettingsCenter } from "@/components/dashboard/settings-center";
import type {
  AnalyticsStats,
  DashboardStats,
  ProjectInfo,
  ScanResponse,
} from "@/lib/types";
import { Clock, Zap, FolderGit2, AlertOctagon, CloudLightning, Activity, ShieldAlert, Archive, FileText, Settings, Camera, HelpCircle } from "lucide-react";

// ── Stats derivation ───────────────────────────────────────────

function deriveStats(projects: ProjectInfo[]): DashboardStats {
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  return {
    total: projects.length,
    gitProjects: projects.filter((p) => p.isGit).length,
    nonGitProjects: projects.filter((p) => !p.isGit).length,
    recentlyModified: projects.filter(
      (p) => now - new Date(p.lastModified).getTime() < SEVEN_DAYS_MS,
    ).length,
    criticalCount: projects.filter((p) => p.riskLevel === "critical").length,
    highCount: projects.filter((p) => p.riskLevel === "high").length,
    mediumCount: projects.filter((p) => p.riskLevel === "medium").length,
    lowCount: projects.filter((p) => p.riskLevel === "low").length,
  };
}

// ── Analytics derivation (Phase 2) ─────────────────────────────

function deriveAnalytics(projects: ProjectInfo[]): AnalyticsStats {
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const gitProjects = projects.filter((p) => p.isGit);

  const totalHealth = projects.reduce(
    (sum, p) => sum + p.healthScore.score,
    0,
  );

  return {
    withUncommitted: gitProjects.filter(
      (p) => (p.gitIntelligence?.uncommittedFileCount ?? 0) > 0,
    ).length,
    withUntracked: gitProjects.filter(
      (p) => (p.gitIntelligence?.untrackedFileCount ?? 0) > 0,
    ).length,
    withUnpushed: gitProjects.filter(
      (p) => p.unpushedCommits > 0,
    ).length,
    missingRemotes: projects.filter((p) => p.isGit && !p.hasRemote).length,
    recentlyActive: projects.filter(
      (p) => now - new Date(p.lastModified).getTime() < SEVEN_DAYS_MS,
    ).length,
    staleProjects: projects.filter(
      (p) => now - new Date(p.lastModified).getTime() > THIRTY_DAYS_MS,
    ).length,
    averageHealthScore:
      projects.length > 0 ? totalHealth / projects.length : 0,
  };
}

// ── Page state ─────────────────────────────────────────────────

type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "done"; data: ScanResponse }
  | { status: "error"; message: string };

type DashboardTab =
  | "projects"
  | "vault"
  | "migration"
  | "disaster"
  | "backup"
  | "recovery"
  | "activity"
  | "snapshots"
  | "reports"
  | "settings";

// ── Component ──────────────────────────────────────────────────

export default function DashboardPage() {
  const [state, setState] = useState<ScanState>({ status: "idle" });
  const [lastPath, setLastPath] = useState<string>("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("projects");
  const [, startTransition] = useTransition();

  const handleScan = useCallback(
    (rootPath: string) => {
      setLastPath(rootPath);
      setState({ status: "scanning" });

      startTransition(() => {
        fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rootPath }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(
                (body as { error?: string }).error ??
                  `Scan failed with status ${res.status}`,
              );
            }
            return res.json() as Promise<ScanResponse>;
          })
          .then((data) => {
            setState({ status: "done", data });
          })
          .catch((err: unknown) => {
            setState({
              status: "error",
              message:
                err instanceof Error
              ? err.message
              : "An unexpected error occurred.",
            });
          });
      });
    },
    [startTransition],
  );

  const isScanning = state.status === "scanning";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Hero / folder picker section */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Dashboard
              </h2>
              <p className="mt-1 text-muted-foreground">
                Scan a root directory to monitor the Git health, Backup levels, and Recovery readiness of your projects.
              </p>
            </div>
            <FolderPicker
              onScan={handleScan}
              isScanning={isScanning}
              lastPath={lastPath}
            />
          </section>

          {/* Main content */}
          {state.status === "idle" && <EmptyState />}

          {state.status === "scanning" && <ScanSkeleton />}

          {state.status === "error" && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
              <p className="font-medium text-red-600 dark:text-red-400">
                Scan failed
              </p>
              <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">
                {state.message}
              </p>
            </div>
          )}

          {state.status === "done" && (
            <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* Scan metadata */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Scanned at{" "}
                  {new Date(state.data.scannedAt).toLocaleTimeString()}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" />
                  {state.data.scanDurationMs}ms
                </span>
                <span className="font-mono">{state.data.rootPath}</span>
              </div>

              {/* Phase 1: Overview stats */}
              <StatsCards stats={deriveStats(state.data.projects)} />

              {/* Phase 2: Analytics widgets */}
              <AnalyticsCards
                stats={deriveAnalytics(state.data.projects)}
              />

              {/* Phase 4 Tab Controls */}
              <div className="flex border-b border-border/60 pb-px overflow-x-auto gap-2 scrollbar-none">
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === "projects"
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <FolderGit2 className="h-4 w-4" />
                  Projects View
                </button>
                <button
                  onClick={() => setActiveTab("vault")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === "vault"
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <Archive className="h-4 w-4" />
                  Inventory Vault
                </button>
                <button
                  onClick={() => setActiveTab("migration")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === "migration"
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  Migration Readiness
                </button>
                <button
                  onClick={() => setActiveTab("disaster")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === "disaster"
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <AlertOctagon className="h-4 w-4" />
                  Disaster Alerts
                </button>
                <button
                  onClick={() => setActiveTab("backup")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === "backup"
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <CloudLightning className="h-4 w-4" />
                  Backup Status
                </button>
                <button
                  onClick={() => setActiveTab("recovery")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === "recovery"
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  Recovery Readiness
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === "activity"
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  Activity Log
                </button>
                <button
                  onClick={() => setActiveTab("snapshots")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === "snapshots"
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  Snapshot Engine
                </button>
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === "reports"
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Reports Center
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === "settings"
                      ? "border-primary text-foreground bg-muted/40"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Settings Center
                </button>
              </div>

              {/* Render Tab Contents */}
              <div className="mt-2 animate-in fade-in duration-300">
                {activeTab === "projects" && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold tracking-tight">
                        Project Directory Details
                      </h3>
                    </div>
                    <ProjectTable projects={state.data.projects} />
                  </section>
                )}

                {activeTab === "vault" && (
                  <section>
                    <ProjectVault projects={state.data.projects} />
                  </section>
                )}

                {activeTab === "migration" && (
                  <section>
                    <MigrationCenter />
                  </section>
                )}

                {activeTab === "disaster" && (
                  <section>
                    <DisasterPrevention projects={state.data.projects} />
                  </section>
                )}

                {activeTab === "backup" && (
                  <section>
                    <BackupDashboard projects={state.data.projects} />
                  </section>
                )}

                {activeTab === "recovery" && (
                  <section>
                    <RecoveryDashboard projects={state.data.projects} />
                  </section>
                )}

                {activeTab === "activity" && (
                  <section>
                    <ActivityCenter />
                  </section>
                )}

                {activeTab === "snapshots" && (
                  <section>
                    <SnapshotCenter onTriggerScan={() => handleScan(state.data.rootPath)} />
                  </section>
                )}

                {activeTab === "reports" && (
                  <section>
                    <ReportingCenter projects={state.data.projects} />
                  </section>
                )}

                {activeTab === "settings" && (
                  <section>
                    <SettingsCenter />
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        Project Guardian · Backup & Disaster Prevention Platform
      </footer>
    </div>
  );
}
