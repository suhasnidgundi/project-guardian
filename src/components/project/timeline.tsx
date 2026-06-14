"use client";

import { FolderPlus, GitBranch, GitCommit, CloudUpload, Cloud, Clock } from "lucide-react";
import type { TimelineEvent } from "@/lib/types";

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return <FolderPlus className="h-4 w-4 text-emerald-500" />;
      case "git_init":
        return <GitBranch className="h-4 w-4 text-cyan-500" />;
      case "first_commit":
        return <GitCommit className="h-4 w-4 text-indigo-500" />;
      case "first_push":
        return <CloudUpload className="h-4 w-4 text-teal-500" />;
      case "last_commit":
        return <GitCommit className="h-4 w-4 text-violet-500" />;
      case "last_push":
        return <Cloud className="h-4 w-4 text-sky-500" />;
      case "last_modified":
        return <Clock className="h-4 w-4 text-zinc-500" />;
      default:
        return <Clock className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getEventBg = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "git_init":
        return "bg-cyan-500/10 border-cyan-500/20";
      case "first_commit":
        return "bg-indigo-500/10 border-indigo-500/20";
      case "first_push":
        return "bg-teal-500/10 border-teal-500/20";
      case "last_commit":
        return "bg-violet-500/10 border-violet-500/20";
      case "last_push":
        return "bg-sky-500/10 border-sky-500/20";
      case "last_modified":
        return "bg-zinc-500/10 border-zinc-500/20";
      default:
        return "bg-zinc-500/10 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flow-root">
        <ul className="-mb-8">
          {events.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground font-light leading-relaxed">
              No timeline events available for this project.
            </div>
          ) : (
            events.map((event, eventIdx) => (
              <li key={event.id}>
                <div className="relative pb-8">
                  {eventIdx !== events.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border/40"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm ${getEventBg(
                          event.type
                        )}`}
                      >
                        {getEventIcon(event.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pt-1.5 space-y-0.5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-foreground">{event.label}</p>
                        <time className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-md">
                          {new Date(event.date).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          {new Date(event.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed">{event.description}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
