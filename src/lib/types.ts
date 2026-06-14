/**
 * Shared type definitions for Project Guardian.
 *
 * These types are used by both the API route (server) and the
 * React components (client), so they must remain serialisable
 * (no functions, Dates, or class instances).
 */

// ── Risk levels ────────────────────────────────────────────────
export type RiskLevel = "critical" | "high" | "medium" | "low";

export const RISK_ORDER: Record<RiskLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
} as const;

// ── Repository provider detection ──────────────────────────────
export type RepoProvider =
  | "github"
  | "gitlab"
  | "bitbucket"
  | "azure"
  | "codecommit"
  | "self-hosted"
  | "none";

// ── Health score (Phase 2) ─────────────────────────────────────
export type HealthLevel = "healthy" | "good" | "warning" | "critical";

export const HEALTH_ORDER: Record<HealthLevel, number> = {
  critical: 0,
  warning: 1,
  good: 2,
  healthy: 3,
} as const;

export interface HealthScore {
  /** Numeric score 0-100 */
  score: number;

  /** Derived health level */
  level: HealthLevel;

  /** Individual penalty breakdown for transparency */
  penalties: HealthPenalty[];
}

export interface HealthPenalty {
  /** Machine-readable reason key */
  reason: HealthPenaltyReason;

  /** Human-readable description */
  label: string;

  /** Points deducted (positive number) */
  points: number;
}

export type HealthPenaltyReason =
  | "no_git"
  | "no_remote"
  | "uncommitted_files"
  | "untracked_files"
  | "unpushed_commits"
  | "stale_30d"
  | "stale_90d";

// ── Git intelligence (Phase 2) ─────────────────────────────────

export interface LastCommitInfo {
  /** Abbreviated commit hash */
  hash: string;

  /** ISO-8601 commit date */
  date: string;

  /** Author name */
  author: string;

  /** Author email */
  email: string;

  /** First line of commit message */
  message: string;
}

export interface AheadBehind {
  ahead: number;
  behind: number;
}

export interface GitIntelligence {
  /** Number of tracked files with uncommitted changes */
  uncommittedFileCount: number;

  /** Number of untracked files */
  untrackedFileCount: number;

  /** Commits ahead of upstream (same as unpushedCommits for compat) */
  localCommitsNotPushed: number;

  /** Default branch name (main/master/develop), or null if undetectable */
  defaultBranch: string | null;

  /** Last commit details, or null for repos with no commits */
  lastCommit: LastCommitInfo | null;

  /** Approximate repo size in bytes (git objects) */
  repoSizeBytes: number;

  /** Total number of local branches */
  branchCount: number;

  /** Ahead/behind compared to upstream tracking branch */
  aheadBehind: AheadBehind;
}

// ── Per-project payload ────────────────────────────────────────
export interface ProjectInfo {
  /** URL-safe identifier derived from path (base64url of path) */
  id: string;

  /** Directory basename, e.g. "my-app" */
  name: string;

  /** Absolute path on disk */
  path: string;

  /** true when `git rev-parse --is-inside-work-tree` succeeds */
  isGit: boolean;

  /** Current checked-out branch, or null if detached / non-git */
  branch: string | null;

  /** Whether at least one remote is configured */
  hasRemote: boolean;

  /** First remote URL (usually `origin`), or null */
  remoteUrl: string | null;

  /** Detected hosting provider */
  provider: RepoProvider;

  /** ISO-8601 timestamp of the most recently modified file */
  lastModified: string;

  /** true when `git status --porcelain` produces output */
  uncommittedChanges: boolean;

  /** Number of commits ahead of upstream (0 if no upstream) */
  unpushedCommits: number;

  /** Computed risk level */
  riskLevel: RiskLevel;

  /** Extended git intelligence data (Phase 2) */
  gitIntelligence: GitIntelligence | null;

  /** Computed health score (Phase 2) */
  healthScore: HealthScore;

  /** GitHub remote repository metadata (Phase 3) */
  githubMetadata: GitHubMetadata | null;

  /** Backup safety analysis (Phase 3) */
  backupSafetyScore: BackupSafetyScore;

  /** Recovery readiness analysis (Phase 3) */
  recoveryReadinessScore: RecoveryReadinessScore;

  /** Project milestones and safety events (Phase 3) */
  timeline: TimelineEvent[];

  /** Custom project portfolio registry metadata (Phase 4) */
  registryMetadata?: ProjectRegistryItem;
}

// ── GitHub Metadata (Phase 3) ─────────────────────────────────
export interface GitHubMetadata {
  exists: boolean;
  visibility: "public" | "private" | null;
  defaultBranch: string | null;
  lastPushDate: string | null;
  lastActivityDate: string | null;
  isArchived: boolean;
  htmlUrl: string | null;
  fetchedAt: string;
}

// ── Backup Safety (Phase 3) ────────────────────────────────────
export interface BackupSafetyScore {
  score: number; // 0-100
  status: "Fully Synchronized" | "Protected" | "Partially Protected" | "At Risk" | "Unprotected" | "Critical";
  risk: RiskLevel;
  penalties: {
    reason: string;
    label: string;
    points: number;
  }[];
  recommendations: string[];
}

