import { promises as fs } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import type { GitHubMetadata } from "./types";

const CONFIG_DIR = join(os.homedir(), ".project-guardian");
const SETTINGS_PATH = join(CONFIG_DIR, "settings.json");
const CACHE_PATH = join(CONFIG_DIR, "github-cache.json");

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache TTL

export interface AppSettings {
  githubToken: string | null;
}

/** Ensure the settings/cache directory exists. */
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch {
    // Ignore if directory exists
  }
}

/** Load application settings (including PAT). */
export async function getSettings(): Promise<AppSettings> {
  await ensureConfigDir();
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      githubToken: parsed.githubToken || null,
    };
  } catch {
    return { githubToken: null };
  }
}

/** Save application settings. */
export async function saveSettings(settings: AppSettings): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

/** Load GitHub cache from disk. */
async function getCache(): Promise<Record<string, GitHubMetadata>> {
  await ensureConfigDir();
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, GitHubMetadata>;
  } catch {
    return {};
  }
}

/** Save GitHub cache to disk. */
async function saveCache(cache: Record<string, GitHubMetadata>): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
}

/** Parse owner and repo from a Git remote URL. */
export function parseGitHubUrl(url: string | null): { owner: string; repo: string } | null {
  if (!url) return null;
  // Match git@github.com:owner/repo.git, https://github.com/owner/repo.git, etc.
  const regex = /github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/i;
  const match = url.match(regex);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
  };
}

/** Fetch repository metadata from GitHub. */
export async function fetchGitHubMetadata(
  remoteUrl: string | null,
  bypassCache = false
): Promise<GitHubMetadata | null> {
  if (!remoteUrl) return null;

  const parsed = parseGitHubUrl(remoteUrl);
  if (!parsed) return null; // Not a GitHub repository

  const cacheKey = `${parsed.owner}/${parsed.repo}`.toLowerCase();
  
  // Try the cache first unless bypassing
  if (!bypassCache) {
    const cache = await getCache();
    const cached = cache[cacheKey];
    if (cached) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age < CACHE_TTL_MS) {
        return cached;
      }
    }
  }

  // Retrieve settings to check for token
  const settings = await getSettings();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Project-Guardian-App",
  };

  if (settings.githubToken) {
    headers.Authorization = `token ${settings.githubToken}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers }
    );

    if (res.status === 404) {
      // Repository not found or deleted
      const metadata: GitHubMetadata = {
        exists: false,
        visibility: null,
        defaultBranch: null,
        lastPushDate: null,
        lastActivityDate: null,
        isArchived: false,
        htmlUrl: null,
        fetchedAt: new Date().toISOString(),
      };
      const cache = await getCache();
      cache[cacheKey] = metadata;
      await saveCache(cache);
      return metadata;
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.warn(`[GitHub API error ${res.status}]:`, errBody);
      // Return cached version or null if not available
      const cache = await getCache();
      return cache[cacheKey] || null;
    }

    interface GitHubRepoResponse {
      private: boolean;
      default_branch?: string;
      pushed_at?: string;
      updated_at?: string;
      archived?: boolean;
      html_url?: string;
    }

    const repoData = (await res.json()) as GitHubRepoResponse;

    const metadata: GitHubMetadata = {
      exists: true,
      visibility: repoData.private ? "private" : "public",
      defaultBranch: repoData.default_branch || null,
      lastPushDate: repoData.pushed_at || null,
      lastActivityDate: repoData.updated_at || null,
      isArchived: !!repoData.archived,
      htmlUrl: repoData.html_url || null,
      fetchedAt: new Date().toISOString(),
    };

    // Store in cache
    const cache = await getCache();
    cache[cacheKey] = metadata;
    await saveCache(cache);

    return metadata;
  } catch (err) {
    console.error(`[GitHub Service error for ${cacheKey}]:`, err);
    // Fall back to cache on network failure
    const cache = await getCache();
    return cache[cacheKey] || null;
  }
}
