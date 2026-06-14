import type {
  BackupSafetyScore,
  RecoveryReadinessScore,
  GitHubMetadata,
  RiskLevel,
} from "./types";

interface SafetyInput {
  isGit: boolean;
  hasRemote: boolean;
  unpushedCommits: number;
  lastModifiedDate: string; // mtime of local files
  repoSizeBytes: number;
  defaultBranch: string | null;
  hasReadme: boolean;
  hasGitignore: boolean;
  hasPackageFile: boolean;
  githubMetadata: GitHubMetadata | null;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const ONE_GB_BYTES = 1024 * 1024 * 1024;

/** Derive standard risk levels from safety score. */
function scoreToRisk(score: number): RiskLevel {
  if (score >= 90) return "low";
  if (score >= 70) return "medium";
  if (score >= 50) return "high";
  return "critical";
}

/** Calculate Backup Safety Score (0-100). */
export function computeBackupSafetyScore(input: SafetyInput): BackupSafetyScore {
  // If not a git repository, backup is non-existent
  if (!input.isGit) {
    return {
      score: 0,
      status: "Critical",
      risk: "critical",
      penalties: [
        { reason: "no_git", label: "No Git repository initialized", points: 100 },
      ],
      recommendations: ["Initialize a Git repository to start backing up your project."],
    };
  }

  let score = 100;
  const penalties: BackupSafetyScore["penalties"] = [];
  const recommendations: string[] = [];

  // 1. No remote configured
  if (!input.hasRemote) {
    score -= 40;
    penalties.push({
      reason: "no_remote",
      label: "No remote repository configured",
      points: 40,
    });
    recommendations.push("Configure a remote git repository (e.g., origin on GitHub) to back up your code.");
  }

  // 2. Never pushed
  // We determine "Never pushed" if there's a remote URL but we have no tracking information or lastPushDate is null
  const hasRemoteButNeverPushed =
    input.hasRemote &&
    (!input.githubMetadata || (input.githubMetadata.exists && !input.githubMetadata.lastPushDate));
  
  if (hasRemoteButNeverPushed) {
    score -= 25;
    penalties.push({
      reason: "never_pushed",
      label: "Code has never been pushed to remote",
      points: 25,
    });
    recommendations.push("Perform your initial push to back up your commit history to the remote.");
  }

  // 3. Local commits not pushed
  if (input.unpushedCommits > 0) {
    score -= 15;
    penalties.push({
      reason: "unpushed_commits",
      label: `${input.unpushedCommits} local commit${input.unpushedCommits > 1 ? "s" : ""} not pushed`,
      points: 15,
    });
    recommendations.push(`Push your ${input.unpushedCommits} local commit${input.unpushedCommits > 1 ? "s" : ""} to secure them online.`);
  }

  // 4. Remote repository archived
  if (input.githubMetadata && input.githubMetadata.isArchived) {
    score -= 10;
    penalties.push({
      reason: "repo_archived",
      label: "Remote repository is archived",
      points: 10,
    });
    recommendations.push("This repository is archived on GitHub. Consider un-archiving if you are actively working on it.");
  }

  // 5. Staleness of last push (30d and 90d, non-cumulative)
  if (input.githubMetadata && input.githubMetadata.lastPushDate) {
    const lastPushAge = Date.now() - new Date(input.githubMetadata.lastPushDate).getTime();
    if (lastPushAge > NINETY_DAYS_MS) {
      score -= 25;
      penalties.push({
        reason: "stale_push_90d",
        label: "Last push was over 90 days ago",
        points: 25,
      });
      recommendations.push("Backup is highly outdated. Push your latest modifications to the remote repository.");
    } else if (lastPushAge > THIRTY_DAYS_MS) {
      score -= 10;
      penalties.push({
        reason: "stale_push_30d",
        label: "Last push was over 30 days ago",
        points: 10,
      });
      recommendations.push("Consider pushing your recent changes to ensure your remote backup stays fresh.");
    }
  }

  // Cap score at 0
  score = Math.max(0, score);

  let status: BackupSafetyScore["status"] = "Fully Synchronized";
  if (score < 50) {
    status = "Critical";
  } else if (score < 70) {
    status = "Unprotected";
  } else if (score < 85) {
    status = "At Risk";
  } else if (score < 100) {
    status = "Partially Protected";
  } else {
    status = "Protected";
  }

  // Special override: If fully synchronised (no unpushed commits, remote exists, pushed recently)
  if (score === 100) {
    status = "Fully Synchronized";
  }

  return {
    score,
    status,
    risk: scoreToRisk(score),
    penalties,
    recommendations,
  };
}

/** Calculate Recovery Readiness Score (0-100). */
export function computeRecoveryReadinessScore(input: SafetyInput): RecoveryReadinessScore {
  // If not a git repository, recovery readiness is critical
  if (!input.isGit) {
    return {
      score: 0,
      status: "Critical",
      risk: "critical",
      penalties: [
        { reason: "no_git", label: "No Git repository initialized", points: 100 },
      ],
      recommendations: ["Initialize a Git repository. Version control is the baseline for recovery."],
    };
  }

  let score = 100;
  const penalties: RecoveryReadinessScore["penalties"] = [];
  const recommendations: string[] = [];

  // 1. No remote configured
  if (!input.hasRemote) {
    score -= 30;
    penalties.push({
      reason: "no_remote",
      label: "No remote URL configured",
      points: 30,
    });
    recommendations.push("Add a remote origin so you can clone/reconstruct this repository from a cloud host.");
  }

  // 2. No README file
  if (!input.hasReadme) {
    score -= 20;
    penalties.push({
      reason: "no_readme",
      label: "Missing README documentation file",
      points: 20,
    });
    recommendations.push("Add a README.md file in the root to document installation, setup, and recovery steps.");
  }

  // 3. No .gitignore file
  if (!input.hasGitignore) {
    score -= 15;
    penalties.push({
      reason: "no_gitignore",
      label: "Missing .gitignore file",
      points: 15,
    });
    recommendations.push("Add a .gitignore file to exclude build directories, environment variables, and node_modules.");
  }

  // 4. No package/dependency manifest files
  if (!input.hasPackageFile) {
    score -= 15;
    penalties.push({
      reason: "no_package_file",
      label: "No dependency manifest file detected",
      points: 15,
    });
    recommendations.push("Include your dependency manifest (e.g. package.json, go.mod, Cargo.toml) for easy environment setup.");
  }

  // 5. Repository size > 1GB
  if (input.repoSizeBytes > ONE_GB_BYTES) {
    score -= 10;
    penalties.push({
      reason: "large_repo",
      label: "Repository size exceeds 1GB",
      points: 10,
    });
    recommendations.push("Optimize repository size by pruning large media assets or cleaning commit objects using git-filter-repo.");
  }

  // 6. No default branch configuration
  if (!input.defaultBranch) {
    score -= 10;
    penalties.push({
      reason: "no_default_branch",
      label: "No default branch configured",
      points: 10,
    });
    recommendations.push("Ensure your default branch (main/master) is tracked locally and configured on the remote.");
  }

  // Cap score at 0
  score = Math.max(0, score);

  let status: RecoveryReadinessScore["status"] = "Fully Ready";
  if (score < 50) {
    status = "Critical";
  } else if (score < 70) {
    status = "Not Ready";
  } else if (score < 90) {
    status = "Partially Ready";
  } else if (score < 100) {
    status = "Ready";
  } else {
    status = "Fully Ready";
  }

  return {
    score,
    status,
    risk: scoreToRisk(score),
    penalties,
    recommendations,
  };
}

export interface RiskAlert {
  projectId: string;
  projectName: string;
  severity: "critical" | "high" | "warning" | "healthy";
  type: "never_pushed" | "remote_deleted" | "unpushed_commits" | "stale_push" | "healthy";
  message: string;
}

/** Evaluate project alerts for the Disaster Prevention Center. */
export function deriveAlerts(
  projectId: string,
  projectName: string,
  backupScore: BackupSafetyScore,
  githubMetadata: GitHubMetadata | null,
  isGit: boolean,
  hasRemote: boolean,
  unpushedCommits: number
): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  if (!isGit) {
    alerts.push({
      projectId,
      projectName,
      severity: "critical",
      type: "never_pushed",
      message: "Project is not a Git repository and cannot be backed up.",
    });
    return alerts;
  }

