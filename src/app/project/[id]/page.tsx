"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { HealthGauge } from "@/components/project/health-gauge";
import { GitInfoCard } from "@/components/project/git-info-card";
import { LastCommitCard } from "@/components/project/last-commit-card";
import { BranchInfoCard } from "@/components/project/branch-info-card";
import { RemoteInfoCard } from "@/components/project/remote-info-card";
import { RiskAnalysisCard } from "@/components/project/risk-analysis-card";
import { ProjectActions } from "@/components/project/project-actions";
import { RiskBadge } from "@/components/dashboard/risk-badge";
import { ProviderBadge } from "@/components/dashboard/provider-badge";
import { SafetyGauges } from "@/components/project/safety-gauges";
import { Timeline } from "@/components/project/timeline";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ProjectInfo, ProjectDetailResponse, ProjectCategory, ProjectStatus } from "@/lib/types";

type PageState =
  | { status: "loading" }
  | { status: "done"; project: ProjectInfo }
  | { status: "error"; message: string };

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: "loading" });

  // Phase 4 Registry form states
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProjectCategory>("Personal");
  const [client, setClient] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Active");
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [techStack, setTechStack] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!params.id) {
      setState({ status: "error", message: "No project ID provided." });
      return;
    }

    fetch(`/api/project?id=${encodeURIComponent(params.id)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? `Failed with status ${res.status}`,
          );
        }
        return res.json() as Promise<ProjectDetailResponse>;
      })
      .then((data) => {
        setState({ status: "done", project: data.project });
      })
      .catch((err: unknown) => {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "An unexpected error occurred.",
        });
      });
  }, [params.id]);

  useEffect(() => {
    if (state.status === "done") {
      const reg = state.project.registryMetadata;
      if (reg) {
        setDescription(reg.description || "");
        setCategory(reg.category);
        setClient(reg.client || "");
        setStatus(reg.status);
        setDeploymentUrl(reg.deploymentUrl || "");
        setTechStack(reg.technologyStack.join(", "));
        setNotes(reg.notes || "");
      }
    }
  }, [state]);

  const handleSaveMetadata = async () => {
    if (state.status !== "done") return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: state.project.id,
          updates: {
            description: description.trim() || null,
            category,
            client: client.trim() || null,
            status,
            deploymentUrl: deploymentUrl.trim() || null,
            technologyStack: techStack.split(",").map((s) => s.trim()).filter(Boolean),
            notes: notes.trim() || null,
          },
        }),
      });
      if (res.ok) {
        const resDetail = await fetch(`/api/project?id=${encodeURIComponent(params.id)}`);
        if (resDetail.ok) {
          const data = await resDetail.json() as ProjectDetailResponse;
          setState({ status: "done", project: data.project });
          alert("Project portfolio metadata updated successfully.");
        }
      } else {
        const body = await res.json().catch(() => ({}));
        alert(`Failed to save: ${body.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("An error occurred while saving metadata.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Dashboard
        </Button>

        {state.status === "loading" && <ProjectDetailSkeleton />}

        {state.status === "error" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <p className="font-medium text-red-600 dark:text-red-400">
              Failed to load project
            </p>
            <p className="mt-1 text-sm text-red-600/80 dark:text-red-400/80">
              {state.message}
            </p>
          </div>
        )}

        {state.status === "done" && (
          <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Project header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {state.project.name}
                  </h1>
                  <RiskBadge level={state.project.riskLevel} />
                  {state.project.isGit && (
                    <ProviderBadge provider={state.project.provider} />
                  )}
                </div>
                <p className="font-mono text-sm text-muted-foreground">
                  {state.project.path}
                </p>
              </div>
              <ProjectActions project={state.project} />
            </div>

            {/* Health + Overview row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <HealthGauge healthScore={state.project.healthScore} />
              </div>
              <div className="lg:col-span-2">
                <GitInfoCard project={state.project} />
              </div>
            </div>

            {/* Phase 3 Backup & Recovery details */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Safety Gauges (Phase 3) */}
                <SafetyGauges
                  backupSafetyScore={state.project.backupSafetyScore}
                  recoveryReadinessScore={state.project.recoveryReadinessScore}
                />

                {/* Detailed Actionable Recommendations */}
                <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Resilience Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs pt-2">
                    {state.project.backupSafetyScore.recommendations.length === 0 &&
                    state.project.recoveryReadinessScore.recommendations.length === 0 ? (
                      <p className="text-emerald-500 font-medium">All systems green! No recommendations required.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Backup Recommendations */}
                        {state.project.backupSafetyScore.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px] border-b border-border pb-1">
                              Backup Security
                            </h4>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground font-light">
                              {state.project.backupSafetyScore.recommendations.map((rec, i) => (
                                <li key={i} className="leading-relaxed">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Recovery Recommendations */}
                        {state.project.recoveryReadinessScore.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px] border-b border-border pb-1">
                              Disaster Recovery
                            </h4>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground font-light">
                              {state.project.recoveryReadinessScore.recommendations.map((rec, i) => (
                                <li key={i} className="leading-relaxed">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Timeline (Phase 3) */}
              <div className="lg:col-span-1">
                <Card className="border-border/40 bg-card/40 backdrop-blur-xl h-full">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Project Safety Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[450px]">
                    <Timeline events={state.project.timeline} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Portfolio Metadata Form Editor Card (Phase 4) */}
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Portfolio Registry Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                      className="w-full rounded-lg border border-border bg-background/50 p-2 text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="Personal">Personal</option>
                      <option value="Client">Client</option>
                      <option value="Startup">Startup</option>
                      <option value="Production">Production</option>
                      <option value="Learning">Learning</option>
                      <option value="Experimental">Experimental</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  {/* Status select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      className="w-full rounded-lg border border-border bg-background/50 p-2 text-foreground focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Paused">Paused</option>
                      <option value="Completed">Completed</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  {/* Client */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Client Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background/50 p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  {/* Deployment URL */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Deployment URL</label>
                    <input
                      type="text"
                      placeholder="https://my-app.vercel.app"
                      value={deploymentUrl}
                      onChange={(e) => setDeploymentUrl(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background/50 p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Technology Stack (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="Next.js, TypeScript, Tailwind, Postgres"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background/50 p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    placeholder="A brief summary of what this project accomplishes"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background/50 p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Development Notes</label>
                  <textarea
                    placeholder="Document setup, deployment commands, environment configurations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border bg-background/50 p-2 text-foreground focus:ring-1 focus:ring-primary outline-none resize-y"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                  <Button
                    onClick={handleSaveMetadata}
                    disabled={isSaving}
                    className="cursor-pointer bg-primary text-primary-foreground text-xs"
                  >
                    {isSaving ? "Saving Settings..." : "Save Portfolio Metadata"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Detail cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <LastCommitCard project={state.project} />
              <BranchInfoCard project={state.project} />
              <RemoteInfoCard project={state.project} />
              <RiskAnalysisCard project={state.project} />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        Project Guardian · Local-first project health monitor
      </footer>
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
