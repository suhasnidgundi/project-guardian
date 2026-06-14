"use client";

import { FolderSearch } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 animate-ping rounded-full bg-emerald-500/5 [animation-duration:3s]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 animate-ping rounded-full bg-emerald-500/10 [animation-duration:2.5s]" />
        </div>
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 ring-1 ring-emerald-500/20">
          <FolderSearch className="h-10 w-10 text-emerald-500" />
        </div>
      </div>

      <h2 className="text-xl font-semibold tracking-tight">
        Ready to scan your projects
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        Enter the path to your root projects directory above and click{" "}
        <span className="font-medium text-foreground">Scan Projects</span> to
        analyse the Git health of every project within it.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
        {[
          {
            title: "Git Detection",
            desc: "Identifies repos using git rev-parse",
          },
          {
            title: "Risk Scoring",
            desc: "Four-tier risk from critical to low",
          },
          {
            title: "Provider Detection",
            desc: "GitHub, GitLab, Bitbucket & more",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="rounded-lg border border-border/50 bg-card/30 p-4 backdrop-blur-sm"
          >
            <p className="text-sm font-medium">{feature.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
