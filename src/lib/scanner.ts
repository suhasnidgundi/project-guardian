/**
 * Recursive async project scanner.
 *
 * Walks a root directory tree looking for "project directories" —
 * directories that are either git repos or contain typical project
 * markers (package.json, Cargo.toml, go.mod, etc.).
 *
 * Designed for 500 + project trees:
 *  • Uses a concurrency-limited worker pool (default 12 parallel git calls).
 *  • Skips hidden dirs, node_modules, and other noise.
 *  • Short-circuits recursion inside git repos (a repo's subdirs are not
 *    counted as separate projects).
 */

import { readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import type { GitIntelligence, ProjectInfo, RiskLevel } from "./types";
import { encodeProjectId } from "./types";
import {
  isGitRepo,
  currentBranch,
  remoteUrl,
  hasRemote,
  hasUncommittedChanges,
  unpushedCommitCount,
  detectProvider,
  // Phase 2 git intelligence
  uncommittedFileCount,
  untrackedFileCount,
  defaultBranch,
  lastCommitInfo,
  repoSizeBytes,
  branchCount,
  aheadBehind,
} from "./git";
import { computeHealthScore } from "./health";

// ── configuration ──────────────────────────────────────────────

/** Max parallel git-inspections.  Keeps the machine responsive. */
const CONCURRENCY = 12;

/** Directory names to always skip during recursive walk. */
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".hg",
  ".svn",
  "vendor",
  "dist",
  "build",
  ".next",
  ".nuxt",
  ".output",
  "__pycache__",
  ".venv",
  "venv",
  ".cache",
  ".Trash",
  ".Spotlight-V100",
  ".fseventsd",
  "target",           // Rust / Java
  "Pods",             // CocoaPods
  ".gradle",
  ".idea",
  ".vscode",
]);

/** Files whose presence marks a directory as a "project root". */
const PROJECT_MARKERS = [
  "package.json",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "setup.py",
  "requirements.txt",
  "Gemfile",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "CMakeLists.txt",
  "Makefile",
  "composer.json",
  "pubspec.yaml",
  "*.xcodeproj",
  "*.sln",
  "Dockerfile",
  "mix.exs",
  "deno.json",
  "bun.lockb",
];

// ── concurrency-limited pool ───────────────────────────────────

/**
 * Process an array of items with at most `limit` concurrent workers.
 * Returns results in the same order as the input.
 */
async function poolMap<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

// ── directory walking ──────────────────────────────────────────

