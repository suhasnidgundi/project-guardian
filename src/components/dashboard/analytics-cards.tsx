"use client";

import {
  FileWarning,
  FilePlus2,
  ArrowUpFromLine,
  WifiOff,
  Flame,
  Snowflake,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsStats } from "@/lib/types";

interface AnalyticCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  accentColor: string;
}

function AnalyticCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  iconBg,
  accentColor,
}: AnalyticCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg">
      <div
        className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${gradient}`}
      />
      <CardContent className="relative flex items-center gap-4 p-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold tracking-tight ${value > 0 ? accentColor : ""}`}>
            {value}
          </p>
          <p className="truncate text-xs text-muted-foreground/70">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface AnalyticsCardsProps {
  stats: AnalyticsStats;
}

export function AnalyticsCards({ stats }: AnalyticsCardsProps) {
  const cards: AnalyticCardProps[] = [
    {
      title: "Uncommitted Changes",
      value: stats.withUncommitted,
      subtitle: stats.withUncommitted === 0 ? "All clean" : "Projects with dirty trees",
      icon: <FileWarning className="h-6 w-6 text-amber-500" />,
      gradient: "bg-gradient-to-br from-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/10",
      accentColor: "text-amber-500",
    },
    {
      title: "Untracked Files",
      value: stats.withUntracked,
      subtitle: stats.withUntracked === 0 ? "All tracked" : "Projects with new files",
      icon: <FilePlus2 className="h-6 w-6 text-orange-500" />,
      gradient: "bg-gradient-to-br from-orange-500/5 to-transparent",
      iconBg: "bg-orange-500/10",
      accentColor: "text-orange-500",
    },
    {
      title: "Unpushed Commits",
      value: stats.withUnpushed,
      subtitle: stats.withUnpushed === 0 ? "All pushed" : "Projects with local-only commits",
      icon: <ArrowUpFromLine className="h-6 w-6 text-sky-500" />,
      gradient: "bg-gradient-to-br from-sky-500/5 to-transparent",
      iconBg: "bg-sky-500/10",
      accentColor: "text-sky-500",
    },
    {
      title: "Missing Remotes",
      value: stats.missingRemotes,
      subtitle: stats.missingRemotes === 0 ? "All connected" : "No backup destination",
      icon: <WifiOff className="h-6 w-6 text-red-500" />,
      gradient: "bg-gradient-to-br from-red-500/5 to-transparent",
      iconBg: "bg-red-500/10",
      accentColor: "text-red-500",
    },
    {
      title: "Recently Active",
      value: stats.recentlyActive,
      subtitle: "Modified in the last 7 days",
      icon: <Flame className="h-6 w-6 text-emerald-500" />,
      gradient: "bg-gradient-to-br from-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/10",
      accentColor: "text-emerald-500",
    },
    {
      title: "Stale Projects",
      value: stats.staleProjects,
      subtitle: stats.staleProjects === 0 ? "All active" : "No activity in 30+ days",
      icon: <Snowflake className="h-6 w-6 text-violet-500" />,
      gradient: "bg-gradient-to-br from-violet-500/5 to-transparent",
      iconBg: "bg-violet-500/10",
      accentColor: "text-violet-500",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">Analytics</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Avg Health:
          <span className="font-bold text-foreground">
            {Math.round(stats.averageHealthScore)}
          </span>
          <span className="text-xs">/100</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <AnalyticCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}