  // CRITICAL: Project never pushed
  const hasNeverPushed =
    hasRemote &&
    (!githubMetadata || (githubMetadata.exists && !githubMetadata.lastPushDate));
  
  if (hasNeverPushed || !hasRemote) {
    alerts.push({
      projectId,
      projectName,
      severity: "critical",
      type: "never_pushed",
      message: "Project has never been pushed to a remote repository.",
    });
  }

  // HIGH: Remote deleted / inaccessible
  if (hasRemote && githubMetadata && !githubMetadata.exists) {
    alerts.push({
      projectId,
      projectName,
      severity: "high",
      type: "remote_deleted",
      message: "Configured remote repository appears deleted or inaccessible on GitHub.",
    });
  }

  // HIGH: Local commits not pushed
  if (unpushedCommits > 0) {
    alerts.push({
      projectId,
      projectName,
      severity: "high",
      type: "unpushed_commits",
      message: `Project has ${unpushedCommits} local commit${unpushedCommits > 1 ? "s" : ""} that only exist on this machine.`,
    });
  }

  // WARNING: Last push > 30 days
  if (githubMetadata && githubMetadata.lastPushDate) {
    const lastPushAge = Date.now() - new Date(githubMetadata.lastPushDate).getTime();
    if (lastPushAge > THIRTY_DAYS_MS) {
      const days = Math.floor(lastPushAge / (24 * 60 * 60 * 1000));
      alerts.push({
        projectId,
        projectName,
        severity: "warning",
        type: "stale_push",
        message: `Last backup push was ${days} days ago (exceeds 30 days).`,
      });
    }
  }

  // HEALTHY: Fully synchronized
  if (alerts.length === 0 && backupScore.score === 100) {
    alerts.push({
      projectId,
      projectName,
      severity: "healthy",
      type: "healthy",
      message: "Project is fully synchronized and protected.",
    });
  }

  return alerts;
}
