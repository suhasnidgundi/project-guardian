"use client";

import { useEffect, useState } from "react";
import { Camera, Trash2, ArrowRightLeft, Plus, Calendar, ShieldCheck, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProjectSnapshot, SnapshotDiff } from "@/lib/types";

interface SnapshotCenterProps {
  onTriggerScan: () => void;
}

export function SnapshotCenter({ onTriggerScan }: SnapshotCenterProps) {
  const [snapshots, setSnapshots] = useState<Omit<ProjectSnapshot, "projectStates">[]>([]);
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");
  const [comparison, setComparison] = useState<{
    diff: SnapshotDiff;
    snap1: ProjectSnapshot;
    snap2: ProjectSnapshot;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const fetchSnapshots = async () => {
    try {
      const res = await fetch("/api/snapshots");
      if (res.ok) {
        const data = await res.json() as { snapshots: Omit<ProjectSnapshot, "projectStates">[] };
        setSnapshots(data.snapshots);
      }
    } catch (err) {
      console.error("Failed to load snapshots:", err);
    }
  };

  const handleCreateSnapshot = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      if (res.ok) {
        const data = await res.json() as { snapshots: Omit<ProjectSnapshot, "projectStates">[] };
        setSnapshots(data.snapshots);
      }
    } catch (err) {
      console.error("Failed to create snapshot:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    try {
      const res = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (res.ok) {
        const data = await res.json() as { snapshots: Omit<ProjectSnapshot, "projectStates">[] };
        setSnapshots(data.snapshots);
        if (comparison && (comparison.snap1.id === id || comparison.snap2.id === id)) {
          setComparison(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete snapshot:", err);
    }
  };

  const handleCompare = async () => {
    if (!selectedA || !selectedB) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/snapshots?action=compare&id1=${selectedA}&id2=${selectedB}`);
      if (res.ok) {
        const data = await res.json() as {
          diff: SnapshotDiff;
          snap1: ProjectSnapshot;
          snap2: ProjectSnapshot;
        };
        setComparison(data);
      }
    } catch (err) {
      console.error("Failed to compare snapshots:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action and snapshot list layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Create & list snapshots */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Portfolio Snapshots</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Capture your current workspace stats to compare progress over time.
                </p>
              </div>

              <Button
                onClick={handleCreateSnapshot}
                disabled={isLoading}
                className="w-full cursor-pointer bg-gradient-to-r from-emerald-600 to-cyan-600 text-white flex items-center justify-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {isLoading ? "Capturing..." : "Capture Snapshot"}
              </Button>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {snapshots.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground font-light leading-relaxed">
                    No snapshots captured yet. Run a scan and click create above.
                  </div>
                ) : (
                  snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(snap.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                          {" "}{new Date(snap.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="flex gap-2 text-[10px] text-muted-foreground">
                          <span>{snap.totalProjects} projects</span>
                          <span>•</span>
                          <span className="text-emerald-500 font-medium">B: {snap.averageBackupScore}</span>
                          <span>•</span>
                          <span className="text-teal-500 font-medium">R: {snap.averageRecoveryScore}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        className="text-muted-foreground hover:text-red-500 p-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Diff comparison trigger & result */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" /> Compare Snapshots
              </h3>

              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 space-y-1.5 min-w-[200px]">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Older Snapshot A</label>
                  <select
                    value={selectedA}
                    onChange={(e) => setSelectedA(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground cursor-pointer focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select snapshot...</option>
                    {snapshots.map((snap) => (
                      <option key={snap.id} value={snap.id}>
                        {new Date(snap.timestamp).toLocaleString()} ({snap.totalProjects} Proj)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 space-y-1.5 min-w-[200px]">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Newer Snapshot B</label>
                  <select
                    value={selectedB}
                    onChange={(e) => setSelectedB(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground cursor-pointer focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select snapshot...</option>
                    {snapshots.map((snap) => (
                      <option key={snap.id} value={snap.id}>
                        {new Date(snap.timestamp).toLocaleString()} ({snap.totalProjects} Proj)
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleCompare}
                  disabled={isLoading || !selectedA || !selectedB}
                  className="cursor-pointer bg-primary text-primary-foreground text-xs"
                >
                  {isLoading ? "Comparing..." : "Compare"}
                </Button>
              </div>

              {/* Comparison Results */}
              {comparison && (
                <div className="mt-6 border-t border-border/60 pt-6 space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Added/Removed</span>
                      <h4 className="text-lg font-bold text-foreground mt-1">
                        +{comparison.diff.added.length} / -{comparison.diff.removed.length}
                      </h4>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Avg Backup Δ</span>
                      <h4 className={`text-lg font-bold mt-1 ${
                        comparison.snap2.averageBackupScore > comparison.snap1.averageBackupScore
                          ? "text-emerald-500"
                          : comparison.snap2.averageBackupScore < comparison.snap1.averageBackupScore
                          ? "text-red-500"
                          : "text-foreground"
                      }`}>
                        {comparison.snap2.averageBackupScore - comparison.snap1.averageBackupScore >= 0 ? "+" : ""}
                        {comparison.snap2.averageBackupScore - comparison.snap1.averageBackupScore}
                      </h4>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Avg Recovery Δ</span>
                      <h4 className={`text-lg font-bold mt-1 ${
                        comparison.snap2.averageRecoveryScore > comparison.snap1.averageRecoveryScore
                          ? "text-teal-500"
                          : comparison.snap2.averageRecoveryScore < comparison.snap1.averageRecoveryScore
                          ? "text-red-500"
                          : "text-foreground"
                      }`}>
                        {comparison.snap2.averageRecoveryScore - comparison.snap1.averageRecoveryScore >= 0 ? "+" : ""}
                        {comparison.snap2.averageRecoveryScore - comparison.snap1.averageRecoveryScore}
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {/* Added projects list */}
                    {comparison.diff.added.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Added Projects</span>
                        <div className="space-y-1">
                          {comparison.diff.added.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs">
                              <span className="text-foreground font-semibold">{p.name}</span>
                              <Badge className="bg-emerald-500/20 text-emerald-600 border-none text-[8px] uppercase tracking-wider">Added</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Removed projects list */}
                    {comparison.diff.removed.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Removed Projects</span>
                        <div className="space-y-1">
                          {comparison.diff.removed.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-xs">
                              <span className="text-foreground font-semibold">{p.name}</span>
                              <Badge className="bg-red-500/20 text-red-600 border-none text-[8px] uppercase tracking-wider">Removed</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Score Changes */}
                    {comparison.diff.scoreChanges.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Score Movements</span>
                        <div className="space-y-1">
                          {comparison.diff.scoreChanges.map((change, idx) => {
                            const diff = change.newScore - change.oldScore;
                            return (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/40 text-xs">
                                <div>
                                  <span className="font-semibold text-foreground">{change.name}</span>
                                  <span className="text-muted-foreground font-light pl-2">
                                    {change.type === "backup" ? "Backup Safety" : "Recovery Readiness"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 font-mono">
                                  <span>{change.oldScore} → {change.newScore}</span>
                                  <span className={diff > 0 ? "text-emerald-500 flex items-center" : "text-red-500 flex items-center"}>
                                    {diff > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                                    {diff > 0 ? "+" : ""}{diff}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Missing Remotes */}
                    {comparison.diff.missingRemotes.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Vulnerabilities: Missing Remotes</span>
                        <div className="space-y-1">
                          {comparison.diff.missingRemotes.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-xs">
                              <span className="text-foreground font-semibold">{p.name}</span>
                              <span className="text-[9px] text-red-500 flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5" /> Remote Disconnected / Inaccessible
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Clear message if diffs are empty */}
                    {comparison.diff.added.length === 0 &&
                     comparison.diff.removed.length === 0 &&
                     comparison.diff.scoreChanges.length === 0 &&
                     comparison.diff.missingRemotes.length === 0 && (
                      <div className="text-center py-6 text-xs text-muted-foreground font-light leading-relaxed">
                        No changes detected. Both snapshot states are identical.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
