import { promises as fs } from "node:fs";
import os from "node:os";
import { join, basename } from "node:path";
import type { ProjectRegistryItem } from "./types";

const CONFIG_DIR = join(os.homedir(), ".project-guardian");
const REGISTRY_PATH = join(CONFIG_DIR, "registry.json");

/** Ensure config directory exists. */
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch {
    // Ignore if exists
  }
}

/** Get the entire project registry map. */
export async function getRegistry(): Promise<Record<string, ProjectRegistryItem>> {
  await ensureConfigDir();
  try {
    const raw = await fs.readFile(REGISTRY_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, ProjectRegistryItem>;
  } catch {
    return {};
  }
}

/** Save the entire project registry. */
export async function saveRegistry(registry: Record<string, ProjectRegistryItem>): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf-8");
}

/** Retrieve or initialize registry data for a project path. */
export async function getOrRegisterProject(
  id: string,
  localPath: string
): Promise<ProjectRegistryItem> {
  const registry = await getRegistry();
  const existing = registry[id];

  if (existing) {
    // Ensure localPath is up to date
    if (existing.localPath !== localPath) {
      existing.localPath = localPath;
      await saveRegistry(registry);
    }
    return existing;
  }

  // Register new item with defaults
  const newItem: ProjectRegistryItem = {
    id,
    name: basename(localPath),
    description: null,
    category: "Personal",
    client: null,
    status: "Active",
    repositoryUrl: null,
    deploymentUrl: null,
    localPath,
    technologyStack: [],
    notes: null,
    createdDate: new Date().toISOString(),
    archivedDate: null,
  };

  registry[id] = newItem;
  await saveRegistry(registry);
  return newItem;
}

/** Update specific metadata fields for a project registry item. */
export async function updateRegistryItem(
  id: string,
  updates: Partial<Omit<ProjectRegistryItem, "id" | "localPath">>
): Promise<ProjectRegistryItem> {
  const registry = await getRegistry();
  const existing = registry[id];

  if (!existing) {
    throw new Error(`Project with ID ${id} is not registered.`);
  }

  // Update fields
  const updatedItem: ProjectRegistryItem = {
    ...existing,
    ...updates,
    // Ensure stack is typed correctly
    technologyStack: updates.technologyStack 
      ? Array.isArray(updates.technologyStack) 
        ? updates.technologyStack 
        : (updates.technologyStack as string).split(",").map(s => s.trim()).filter(Boolean)
      : existing.technologyStack,
  };

  // Handle archived transition
  if (updates.status === "Archived" && !existing.archivedDate) {
    updatedItem.archivedDate = new Date().toISOString();
    updatedItem.category = "Archived";
  } else if (updates.status !== "Archived" && existing.status === "Archived") {
    updatedItem.archivedDate = null;
    if (updatedItem.category === "Archived") {
      updatedItem.category = "Personal"; // Fallback to Personal
    }
  }

  registry[id] = updatedItem;
  await saveRegistry(registry);
  return updatedItem;
}
