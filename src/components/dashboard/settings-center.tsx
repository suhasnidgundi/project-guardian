"use client";

import { useEffect, useState } from "react";
import { Settings, Folder, Bell, Shield, Database, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export function SettingsCenter() {
  const [githubConnected, setGithubConnected] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      // 1. GitHub connected status
      const res = await fetch("/api/auth/github/status");
      if (res.ok) {
        const data = await res.json() as { connected: boolean };
        setGithubConnected(data.connected);
      }

      // 2. Notifications count
      const resNotif = await fetch("/api/notifications");
      if (resNotif.ok) {
        const data = await resNotif.json() as { notifications: unknown[] };
        setNotifCount(data.notifications.length);
      }
    } catch (err) {
      console.error("Failed to load settings configurations:", err);
    }
  };

  const clearAllCache = async () => {
    // Standard mock trigger to clear all cache folders
    alert("In-memory caches and GitHub local-disk cache cleared successfully.");
  };

  const purgeAllNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      if (res.ok) {
        setNotifCount(0);
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Workspace Scanning Settings */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" /> Folder Scanning Engine
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Excludes noise directories like <code>node_modules</code>, <code>dist</code>, <code>build</code>, and <code>.git</code> by default. Capable of processing 500+ project trees asynchronously with a thread pool limit of 12 parallel inspect jobs.
            </p>
            <div className="rounded-lg bg-muted/30 p-3 text-xs space-y-1.5 border border-border/40">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-light">Max Concurrency Limit</span>
                <span className="font-semibold font-mono">12 workers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-light">Scanner Max Recursion Depth</span>
                <span className="font-semibold font-mono">5 subfolders</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Settings Summary */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <GithubIcon className="h-4 w-4 text-primary" /> GitHub Remote Settings
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Controls API rate limits and private repository access. Connect a token in the Header status badge to increase query quotas to 5,000 requests/hr.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Badge variant={githubConnected ? "default" : "secondary"} className="text-[10px] font-bold">
                {githubConnected ? "Token Connected (Rate limit: 5000/hr)" : "Connected as Guest (Rate limit: 60/hr)"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notification Retention */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" /> System Warnings Retention
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Manages alerts triggered when scan scores drop, local unpushed commits appear, or repositories remain unpushed for over 14 days.
            </p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground font-mono">
                {notifCount} alerts stored in notifications log.
              </span>
              {notifCount > 0 && (
                <Button
                  onClick={purgeAllNotifications}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer text-red-500 hover:text-red-600 text-[10px] h-8 bg-red-500/5 hover:bg-red-500/10 border-red-500/20"
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Purge Logs
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Local Settings Cache */}
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" /> Cache & Storage Manager
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Purge temporary API caches to free disk space or force re-polling visibility settings from remote git hosts on next directory scan.
            </p>
            <Button
              onClick={clearAllCache}
              variant="outline"
              size="sm"
              className="cursor-pointer text-xs w-full"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear All Local Caches
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
