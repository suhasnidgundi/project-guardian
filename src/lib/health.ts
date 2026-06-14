/**
 * Health score calculator for Project Guardian.
 *
 * Computes a 0-100 score with transparent penalty breakdowns.
 * Score starts at 100 and deductions are applied per the spec:
 *
 *   No Git:              0 (hard floor)
 *   No remote:          -40
 *   Uncommitted files:  -10
 *   Untracked files:     -5
 *   Unpushed commits:   -15
 *   No activity > 30d:  -10
 *   No activity > 90d:  -25  (replaces the -10, not cumulative)
 */

import type {
  HealthLevel,
  HealthPenalty,
  HealthPenaltyReason,
  HealthScore,
} from "./types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/** Map a numeric score to a health level. */
function scoreToLevel(score: number): HealthLevel {
  if (score >= 90) return "healthy";
  if (score >= 70) return "good";
  if (score >= 50) return "warning";
  return "critical";
}

/** Helper to push a penalty and return the updated score. */
function penalise(
  penalties: HealthPenalty[],
  score: number,
  reason: HealthPenaltyReason,
  label: string,
  points: number,
): number {
  penalties.push({ reason, label, points });
  return Math.max(0, score - points);
}

export interface HealthInput {
  isGit: boolean;
  hasRemote: boolean;
  uncommittedFileCount: number;
  untrackedFileCount: number;
  unpushedCommits: number;
  /** ISO-8601 timestamp of last activity (commit date or lastModified). */
  lastActivityDate: string;
}

/** Compute health score for a single project. */
export function computeHealthScore(input: HealthInput): HealthScore {
  const penalties: HealthPenalty[] = [];

  // Hard floor: no git = 0.
  if (!input.isGit) {
    return {
      score: 0,
      level: "critical",
      penalties: [
        { reason: "no_git", label: "No Git repository initialised", points: 100 },
      ],
    };
  }

  let score = 100;

  if (!input.hasRemote) {
    score = penalise(
      penalties,
      score,
      "no_remote",
      "No remote configured",
      40,
    );
  }

  if (input.uncommittedFileCount > 0) {
    score = penalise(
      penalties,
      score,
      "uncommitted_files",
      `${input.uncommittedFileCount} uncommitted file${input.uncommittedFileCount > 1 ? "s" : ""}`,
      10,
    );
  }

  if (input.untrackedFileCount > 0) {
    score = penalise(
      penalties,
      score,
      "untracked_files",
      `${input.untrackedFileCount} untracked file${input.untrackedFileCount > 1 ? "s" : ""}`,
      5,
    );
  }

  if (input.unpushedCommits > 0) {
    score = penalise(
      penalties,
      score,
      "unpushed_commits",
      `${input.unpushedCommits} unpushed commit${input.unpushedCommits > 1 ? "s" : ""}`,
      15,
    );
  }

  // Staleness: 90d replaces 30d penalty (not cumulative).
  const age = Date.now() - new Date(input.lastActivityDate).getTime();
  if (age > NINETY_DAYS_MS) {
    score = penalise(
      penalties,
      score,
      "stale_90d",
      "No activity in 90+ days",
      25,
    );
  } else if (age > THIRTY_DAYS_MS) {
    score = penalise(
      penalties,
      score,
      "stale_30d",
      "No activity in 30+ days",
      10,
    );
  }

  return {
    score,
    level: scoreToLevel(score),
    penalties,
  };
}
