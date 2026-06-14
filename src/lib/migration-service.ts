import type { ProjectInfo, MigrationReport, MigrationAlert } from "./types";

/** Evaluate migration readiness for the entire developer portfolio. */
export function generateMigrationReport(projects: ProjectInfo[]): MigrationReport {
  const alerts: MigrationAlert[] = [];
  let localOnlyCount = 0;
  let unpushedCount = 0;
  let deletedRemoteCount = 0;
  let criticalCount = 0;

  for (const p of projects) {
    // 1. Not a Git repository
    if (!p.isGit) {
      alerts.push({
        id: `mig-${p.id}-nogit`,
        name: p.name,
        path: p.path,
        reason: "Folder is not a Git repository. Version control is required for backups.",
        severity: "critical",
      });
      localOnlyCount++;
      criticalCount++;
      continue;
    }

    // 2. Missing Remote Configuration
    if (!p.hasRemote) {
      alerts.push({
        id: `mig-${p.id}-noremote`,
        name: p.name,
        path: p.path,
        reason: "No remote Git URL configured. Code exists only on this local drive.",
        severity: "critical",
      });
      localOnlyCount++;
      criticalCount++;
      continue;
    }

    // 3. Remote Inaccessible/Deleted on GitHub
    if (p.githubMetadata && !p.githubMetadata.exists) {
      alerts.push({
        id: `mig-${p.id}-inaccessible`,
        name: p.name,
        path: p.path,
        reason: "Remote repository URL was configured but is inaccessible or deleted on GitHub.",
        severity: "high",
      });
      deletedRemoteCount++;
      continue;
    }

    // 4. Unpushed local commits
    if (p.unpushedCommits > 0) {
      alerts.push({
        id: `mig-${p.id}-unpushed`,
        name: p.name,
        path: p.path,
        reason: `${p.unpushedCommits} local commit${p.unpushedCommits > 1 ? "s are" : " is"} not pushed to GitHub.`,
        severity: "high",
      });
      unpushedCount++;
      continue;
    }

    // 5. Uncommitted file modifications (Warning only)
    if (p.uncommittedChanges || (p.gitIntelligence && p.gitIntelligence.uncommittedFileCount > 0)) {
      const filesCount = p.gitIntelligence?.uncommittedFileCount ?? 1;
      alerts.push({
        id: `mig-${p.id}-uncommitted`,
        name: p.name,
        path: p.path,
        reason: `Has ${filesCount} uncommitted file change${filesCount > 1 ? "s" : ""} locally.`,
        severity: "warning",
      });
      continue;
    }

    // 6. Stale backups (pushed over 30 days ago - Warning only)
    if (p.githubMetadata && p.githubMetadata.lastPushDate) {
      const pushAge = Date.now() - new Date(p.githubMetadata.lastPushDate).getTime();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      if (pushAge > THIRTY_DAYS_MS) {
        const days = Math.floor(pushAge / (24 * 60 * 60 * 1000));
        alerts.push({
          id: `mig-${p.id}-stale`,
          name: p.name,
          path: p.path,
          reason: `Last backup was pushed ${days} days ago. Ensure local workspace files match.`,
          severity: "warning",
        });
      }
    }
  }

  // Determine Overall Migration Safety
  let status: MigrationReport["status"] = "SAFE";
  let message = "Your computer is fully synchronized! You can safely format or migrate today.";

  const criticalAndHigh = alerts.filter((a) => a.severity === "critical" || a.severity === "high");
  const warnings = alerts.filter((a) => a.severity === "warning");

  if (criticalAndHigh.length > 0) {
    status = "UNSAFE";
    const localIssues = localOnlyCount > 0 ? `${localOnlyCount} project${localOnlyCount > 1 ? "s contain" : " contains"} local-only work` : "";
    const unpushedIssues = unpushedCount > 0 ? `${unpushedCount} project${unpushedCount > 1 ? "s have" : " has"} unpushed commits` : "";
    
    const issuesList = [localIssues, unpushedIssues].filter(Boolean).join(" and ");
    message = `${issuesList || "Critical vulnerabilities"} detected. Formatting this machine now will cause irreversible loss of data.`;
  } else if (warnings.length > 0) {
    status = "WARNING";
    message = `You have ${warnings.length} project${warnings.length > 1 ? "s" : ""} with uncommitted changes or stale backups. Commit and push before formatting.`;
  }

  return {
    status,
    message,
    checkSummary: {
      totalChecked: projects.length,
      localOnlyCount,
      unpushedCount,
      deletedRemoteCount,
      criticalCount,
    },
    blockedProjects: alerts,
  };
}