// ── Recovery Readiness (Phase 3) ───────────────────────────────
export interface RecoveryReadinessScore {
  score: number; // 0-100
  status: "Fully Ready" | "Ready" | "Partially Ready" | "Not Ready" | "Critical";
  risk: RiskLevel;
  penalties: {
    reason: string;
    label: string;
    points: number;
  }[];
  recommendations: string[];
}

// ── Timeline Events (Phase 3) ──────────────────────────────────
export interface TimelineEvent {
  id: string;
  type: "created" | "git_init" | "first_commit" | "first_push" | "last_commit" | "last_push" | "last_modified";
  date: string;
  label: string;
  description: string;
}

// ── App Notification (Phase 3) ─────────────────────────────────
export interface AppNotification {
  id: string;
  projectId: string;
  projectName: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: string;
  read: boolean;
}


// ── API responses ──────────────────────────────────────────────
export interface ScanResponse {
  projects: ProjectInfo[];
  scannedAt: string;
  rootPath: string;
  scanDurationMs: number;
}

export interface ProjectDetailResponse {
  project: ProjectInfo;
}

// ── API requests ───────────────────────────────────────────────
export interface ScanRequest {
  rootPath: string;
}

export interface ProjectDetailRequest {
  projectId: string;
}

// ── Dashboard stats derived on the client ──────────────────────
export interface DashboardStats {
  total: number;
  gitProjects: number;
  nonGitProjects: number;
  recentlyModified: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

// ── Analytics stats (Phase 2) ──────────────────────────────────
export interface AnalyticsStats {
  /** Projects with at least 1 uncommitted file */
  withUncommitted: number;

  /** Projects with at least 1 untracked file */
  withUntracked: number;

  /** Projects with unpushed commits */
  withUnpushed: number;

  /** Projects without any configured remote */
  missingRemotes: number;

  /** Projects modified in the last 7 days */
  recentlyActive: number;

  /** Projects not modified in 30+ days */
  staleProjects: number;

  /** Average health score across all projects */
  averageHealthScore: number;
}

// ── Project ID encoding/decoding ───────────────────────────────
/** Encode an absolute path to a URL-safe project ID. */
export function encodeProjectId(path: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(path, "utf-8").toString("base64url");
  }
  // Browser fallback
  return btoa(path).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode a project ID back to an absolute path. */
export function decodeProjectId(id: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(id, "base64url").toString("utf-8");
  }
  const base64 = id.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}

// ── Project Portfolio Registry (Phase 4) ────────────────────────
export type ProjectCategory =
  | "Personal"
  | "Client"
  | "Startup"
  | "Production"
  | "Learning"
  | "Experimental"
  | "Archived";

export type ProjectStatus =
  | "Active"
  | "Maintenance"
  | "Paused"
  | "Completed"
  | "Archived";

export interface ProjectRegistryItem {
  id: string; // URL-safe project ID
  name: string;
  description: string | null;
  category: ProjectCategory;
  client: string | null;
  status: ProjectStatus;
  repositoryUrl: string | null;
  deploymentUrl: string | null;
  localPath: string;
  technologyStack: string[];
  notes: string | null;
  createdDate: string; // ISO string
  archivedDate: string | null; // ISO string
}

// ── Snapshot Engine (Phase 4) ───────────────────────────────────
export interface SnapshotProjectState {
  name: string;
  isGit: boolean;
  hasRemote: boolean;
  unpushedCommits: number;
  backupScore: number;
  recoveryScore: number;
  status: string;
}

export interface ProjectSnapshot {
  id: string;
  timestamp: string; // ISO string
  totalProjects: number;
  averageBackupScore: number;
  averageRecoveryScore: number;
  projectStates: Record<string, SnapshotProjectState>;
}

export interface SnapshotDiff {
  added: { id: string; name: string }[];
  removed: { id: string; name: string }[];
  scoreChanges: {
    id: string;
    name: string;
    type: "backup" | "recovery";
    oldScore: number;
    newScore: number;
  }[];
  missingRemotes: { id: string; name: string }[];
  backupStatusChanges: {
    id: string;
    name: string;
    oldStatus: string;
    newStatus: string;
  }[];
}

// ── Machine Migration Center (Phase 4) ──────────────────────────
export interface MigrationAlert {
  id: string;
  name: string;
  path: string;
  reason: string;
  severity: "critical" | "high" | "warning";
}

export interface MigrationReport {
  status: "SAFE" | "WARNING" | "UNSAFE";
  message: string;
  checkSummary: {
    totalChecked: number;
    localOnlyCount: number;
    unpushedCount: number;
    deletedRemoteCount: number;
    criticalCount: number;
  };
  blockedProjects: MigrationAlert[];
}

// ── Activity Intelligence (Phase 4) ─────────────────────────────
export interface ActivityStats {
  commits: number;
  pushes: number;
  creations: number;
  modifiedPaths: string[];
}

export interface ActivitySummary {
  daily: ActivityStats;
  weekly: ActivityStats;
  monthly: ActivityStats;
}

