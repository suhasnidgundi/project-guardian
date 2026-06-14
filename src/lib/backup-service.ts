import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { fetchGitHubMetadata } from "./github-service";
import { computeBackupSafetyScore, computeRecoveryReadinessScore } from "./safety-engine";
import type { ProjectInfo, TimelineEvent, GitHubMetadata, BackupSafetyScore, RecoveryReadinessScore } from "./types";

const GIT_TIMEOUT_MS = 3000;

/** Run a shell git command helper inside backup-service */
function runGit(args: string[], cwd: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(
      "git",
      args,
      { cwd, timeout: GIT_TIMEOUT_MS, maxBuffer: 1024 * 100 },
      (error, stdout) => {
        if (error) return resolve(null);
        resolve((stdout ?? "").trim());
      }
    );
  });
}

/** Check if specific files exist in a directory (case-insensitive) */
async function checkFilesExist(
  dir: string
): Promise<{ hasReadme: boolean; hasGitignore: boolean; hasPackageFile: boolean }> {
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch {
    return { hasReadme: false, hasGitignore: false, hasPackageFile: false };
  }

  const lowercaseEntries = entries.map((e) => e.toLowerCase());
  const entrySet = new Set(lowercaseEntries);

  const hasReadme = lowercaseEntries.some((e) => e.startsWith("readme"));
  const hasGitignore = entrySet.has(".gitignore");

  const packageMarkers = [
    "package.json",
    "cargo.toml",
    "go.mod",
    "pyproject.toml",
    "setup.py",
    "requirements.txt",
    "gemfile",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "cmakelists.txt",
    "makefile",
    "composer.json",
    "pubspec.yaml",
    "dockerfile",
    "mix.exs",
    "deno.json",
    "bun.lockb",
  ];
  const hasPackageFile = packageMarkers.some((marker) => entrySet.has(marker));

  return { hasReadme, hasGitignore, hasPackageFile };
}

/** Generate safety timeline events for a project */
export async function getProjectTimeline(
  dir: string,
  isGit: boolean,
  lastModifiedDate: string,
  githubMetadata: GitHubMetadata | null
): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  // 1. Project Created
  let createdDate = lastModifiedDate;
  try {
    const s = await stat(dir);
    // Use birthtime (creation) if valid, else fallback
    const birth = s.birthtimeMs || s.ctimeMs;
    if (birth && birth > 0) {
      createdDate = new Date(birth).toISOString();
    }
  } catch {
    // Keep lastModifiedDate as fallback
  }

  events.push({
    id: `created-${dir}`,
    type: "created",
    date: createdDate,
    label: "Project Created",
    description: "Project folder created on local machine.",
  });

  // 2. Last Modification
  events.push({
    id: `modified-${dir}`,
    type: "last_modified",
    date: lastModifiedDate,
    label: "Last Modification",
    description: "Most recent file modification detected on disk.",
  });

  if (!isGit) {
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // 3. Git Initialized
  try {
    const gitDir = join(dir, ".git");
    const s = await stat(gitDir);
    const gitInitDate = new Date(s.birthtimeMs || s.ctimeMs || s.mtimeMs).toISOString();
    events.push({
      id: `git_init-${dir}`,
      type: "git_init",
      date: gitInitDate,
      label: "Git Initialized",
      description: "Git version control initialized for this repository.",
    });
  } catch {
    // Ignore if stat failed (unlikely for Git repo)
  }

  // 4. First Commit
  const firstCommitISO = await runGit(["log", "--reverse", "--format=%aI"], dir);
  let firstCommitDate: string | null = null;
  if (firstCommitISO) {
    // Extract first line (earliest commit)
    const lines = firstCommitISO.split("\n").filter(Boolean);
    if (lines[0]) {
      firstCommitDate = lines[0];
      events.push({
        id: `first_commit-${dir}`,
        type: "first_commit",
        date: firstCommitDate,
        label: "First Commit",
        description: "Earliest commit registered in the Git repository history.",
      });
    }
  }

  // 5. Last Commit
  const lastCommitISO = await runGit(["log", "-1", "--format=%aI"], dir);
  if (lastCommitISO && lastCommitISO.trim()) {
    events.push({
      id: `last_commit-${dir}`,
      type: "last_commit",
      date: lastCommitISO.trim(),
      label: "Last Commit",
      description: "Most recent Git commit recorded in the repository history.",
    });
  }

  // 6. First Push (Estimated from earliest commit date, or GitHub created date if available)
  // If the repository has a remote history on GitHub, first push is at least as early as lastPushDate
  if (githubMetadata && githubMetadata.exists && githubMetadata.lastPushDate) {
    // If it has ever been pushed, let's estimate first push date
    const firstPushDate = firstCommitDate 
      ? new Date(new Date(firstCommitDate).getTime() + 10 * 60 * 1000).toISOString() // 10 mins after first commit
      : new Date(githubMetadata.lastPushDate).toISOString();
    
    events.push({
      id: `first_push-${dir}`,
      type: "first_push",
      date: firstPushDate,
      label: "First Push",
      description: "First sync of commits to remote host.",
    });

    // 7. Last Push
    events.push({
      id: `last_push-${dir}`,
      type: "last_push",
      date: githubMetadata.lastPushDate,
      label: "Last Push",
      description: "Most recent backup synchronization push to GitHub.",
    });
  }

  // Sort events chronologically
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export interface EnrichedSafetyResult {
  githubMetadata: GitHubMetadata | null;
  backupSafetyScore: BackupSafetyScore;
  recoveryReadinessScore: RecoveryReadinessScore;
  timeline: TimelineEvent[];
}

/** Enrich project git scan data with Backup and Recovery calculations */
export async function enrichProjectSafety(
  dir: string,
  isGit: boolean,
  hasRemote: boolean,
  remoteUrl: string | null,
  unpushedCommits: number,
  lastModifiedDate: string,
  repoSizeBytes: number,
  defaultBranch: string | null
): Promise<EnrichedSafetyResult> {
  // 1. Fetch GitHub remote metadata if remote exists
  let githubMetadata: GitHubMetadata | null = null;
  if (isGit && hasRemote && remoteUrl) {
    githubMetadata = await fetchGitHubMetadata(remoteUrl);
  }

  // 2. Perform local files inspection for recovery checklist
  const { hasReadme, hasGitignore, hasPackageFile } = await checkFilesExist(dir);

  // 3. Compute safety & readiness
  const safetyInput = {
    isGit,
    hasRemote,
    unpushedCommits,
    lastModifiedDate,
    repoSizeBytes,
    defaultBranch,
    hasReadme,
    hasGitignore,
    hasPackageFile,
    githubMetadata,
  };

  const backupSafetyScore = computeBackupSafetyScore(safetyInput);
  const recoveryReadinessScore = computeRecoveryReadinessScore(safetyInput);

  // 4. Gather timeline history
  const timeline = await getProjectTimeline(dir, isGit, lastModifiedDate, githubMetadata);

  return {
    githubMetadata,
    backupSafetyScore,
    recoveryReadinessScore,
    timeline,
  };
}
