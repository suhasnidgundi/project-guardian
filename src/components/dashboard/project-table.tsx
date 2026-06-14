"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  GitBranch,
  ExternalLink,
  Search,
  Filter,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RiskBadge } from "./risk-badge";
import { ProviderBadge } from "./provider-badge";
import { HealthBadge } from "./health-badge";
import type { ProjectInfo, RiskLevel } from "@/lib/types";
import { RISK_ORDER } from "@/lib/types";

// ── Sorting ────────────────────────────────────────────────────

type SortKey = "name" | "riskLevel" | "lastModified" | "branch" | "healthScore";
type SortDir = "asc" | "desc";

function compareProjects(
  a: ProjectInfo,
  b: ProjectInfo,
  key: SortKey,
  dir: SortDir,
): number {
  let cmp = 0;

  switch (key) {
    case "name":
      cmp = a.name.localeCompare(b.name);
      break;
    case "riskLevel":
      cmp = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
      break;
    case "lastModified":
      cmp =
        new Date(a.lastModified).getTime() -
        new Date(b.lastModified).getTime();
      break;
    case "branch":
      cmp = (a.branch ?? "").localeCompare(b.branch ?? "");
      break;
    case "healthScore":
      cmp = a.healthScore.score - b.healthScore.score;
      break;
  }

  return dir === "asc" ? cmp : -cmp;
}

// ── Formatting ─────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ── Risk filter pills ──────────────────────────────────────────

const RISK_FILTERS: { value: RiskLevel | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// ── Component ──────────────────────────────────────────────────

interface ProjectTableProps {
  projects: ProjectInfo[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("riskLevel");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = projects;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.path.toLowerCase().includes(q) ||
          (p.branch?.toLowerCase().includes(q) ?? false) ||
          p.provider.toLowerCase().includes(q),
      );
    }

    // Risk filter
    if (riskFilter !== "all") {
      result = result.filter((p) => p.riskLevel === riskFilter);
    }

    // Sort
    return [...result].sort((a, b) =>
      compareProjects(a, b, sortKey, sortDir),
    );
  }, [projects, search, riskFilter, sortKey, sortDir]);

  const SortButton = ({
    column,
    children,
  }: {
    column: SortKey;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      onClick={() => toggleSort(column)}
    >
      {children}
      <ArrowUpDown className="ml-1.5 h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="project-search"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-10 text-sm"
          />
        </div>

        {/* Risk filters */}
        <div className="flex items-center gap-1.5">
          <Filter className="mr-1 h-4 w-4 text-muted-foreground" />
          {RISK_FILTERS.map(({ value, label }) => (
            <Button
              key={value}
              variant={riskFilter === value ? "default" : "outline"}
              size="sm"
              className="h-7 cursor-pointer px-2.5 text-xs"
              onClick={() => setRiskFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">{filtered.length}</span>{" "}
        of {projects.length} projects
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px]">
                <SortButton column="name">Project</SortButton>
              </TableHead>
              <TableHead>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Git Status
                </span>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <SortButton column="branch">Branch</SortButton>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Provider
                </span>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <SortButton column="lastModified">Modified</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="healthScore">Health</SortButton>
              </TableHead>
              <TableHead className="text-right">
                <SortButton column="riskLevel">Risk</SortButton>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No projects match your filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((project) => (
                <TableRow
                  key={project.path}
                  className="group cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => router.push(`/project/${project.id}`)}
                >
                  {/* Name */}
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-2 cursor-default">
                        <span className="font-medium">{project.name}</span>
                        {project.remoteUrl && (
                          <a
                            href={normalizeRemoteUrl(project.remoteUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label={`Open ${project.name} remote`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="font-mono text-xs">
                        {project.path}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  {/* Git status */}
                  <TableCell>
                    {project.isGit ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        >
                          Git
                        </Badge>
                        {project.uncommittedChanges && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          >
                            Dirty
                          </Badge>
                        )}
                        {project.unpushedCommits > 0 && (
                          <Badge
                            variant="outline"
                            className="border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          >
                            ↑{project.unpushedCommits}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                      >
                        No Git
                      </Badge>
                    )}
                  </TableCell>

                  {/* Branch */}
                  <TableCell className="hidden md:table-cell">
                    {project.branch ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono text-xs">
                          {project.branch}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Provider */}
                  <TableCell className="hidden lg:table-cell">
                    <ProviderBadge provider={project.provider} />
                  </TableCell>

                  {/* Last modified */}
                  <TableCell className="hidden sm:table-cell">
                    <Tooltip>
                      <TooltipTrigger className="text-sm text-muted-foreground cursor-default">
                        {relativeTime(project.lastModified)}
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {new Date(project.lastModified).toLocaleString()}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  {/* Health score */}
                  <TableCell>
                    <HealthBadge
                      level={project.healthScore.level}
                      score={project.healthScore.score}
                    />
                  </TableCell>

                  {/* Risk */}
                  <TableCell className="text-right">
                    <RiskBadge level={project.riskLevel} />
                  </TableCell>

                  {/* Navigate arrow */}
                  <TableCell className="text-right">
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────

/** Normalise SSH git remote URLs into HTTPS for browser links. */
function normalizeRemoteUrl(url: string): string {
  const sshMatch = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://${sshMatch[1]}/${sshMatch[2]}`;
  }
  return url.replace(/\.git$/, "");
}
