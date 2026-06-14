"use client";

import { useEffect, useState } from "react";
import { Activity, GitCommit, Cloud, FolderPlus, RefreshCw, CalendarRange } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ActivitySummary, ActivityStats } from "@/lib/types";

export function ActivityCenter() {
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [activeRange, setActiveRange] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/activity");
      if (res.ok) {
        const data = await res.json() as { summary: ActivitySummary };
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load activity intelligence:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveStats = (): ActivityStats | null => {
    if (!summary) return null;
    return summary[activeRange];
  };

  const stats = getActiveStats();

  return (
    <div className="space-y-6">
      {/* Tab select and refresh header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Toggle Range buttons */}
        <div className="flex bg-muted/40 p-1 rounded-xl border border-border/40 gap-1">
          {(["daily", "weekly", "monthly"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                activeRange === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range} View
            </button>
          ))}
        </div>

        <Button
          onClick={fetchActivity}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="cursor-pointer border-border/40 hover:bg-muted/50 text-xs"
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Activity Log
        </Button>
      </div>

      {summary && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Detailed stats grids */}
          <div className="lg:col-span-1 space-y-4">
            {/* Commits */}
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                  <GitCommit className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Commits Created</span>
                  <h3 className="text-2xl font-bold mt-0.5">{stats.commits}</h3>
                </div>
              </CardContent>
            </Card>

            {/* Pushes */}
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Backup Sync Pushes</span>
                  <h3 className="text-2xl font-bold mt-0.5">{stats.pushes}</h3>
                </div>
              </CardContent>
            </Card>

            {/* Creations */}
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Projects Registered</span>
                  <h3 className="text-2xl font-bold mt-0.5">{stats.creations}</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* List of projects modified */}
          <div className="lg:col-span-2">
            <Card className="border-border/40 bg-card/40 backdrop-blur-xl h-full">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Active Development Workspaces
                </h3>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {stats.modifiedPaths.length === 0 ? (
                    <div className="text-center py-16 text-xs text-muted-foreground font-light leading-relaxed">
                      No commit activity detected in this range.
                    </div>
                  ) : (
                    stats.modifiedPaths.map((path, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/40 text-xs"
                      >
                        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                          <CalendarRange className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5 leading-relaxed truncate">
                          <span className="font-semibold text-foreground">{path}</span>
                          <span className="text-[10px] text-muted-foreground block font-light">
                            Active edits committed to branch refs in this range.
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
