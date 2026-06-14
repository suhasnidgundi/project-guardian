/**
 * Git inspection utilities.
 *
 * Every function shells out to `git` via `child_process.execFile`
 * wrapped in a promise.  All calls set `cwd` to the project directory
 * and use a short timeout to prevent hangs on network-mounted drives.
 */

import { execFile } from "node:child_process";
import type { AheadBehind, LastCommitInfo, RepoProvider } from "./types";

const GIT_TIMEOUT_MS = 5_000;

// ── helpers ────────────────────────────────────────────────────

/** Run a git command and resolve with trimmed stdout.  Rejects on error. */
function git(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      { cwd, timeout: GIT_TIMEOUT_MS, maxBuffer: 1024 * 512 },
      (error, stdout) => {
        if (error) return reject(error);
        resolve((stdout ?? "").trim());
      },
    );
  });
}

/** Like `git()` but returns `null` instead of throwing. */
async function gitSafe(args: string[], cwd: string): Promise<string | null> {
  try {
    return await git(args, cwd);
  } catch {
    return null;
  }
}

/** Parse an integer from git output, defaulting to 0 on failure. */
function safeParseInt(value: string | null): number {
  if (value === null) return 0;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

// ── Phase 1 public API (unchanged) ─────────────────────────────

/** Returns true if `dir` is inside a git work-tree. */
export async function isGitRepo(dir: string): Promise<boolean> {
  const result = await gitSafe(["rev-parse", "--is-inside-work-tree"], dir);
  return result === "true";
}

/** Returns the current branch name, or null for detached HEAD / non-git. */
export async function currentBranch(dir: string): Promise<string | null> {
  return gitSafe(["rev-parse", "--abbrev-ref", "HEAD"], dir);
}

/** Returns the first remote URL (usually `origin`), or null. */
export async function remoteUrl(dir: string): Promise<string | null> {
  const url = await gitSafe(["remote", "get-url", "origin"], dir);
  if (url) return url;

  // Fall back: pick the first remote if `origin` doesn't exist.
  const remotes = await gitSafe(["remote"], dir);
  if (!remotes) return null;
  const first = remotes.split("\n")[0];
  if (!first) return null;
  return gitSafe(["remote", "get-url", first], dir);
}

/** Returns true if at least one remote is configured. */
export async function hasRemote(dir: string): Promise<boolean> {
  const remotes = await gitSafe(["remote"], dir);
  return !!remotes && remotes.length > 0;
}

/** Returns true if `git status --porcelain` produces output. */
export async function hasUncommittedChanges(dir: string): Promise<boolean> {
  const out = await gitSafe(["status", "--porcelain", "-uno"], dir);
  return !!out && out.length > 0;
}

/**
 * Returns the number of commits ahead of the upstream tracking branch.
 * Returns 0 when there is no upstream or the repo has no commits.
 */
export async function unpushedCommitCount(dir: string): Promise<number> {
  const out = await gitSafe(
    ["rev-list", "--count", "@{upstream}..HEAD"],
    dir,
  );
  return safeParseInt(out);
}

// ── Phase 2: Git Intelligence commands ─────────────────────────

/** Count of tracked files with uncommitted changes. */
export async function uncommittedFileCount(dir: string): Promise<number> {
  const out = await gitSafe(["diff", "--name-only", "--cached"], dir);
  const staged = out ? out.split("\n").filter(Boolean).length : 0;

  const out2 = await gitSafe(["diff", "--name-only"], dir);
  const unstaged = out2 ? out2.split("\n").filter(Boolean).length : 0;

  return staged + unstaged;
}

/** Count of untracked files. */
export async function untrackedFileCount(dir: string): Promise<number> {
  const out = await gitSafe(
    ["ls-files", "--others", "--exclude-standard"],
    dir,
  );
  if (!out) return 0;
  return out.split("\n").filter(Boolean).length;
}

/** Detect the default branch (main/master/develop). */
export async function defaultBranch(dir: string): Promise<string | null> {
  // Try symbolic ref of origin/HEAD first (most reliable).
  const symRef = await gitSafe(
    ["symbolic-ref", "refs/remotes/origin/HEAD", "--short"],
    dir,
  );
  if (symRef) {
    // Returns "origin/main" → strip "origin/"
    return symRef.replace(/^origin\//, "");
  }

  // Fallback: check if common branch names exist.
  for (const candidate of ["main", "master", "develop"]) {
    const exists = await gitSafe(
      ["rev-parse", "--verify", `refs/heads/${candidate}`],
      dir,
    );
    if (exists !== null) return candidate;
  }

  return null;
}

/** Get last commit details, or null for empty repos. */
export async function lastCommitInfo(
  dir: string,
): Promise<LastCommitInfo | null> {
  // Use %x00 as separator to avoid issues with special chars in messages.
  const format = "%h%x00%aI%x00%an%x00%ae%x00%s";
  const out = await gitSafe(["log", "-1", "--format=" + format], dir);
  if (!out) return null;

  const parts = out.split("\0");
  if (parts.length < 5) return null;

  return {
    hash: parts[0],
    date: parts[1],
    author: parts[2],
    email: parts[3],
    message: parts[4],
  };
}

/** Approximate repository size in bytes (git objects on disk). */
export async function repoSizeBytes(dir: string): Promise<number> {
  // `git count-objects -v` output includes "size-pack: <KB>"
  const out = await gitSafe(["count-objects", "-v"], dir);
  if (!out) return 0;

  let totalKB = 0;
  for (const line of out.split("\n")) {
    const sizeMatch = line.match(/^size(?:-pack)?:\s*(\d+)/);
    if (sizeMatch) {
      totalKB += parseInt(sizeMatch[1], 10);
    }
  }
  return totalKB * 1024;
}

/** Count total local branches. */
export async function branchCount(dir: string): Promise<number> {
  const out = await gitSafe(["branch", "--list"], dir);
  if (!out) return 0;
  return out.split("\n").filter(Boolean).length;
}

/** Get ahead/behind counts relative to upstream. */
export async function aheadBehind(dir: string): Promise<AheadBehind> {
  const out = await gitSafe(
    ["rev-list", "--left-right", "--count", "HEAD...@{upstream}"],
    dir,
  );
  if (!out) return { ahead: 0, behind: 0 };

  const parts = out.split(/\s+/);
  return {
    ahead: safeParseInt(parts[0] ?? null),
    behind: safeParseInt(parts[1] ?? null),
  };
}

// ── provider detection (unchanged) ─────────────────────────────

const PROVIDER_PATTERNS: [RegExp, RepoProvider][] = [
  [/github\.com/i, "github"],
  [/gitlab\.com/i, "gitlab"],
  [/bitbucket\.org/i, "bitbucket"],
  [/dev\.azure\.com|visualstudio\.com/i, "azure"],
  [/codecommit/i, "codecommit"],
];

/** Detect the hosting provider from a remote URL. */
export function detectProvider(url: string | null): RepoProvider {
  if (!url) return "none";
  for (const [pattern, provider] of PROVIDER_PATTERNS) {
    if (pattern.test(url)) return provider;
  }
  // Has a URL but doesn't match any known provider → self-hosted
  return "self-hosted";
}
