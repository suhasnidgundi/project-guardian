"use client";

import {
  FolderGit2,
  FolderX,
  Activity,
  AlertTriangle,
  FolderKanban,
  Clock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types";

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}

function StatCard({ title, value, subtitle, icon, gradient, iconBg }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg">
      {/* Gradient glow on hover */}
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
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground/70">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards: StatCardProps[] = [
    {
      title: "Total Projects",
      value: stats.total,
      subtitle: `${stats.gitProjects} with Git · ${stats.nonGitProjects} without`,
      icon: <FolderKanban className="h-6 w-6 text-indigo-500" />,
      gradient: "bg-gradient-to-br from-indigo-500/5 to-transparent",
      iconBg: "bg-indigo-500/10",
    },
    {
      title: "Git Repositories",
      value: stats.gitProjects,
      subtitle: `${stats.total > 0 ? Math.round((stats.gitProjects / stats.total) * 100) : 0}% coverage`,
      icon: <FolderGit2 className="h-6 w-6 text-emerald-500" />,
      gradient: "bg-gradient-to-br from-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/10",
    },
    {
      title: "Unprotected",
      value: stats.nonGitProjects,
      subtitle: stats.nonGitProjects === 0 ? "All projects tracked" : "Not tracked by Git",
      icon: <FolderX className="h-6 w-6 text-red-500" />,
      gradient: "bg-gradient-to-br from-red-500/5 to-transparent",
      iconBg: "bg-red-500/10",
    },
    {
      title: "Recently Modified",
      value: stats.recentlyModified,
      subtitle: "Active in the last 7 days",
      icon: <Clock className="h-6 w-6 text-sky-500" />,
      gradient: "bg-gradient-to-br from-sky-500/5 to-transparent",
      iconBg: "bg-sky-500/10",
    },
    {
      title: "Critical Risk",
      value: stats.criticalCount,
      subtitle: "No Git — high data-loss risk",
      icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
      gradient: "bg-gradient-to-br from-red-500/5 to-transparent",
      iconBg: "bg-red-500/10",
    },
    {
      title: "High Risk",
      value: stats.highCount,
      subtitle: "No remote or uncommitted work",
      icon: <ShieldAlert className="h-6 w-6 text-orange-500" />,
      gradient: "bg-gradient-to-br from-orange-500/5 to-transparent",
      iconBg: "bg-orange-500/10",
    },
    {
      title: "Medium Risk",
      value: stats.mediumCount,
      subtitle: "Unpushed commits",
      icon: <Activity className="h-6 w-6 text-amber-500" />,
      gradient: "bg-gradient-to-br from-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/10",
    },
    {
      title: "Low Risk",
      value: stats.lowCount,
      subtitle: "Clean and pushed",
      icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
      gradient: "bg-gradient-to-br from-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