/** Check if a directory contains any project-marker file. */
async function hasProjectMarker(dir: string): Promise<boolean> {
  try {
    const entries = await readdir(dir);
    const entrySet = new Set(entries);
    for (const marker of PROJECT_MARKERS) {
      if (marker.startsWith("*")) {
        // Glob: match extension
        const ext = marker.slice(1);
        if (entries.some((e) => e.endsWith(ext))) return true;
      } else {
        if (entrySet.has(marker)) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Recursively discover project directories under `root`.
 *
 * A directory is a "project" if it is a git repo OR contains a project
 * marker file.  Once a project is found we do NOT recurse into it
 * (e.g. we won't list `my-app/packages/sub-pkg` separately).
 *
 * `maxDepth` caps recursion to avoid traversing enormous trees.
 */
async function discoverProjects(
  root: string,
  maxDepth = 5,
): Promise<string[]> {
  const projects: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return; // permission denied, etc.
    }

    // Check if THIS dir is a project root.
    const gitRepo = await isGitRepo(dir);
    const markerPresent = !gitRepo && (await hasProjectMarker(dir));

    if (gitRepo || markerPresent) {
      projects.push(dir);
      // Don't recurse into discovered projects.
      return;
    }

    // Otherwise recurse into subdirectories.
    const children = entries.filter(
      (name) => !name.startsWith(".") && !SKIP_DIRS.has(name),
    );

    // Parallelize at top levels, serialise deeper to reduce fd pressure.
    const childPaths = children.map((c) => join(dir, c));

    // Filter to directories only (in parallel).
    const stats = await Promise.allSettled(
      childPaths.map((p) => stat(p)),
    );

    const dirs = childPaths.filter((_, i) => {
      const s = stats[i];
      return s.status === "fulfilled" && s.value.isDirectory();
    });

    await Promise.all(dirs.map((d) => walk(d, depth + 1)));
  }

  await walk(root, 0);
  return projects;
}

// ── risk calculation ───────────────────────────────────────────

function computeRisk(info: {
  isGit: boolean;
  hasRemote: boolean;
  uncommittedChanges: boolean;
  unpushedCommits: number;
}): RiskLevel {
  if (!info.isGit) return "critical";
  if (!info.hasRemote) return "high";
  if (info.uncommittedChanges) return "high";
  if (info.unpushedCommits > 0) return "medium";
  return "low";
}

// ── last-modified (cheapest possible: mtime of dir itself) ────

async function lastModifiedISO(dir: string): Promise<string> {
  try {
    const s = await stat(dir);
    return s.mtime.toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

// ── Phase 2: collect git intelligence ──────────────────────────

async function collectGitIntelligence(dir: string): Promise<GitIntelligence> {
  const [
    uncommittedCount,
    untrackedCount,
    localUnpushed,
    defBranch,
    lastCommit,
    sizeBytes,
    branches,
    ab,
  ] = await Promise.all([
    uncommittedFileCount(dir),
    untrackedFileCount(dir),
    unpushedCommitCount(dir),
    defaultBranch(dir),
    lastCommitInfo(dir),
    repoSizeBytes(dir),
    branchCount(dir),
    aheadBehind(dir),
  ]);

  return {
    uncommittedFileCount: uncommittedCount,
    untrackedFileCount: untrackedCount,
    localCommitsNotPushed: localUnpushed,
    defaultBranch: defBranch,
    lastCommit,
    repoSizeBytes: sizeBytes,
    branchCount: branches,
    aheadBehind: ab,
  };
}

// ── public API ─────────────────────────────────────────────────

/**
 * Scan `rootPath` recursively, inspect every discovered project,
 * and return a fully-populated `ProjectInfo[]`.
 */
export async function scanProjects(rootPath: string): Promise<ProjectInfo[]> {
  const projectDirs = await discoverProjects(rootPath);

  const projects = await poolMap(projectDirs, CONCURRENCY, async (dir) => {
    const gitInitialised = await isGitRepo(dir);
    const modified = await lastModifiedISO(dir);

    if (!gitInitialised) {
      // Non-git project — return early with defaults.
      const healthScore = computeHealthScore({
        isGit: false,
        hasRemote: false,
        uncommittedFileCount: 0,
        untrackedFileCount: 0,
        unpushedCommits: 0,
        lastActivityDate: modified,
      });

      return {
        id: encodeProjectId(dir),
        name: basename(dir),
        path: dir,
        isGit: false,
        branch: null,
        hasRemote: false,
        remoteUrl: null,
        provider: "none" as const,
        lastModified: modified,
        uncommittedChanges: false,
        unpushedCommits: 0,
        riskLevel: "critical" as const,
        gitIntelligence: null,
        healthScore,
        githubMetadata: null,
        backupSafetyScore: {
          score: 0,
          status: "Critical" as const,
          risk: "critical" as const,
          penalties: [],
          recommendations: [],
        },
        recoveryReadinessScore: {
          score: 0,
          status: "Critical" as const,
          risk: "critical" as const,
          penalties: [],
          recommendations: [],
        },
        timeline: [],
      } satisfies ProjectInfo;
    }

    // Git repo — run Phase 1 + Phase 2 inspections concurrently.
    const [branch, remote, hasRem, uncommitted, unpushed, intelligence] =
      await Promise.all([
        currentBranch(dir),
        remoteUrl(dir),
        hasRemote(dir),
        hasUncommittedChanges(dir),
        unpushedCommitCount(dir),
        collectGitIntelligence(dir),
      ]);

    const provider = detectProvider(remote);
    const riskLevel = computeRisk({
      isGit: true,
      hasRemote: hasRem,
      uncommittedChanges: uncommitted,
      unpushedCommits: unpushed,
    });

    // Use last commit date if available, otherwise fall back to dir mtime.
    const lastActivityDate = intelligence.lastCommit?.date ?? modified;

    const healthScore = computeHealthScore({
      isGit: true,
      hasRemote: hasRem,
      uncommittedFileCount: intelligence.uncommittedFileCount,
      untrackedFileCount: intelligence.untrackedFileCount,
      unpushedCommits: unpushed,
      lastActivityDate,
    });

    return {
      id: encodeProjectId(dir),
      name: basename(dir),
      path: dir,
      isGit: true,
      branch,
      hasRemote: hasRem,
      remoteUrl: remote,
      provider,
      lastModified: modified,
      uncommittedChanges: uncommitted,
      unpushedCommits: unpushed,
      riskLevel,
      gitIntelligence: intelligence,
      healthScore,
      githubMetadata: null,
      backupSafetyScore: {
        score: 0,
        status: "Critical" as const,
        risk: "critical" as const,
        penalties: [],
        recommendations: [],
      },
      recoveryReadinessScore: {
        score: 0,
        status: "Critical" as const,
        risk: "critical" as const,
        penalties: [],
        recommendations: [],
      },
      timeline: [],
    } satisfies ProjectInfo;
  });

  return projects;
}
