/**
 * Simple in-memory scan cache.
 *
 * After a scan completes, the API route stores results here so that
 * the /api/project endpoint can look up individual projects without
 * rescanning the entire tree.
 *
 * The cache is intentionally ephemeral (lost on server restart).
 * This is appropriate for a local-first tool.
 */

import type { ProjectInfo, ScanResponse } from "./types";

class ScanCache {
  private projects = new Map<string, ProjectInfo>();
  private lastResponse: ScanResponse | null = null;

  /** Store a full scan response. */
  store(response: ScanResponse): void {
    this.lastResponse = response;
    this.projects.clear();
    for (const project of response.projects) {
      this.projects.set(project.id, project);
    }
  }

  /** Look up a single project by ID. */
  getProject(id: string): ProjectInfo | undefined {
    return this.projects.get(id);
  }

  /** Get the last full scan response. */
  getLastScan(): ScanResponse | null {
    return this.lastResponse;
  }

  /** Number of cached projects. */
  get size(): number {
    return this.projects.size;
  }
}

/** Singleton cache instance, shared across API routes. */
export const scanCache = new ScanCache();
