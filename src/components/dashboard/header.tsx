"use client";

import { useEffect, useState, useRef } from "react";
import { Shield, Bell, BellOff, X, Check, AlertTriangle, Info, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AppNotification } from "@/lib/types";

// Inline Github icon component to prevent compile issues on older lucide versions
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

export function Header() {
  const [githubConnected, setGithubConnected] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);

  // Fetch connection status and notifications on mount
  useEffect(() => {
    fetchGithubStatus();
    fetchNotifications();

    // Close notifications dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchGithubStatus = async () => {
    try {
      const res = await fetch("/api/auth/github/status");
      if (res.ok) {
        const data = await res.json() as { connected: boolean };
        setGithubConnected(data.connected);
      }
    } catch (err) {
      console.error("Failed to load GitHub status:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json() as { notifications: AppNotification[] };
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/github/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenInput.trim() }),
      });
      if (res.ok) {
        setGithubConnected(true);
        setTokenInput("");
        setIsSettingsOpen(false);
        // Trigger page scan refresh if applicable or simply notify
      }
    } catch (err) {
      console.error("Failed to save token:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/github/status", {
        method: "DELETE",
      });
      if (res.ok) {
        setGithubConnected(false);
        setIsSettingsOpen(false);
      }
    } catch (err) {
      console.error("Failed to disconnect:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationAction = async (action: "read" | "read_all" | "dismiss" | "clear", id?: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      if (res.ok) {
        const data = await res.json() as { notifications: AppNotification[] };
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(`Failed to execute notification action ${action}:`, err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold leading-tight tracking-tight">
              Project Guardian
            </h1>
            <p className="text-xs text-muted-foreground leading-none hidden sm:block">
              Backup & Disaster Prevention Platform
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* GitHub Connection Status */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 cursor-pointer border-border/40 hover:bg-muted/50"
          >
            <GithubIcon className="h-4 w-4" />
            <span className="hidden md:inline">GitHub</span>
            <div className={`h-2 w-2 rounded-full ${githubConnected ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
          </Button>

          {/* Notifications bell */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (!isNotificationsOpen) fetchNotifications();
              }}
              className="relative border-border/40 cursor-pointer"
            >
              {unreadCount > 0 ? (
                <>
                  <Bell className="h-4 w-4 text-foreground" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                </>
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-96 origin-top-right rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <h3 className="font-semibold">Recent Alerts</h3>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => handleNotificationAction("read_all")}
                        className="text-xs text-primary hover:underline font-medium cursor-pointer"
                      >
                        Read all
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={() => handleNotificationAction("clear")}
                        className="text-xs text-muted-foreground hover:text-red-500 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[350px] overflow-y-auto divide-y divide-border/60">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <BellOff className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium">All clear! No alerts</p>
                      <p className="text-xs px-6 mt-1">Your backup and recovery score parameters are healthy.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex gap-3 p-4 transition-colors hover:bg-muted/30 ${!notif.read ? "bg-muted/10" : ""}`}
                      >
                        <div className="mt-0.5">
                          {notif.type === "error" && <X className="h-4 w-4 rounded-full bg-red-500/10 p-0.5 text-red-500" />}
                          {notif.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          {notif.type === "info" && <Info className="h-4 w-4 text-cyan-500" />}
                          {notif.type === "success" && <Check className="h-4 w-4 rounded-full bg-emerald-500/10 p-0.5 text-emerald-500" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground">{notif.projectName}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                          {!notif.read && (
                            <button
                              onClick={() => handleNotificationAction("read", notif.id)}
                              className="text-[10px] text-primary hover:underline font-medium pt-1 cursor-pointer"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => handleNotificationAction("dismiss", notif.id)}
                          className="text-muted-foreground hover:text-foreground h-fit cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />
        </div>
      </div>

      {/* GitHub Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="w-[480px] rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <GithubIcon className="h-5 w-5" /> GitHub Settings
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect your GitHub account using a <strong>Personal Access Token (PAT)</strong> to pull remote repository visibility, push alerts, and recovery safety metrics.
              </p>

              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Required Permissions:</p>
                <p>Ensure your token has the <code>repo</code> scope enabled so it can fetch status for private repositories.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">GitHub Personal Access Token</label>
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="bg-muted/30"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/60">
                {githubConnected ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    className="cursor-pointer"
                  >
                    Disconnect Token
                  </Button>
                ) : (
                  <span className="text-xs text-amber-500 font-medium">GitHub Disconnected</span>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSettingsOpen(false)}
                    className="cursor-pointer"
                  >
                    Close
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveToken}
                    disabled={isLoading || !tokenInput.trim()}
                    className="cursor-pointer bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
                  >
                    {isLoading ? "Saving..." : "Save Token"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
