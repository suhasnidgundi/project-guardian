import { promises as fs } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import type { AppNotification, ProjectInfo } from "./types";

const CONFIG_DIR = join(os.homedir(), ".project-guardian");
const NOTIFICATIONS_PATH = join(CONFIG_DIR, "notifications.json");

/** Ensure the settings/cache directory exists. */
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch {
    // Ignore if directory exists
  }
}

/** Get all persisted notifications. */
export async function getNotifications(): Promise<AppNotification[]> {
  await ensureConfigDir();
  try {
    const raw = await fs.readFile(NOTIFICATIONS_PATH, "utf-8");
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

/** Save notifications back to disk. */
export async function saveNotifications(notifications: AppNotification[]): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(NOTIFICATIONS_PATH, JSON.stringify(notifications, null, 2), "utf-8");
}

/** Add a new notification (prevents duplicates). */
export async function addNotification(
  projectId: string,
  projectName: string,
  type: AppNotification["type"],
  message: string
): Promise<AppNotification> {
  const notifications = await getNotifications();

  // Check if a duplicate exists (same project, type, and message) to avoid spamming
  const duplicate = notifications.find(
    (n) => n.projectId === projectId && n.type === type && n.message === message
  );

  if (duplicate) {
    return duplicate;
  }

  const newNotification: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    projectId,
    projectName,
    type,
    message,
    timestamp: new Date().toISOString(),
    read: false,
  };

  notifications.unshift(newNotification);
  await saveNotifications(notifications);
  return newNotification;
}

/** Mark a notification as read. */
export async function markAsRead(id: string): Promise<void> {
  const notifications = await getNotifications();
  const index = notifications.findIndex((n) => n.id === id);
  if (index !== -1 && notifications[index]) {
    notifications[index].read = true;
    await saveNotifications(notifications);
  }
}

/** Mark all notifications as read. */
export async function markAllAsRead(): Promise<void> {
  const notifications = await getNotifications();
  for (const n of notifications) {
    n.read = true;
  }
  await saveNotifications(notifications);
}

/** Dismiss a notification (remove from list). */
export async function dismissNotification(id: string): Promise<void> {
  const notifications = await getNotifications();
  const filtered = notifications.filter((n) => n.id !== id);
  await saveNotifications(filtered);
}

/** Clear all notifications. */
export async function clearAll(): Promise<void> {
  await saveNotifications([]);
}

/** Evaluate project states and trigger notifications. */
export async function processSafetyAlerts(
  currentProjects: ProjectInfo[],
  previousProjects: ProjectInfo[] = []
): Promise<void> {
  const prevMap = new Map<string, ProjectInfo>();
  for (const p of previousProjects) {
    prevMap.set(p.id, p);
  }

  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

  for (const project of currentProjects) {
    const prev = prevMap.get(project.id);

    // Rule 1: Backup safety score dropped
    if (prev && project.backupSafetyScore.score < prev.backupSafetyScore.score) {
      await addNotification(
        project.id,
        project.name,
        "error",
        `Backup safety score dropped from ${prev.backupSafetyScore.score} to ${project.backupSafetyScore.score}.`
      );
    }

    // Rule 2: Repository missing remote
    if (project.isGit && !project.hasRemote) {
      await addNotification(
        project.id,
        project.name,
        "warning",
        `Repository "${project.name}" is missing a configured remote URL. Local work is not backed up.`
      );
    }

    // Rule 3: Project not pushed for 14 days
    if (project.githubMetadata && project.githubMetadata.lastPushDate) {
      const pushAge = Date.now() - new Date(project.githubMetadata.lastPushDate).getTime();
      if (pushAge > FOURTEEN_DAYS_MS) {
        const days = Math.floor(pushAge / (24 * 60 * 60 * 1000));
        await addNotification(
          project.id,
          project.name,
          "warning",
          `Project "${project.name}" has not been pushed to remote for ${days} days.`
        );
      }
    }

    // Rule 4: New local commits detected
    if (project.unpushedCommits > 0) {
      // If unpushed commits count increased, trigger error notification
      const prevUnpushed = prev ? prev.unpushedCommits : 0;
      if (project.unpushedCommits > prevUnpushed) {
        await addNotification(
          project.id,
          project.name,
          "info",
          `New local commit${project.unpushedCommits - prevUnpushed > 1 ? "s" : ""} detected in "${project.name}" that have not been pushed.`
        );
      }
    }
  }
}
