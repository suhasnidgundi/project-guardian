import { execFile } from "node:child_process";
import type { ProjectInfo, ActivitySummary, ActivityStats } from "./types";

const GIT_TIMEOUT_MS = 2000;
const CONCURRENCY_LIMIT = 8;

/** Parallel run helper with limit */
async function poolLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const p = fn(item).then((res) => {
      results.push(res);
    });
    executing.push(p);
    if (executing.length >= limit) {
      await Promise.race(executing);
      // Clean finished
      for (let i = executing.length - 1; i >= 0; i--) {
        // Just filter/race in simple loop
      }
    }
  }
  await Promise.all(executing);
  return results;
}

/** Retrieve list of commit dates in the last 30 days for a repository. */
function getRecentCommitDates(dir: string): Promise<string[]> {
  return new Promise((resolve) => {
    execFile(
      "git",
      ["log", "--since=30.days.ago", "--format=%aI"],
      { cwd: dir, timeout: GIT_TIMEOUT_MS, maxBuffer: 1024 * 100 },
      (error, stdout) => {
        if (error || !stdout) return resolve([]);
        const dates = stdout
          .split("\n")
          .map((d) => d.trim())
          .filter(Boolean);
        resolve(dates);
      }
    );
  });
}

/** Gather activity stats across all projects. */
export async function getActivitySummary(projects: ProjectInfo[]): Promise<ActivitySummary> {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;
  const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;

  // Filter projects modified in the last 30 days to avoid running git log on inactive folders.
  const activeGitProjects = projects.filter((p) => {
    if (!p.isGit) return false;
    const age = now - new Date(p.lastModified).getTime();
    return age < THIRTY_DAYS_MS;
  });

  // Track commits dates
  let commitDates: { date: Date; name: string }[] = [];
  
  // Fetch logs with concurrency limit
  await poolLimit(activeGitProjects, CONCURRENCY_LIMIT, async (p) => {
    const dates = await getRecentCommitDates(p.path);
    for (const d of dates) {
      commitDates.push({ date: new Date(d), name: p.name });
    }
  });

  // Calculate statistics
  const getStatsForRange = (durationMs: number): ActivityStats => {
    const cutoff = now - durationMs;
    const filteredCommits = commitDates.filter((c) => c.date.getTime() >= cutoff);
    const affectedProjects = new Set(filteredCommits.map((c) => c.name));
    
    // Repository creations count
    // A creation occurred in the range if a project's createdDate (from registry) is inside the range
    const createdCount = projects.filter((p) => {
      const createdTime = new Date(p.registryMetadata?.createdDate || p.lastModified).getTime();
      return createdTime >= cutoff;
    }).length;

    return {
      commits: filteredCommits.length,
      // Pushes can be approximated as active tracking branches synchronized in git,
      // or we can count pushes as roughly 75% of commits or count git push events.
      // For a data-driven model, we can count push actions as matching commit count / 2 (or 1 push per session),
      // let's estimate pushes as the number of projects pushed within that window
      pushes: projects.filter((p) => {
        if (!p.githubMetadata || !p.githubMetadata.lastPushDate) return false;
        const pushTime = new Date(p.githubMetadata.lastPushDate).getTime();
        return pushTime >= cutoff;
      }).length,
      creations: createdCount,
      modifiedPaths: Array.from(affectedProjects),
    };
  };

  return {
    daily: getStatsForRange(ONE_DAY_MS),
    weekly: getStatsForRange(SEVEN_DAYS_MS),
    monthly: getStatsForRange(THIRTY_DAYS_MS),
  };
}
