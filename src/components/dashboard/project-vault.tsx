"use client";

import { useState, useMemo } from "react";
import { Search, ExternalLink, Tag, Code, FileText, Briefcase, Archive, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { ProjectInfo, ProjectCategory, ProjectStatus } from "@/lib/types";
import Link from "next/link";

interface ProjectVaultProps {
  projects: ProjectInfo[];
}

const CATEGORIES: ProjectCategory[] = [
  "Personal",
  "Client",
  "Startup",
  "Production",
  "Learning",
  "Experimental",
  "Archived",
];

const STATUSES: ProjectStatus[] = [
  "Active",
  "Maintenance",
  "Paused",
  "Completed",
  "Archived",
];

export function ProjectVault({ projects }: ProjectVaultProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | "All">("All");
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "All">("All");

  // Filtering Logic
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const reg = p.registryMetadata || {
        category: "Personal" as ProjectCategory,
        status: "Active" as ProjectStatus,
        description: "",
        client: "",
        technologyStack: [] as string[],
        notes: "",
        deploymentUrl: "",
      };

      // 1. Search Query
      const query = search.toLowerCase().trim();
      const matchesSearch =
        p.name.toLowerCase().includes(query) ||
        (reg.description && reg.description.toLowerCase().includes(query)) ||
        (reg.client && reg.client.toLowerCase().includes(query)) ||
        (reg.notes && reg.notes.toLowerCase().includes(query)) ||
        (p.remoteUrl && p.remoteUrl.toLowerCase().includes(query)) ||
        (reg.deploymentUrl && reg.deploymentUrl.toLowerCase().includes(query)) ||
        p.path.toLowerCase().includes(query) ||
        reg.technologyStack.some((tech) => tech.toLowerCase().includes(query));

      // 2. Category
      const matchesCategory = selectedCategory === "All" || reg.category === selectedCategory;

      // 3. Status
      const matchesStatus = selectedStatus === "All" || reg.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [projects, search, selectedCategory, selectedStatus]);

  // Aggregate Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: projects.length };
    for (const cat of CATEGORIES) {
      counts[cat] = 0;
    }
    for (const p of projects) {
      const cat = p.registryMetadata?.category || "Personal";
      if (cat && counts[cat] !== undefined) {
        counts[cat]++;
      }
    }
    return counts;
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Filters & Search Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Universal Search Vault (Name, Notes, Stack, URLs...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/20"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Status:</span>
          <button
            onClick={() => setSelectedStatus("All")}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              selectedStatus === "All"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                selectedStatus === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar Category Filters */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">Portfolio Categories</span>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all text-left cursor-pointer ${
                selectedCategory === "All"
                  ? "bg-muted font-bold text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> All Projects
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">{categoryCounts.All}</Badge>
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all text-left cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-muted font-bold text-foreground"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  {cat === "Archived" ? <Archive className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                  {cat}
                </span>
                <Badge variant="secondary" className="font-mono text-[10px]">{categoryCounts[cat] || 0}</Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Master Projects Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filteredProjects.length} registered projects</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.length === 0 ? (
              <div className="col-span-2 text-center py-20 border-2 border-dashed border-border/60 rounded-xl">
                <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">No Projects Matched Filters</h4>
                <p className="text-xs text-muted-foreground mt-1">Refine your search or categories selection.</p>
              </div>
            ) : (
              filteredProjects.map((p) => {
                const reg = p.registryMetadata || {
                  category: "Personal" as ProjectCategory,
                  status: "Active" as ProjectStatus,
                  description: "",
                  client: "",
                  technologyStack: [] as string[],
                  notes: "",
                  deploymentUrl: "",
                };
                return (
                  <Card key={p.id} className="border-border/40 bg-card/40 hover:border-border transition-all duration-300 group">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      {/* Top metadata */}
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/project/${p.id}`} className="font-bold text-base hover:underline text-foreground cursor-pointer">
                            {p.name}
                          </Link>
                          <div className="flex gap-1 shrink-0">
                            <Badge variant="outline" className="text-[9px] uppercase tracking-wider">
                              {reg.category}
                            </Badge>
                            <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                              {reg.status}
                            </Badge>
                          </div>
                        </div>
                        {reg.description && (
                          <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-2">
                            {reg.description}
                          </p>
                        )}
                        {reg.client && (
                          <p className="text-[10px] text-muted-foreground">
                            Client: <span className="text-foreground font-medium">{reg.client}</span>
                          </p>
                        )}
                      </div>

                      {/* Stack details */}
                      {reg.technologyStack.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {reg.technologyStack.slice(0, 4).map((tech) => (
                            <Badge key={tech} variant="outline" className="bg-muted/10 border-border/50 text-[9px] font-mono">
                              {tech}
                            </Badge>
                          ))}
                          {reg.technologyStack.length > 4 && (
                            <span className="text-[9px] text-muted-foreground font-mono self-center pl-1">+{reg.technologyStack.length - 4}</span>
                          )}
                        </div>
                      )}

                      {/* Links and path */}
                      <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-4">
                        <span className="text-[9px] font-mono text-muted-foreground truncate max-w-[150px]">
                          {p.path}
                        </span>

                        <div className="flex gap-2 shrink-0">
                          {p.remoteUrl && (
                            <a
                              href={p.remoteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer bg-muted/40 px-2 py-1 rounded-md"
                            >
                              Code <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {reg.deploymentUrl && (
                            <a
                              href={reg.deploymentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer bg-emerald-500/5 px-2 py-1 rounded-md"
                            >
                              Live <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
