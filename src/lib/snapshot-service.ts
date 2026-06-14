import { promises as fs } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import type { ProjectSnapshot, SnapshotProjectState, SnapshotDiff, ProjectInfo } from "./types";

const CONFIG_DIR = join(os.homedir(), ".project-guardian");
const SNAPSHOTS_DIR = join(CONFIG_DIR, "snapshots");

/** Ensure snapshots folder exists. */
async function ensureSnapshotsDir(): Promise<void> {
  try {
    await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });
  } catch {
    // Ignore if exists
  }
}

/** Capture and save a snapshot of the current scanned projects list. */
export async function createSnapshot(projects: ProjectInfo[]): Promise<ProjectSnapshot> {
  await ensureSnapshotsDir();
  
  const timestamp = new Date().toISOString();
  const id = `snap-${Date.now()}`;
  
  const projectStates: Record<string, SnapshotProjectState> = {};
  let totalBackup = 0;
  let totalRecovery = 0;

  for (const p of projects) {
    projectStates[p.id] = {
      name: p.name,
      isGit: p.isGit,
      hasRemote: p.hasRemote,
      unpushedCommits: p.unpushedCommits,
      backupScore: p.backupSafetyScore.score,
      recoveryScore: p.recoveryReadinessScore.score,
      status: p.backupSafetyScore.status,
    };
    totalBackup += p.backupSafetyScore.score;
    totalRecovery += p.recoveryReadinessScore.score;
  }

  const snapshot: ProjectSnapshot = {
    id,
    timestamp,
    totalProjects: projects.length,
    averageBackupScore: projects.length > 0 ? Math.round(totalBackup / projects.length) : 0,
    averageRecoveryScore: projects.length > 0 ? Math.round(totalRecovery / projects.length) : 0,
    projectStates,
  };

  const filePath = join(SNAPSHOTS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
  return snapshot;
}

/** Get a list of all saved snapshots (newest first). */
export async function listSnapshots(): Promise<Omit<ProjectSnapshot, "projectStates">[]> {
  await ensureSnapshotsDir();
  try {
    const files = await fs.readdir(SNAPSHOTS_DIR);
    const snapshots: Omit<ProjectSnapshot, "projectStates">[] = [];

    for (const file of files) {
      if (file.endsWith(".json") && file.startsWith("snap-")) {
        const raw = await fs.readFile(join(SNAPSHOTS_DIR, file), "utf-8");
        const parsed = JSON.parse(raw) as ProjectSnapshot;
        // Exclude projectStates for compact list listings
        snapshots.push({
          id: parsed.id,
          timestamp: parsed.timestamp,
          totalProjects: parsed.totalProjects,
          averageBackupScore: parsed.averageBackupScore,
          averageRecoveryScore: parsed.averageRecoveryScore,
        });
      }
    }

    return snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

/** Fetch a full snapshot by ID. */
export async function getSnapshot(id: string): Promise<ProjectSnapshot | null> {
  await ensureSnapshotsDir();
  try {
    const raw = await fs.readFile(join(SNAPSHOTS_DIR, `${id}.json`), "utf-8");
    return JSON.parse(raw) as ProjectSnapshot;
  } catch {
    return null;
  }
}

/** Delete a snapshot by ID. */
export async function deleteSnapshot(id: string): Promise<void> {
  await ensureSnapshotsDir();
  try {
    await fs.unlink(join(SNAPSHOTS_DIR, `${id}.json`));
  } catch {
    // Ignore error
  }
}

/** Compare Snapshot A against Snapshot B. */
export function compareSnapshots(snapA: ProjectSnapshot, snapB: ProjectSnapshot): SnapshotDiff {
  const added: { id: string; name: string }[] = [];
  const removed: { id: string; name: string }[] = [];
  const scoreChanges: SnapshotDiff["scoreChanges"] = [];
  const missingRemotes: { id: string; name: string }[] = [];
  const backupStatusChanges: SnapshotDiff["backupStatusChanges"] = [];

  const statesA = snapA.projectStates;
  const statesB = snapB.projectStates;

  // 1. Added & Modified
  for (const [id, stateB] of Object.entries(statesB)) {
    const stateA = statesA[id];
    if (!stateA) {
      added.push({ id, name: stateB.name });
    } else {
      // Score changes
      if (stateB.backupScore !== stateA.backupScore) {
        scoreChanges.push({
          id,
          name: stateB.name,
          type: "backup",
          oldScore: stateA.backupScore,
          newScore: stateB.backupScore,
        });
      }
      if (stateB.recoveryScore !== stateA.recoveryScore) {
        scoreChanges.push({
          id,
          name: stateB.name,
          type: "recovery",
          oldScore: stateA.recoveryScore,
          newScore: stateB.recoveryScore,
        });
      }
      // Backup status changes
      if (stateB.status !== stateA.status) {
        backupStatusChanges.push({
          id,
          name: stateB.name,
          oldStatus: stateA.status,
          newStatus: stateB.status,
        });
      }
      // Missing remotes tracking (remote existed, now doesn't)
      if (stateA.hasRemote && !stateB.hasRemote) {
        missingRemotes.push({ id, name: stateB.name });
      }
    }
  }

  // 2. Removed
  for (const [id, stateA] of Object.entries(statesA)) {
    if (!statesB[id]) {
      removed.push({ id, name: stateA.name });
    }
  }

  return {
    added,
    removed,
    scoreChanges,
    missingRemotes,
    backupStatusChanges,
  };
}
