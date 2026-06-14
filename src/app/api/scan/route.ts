/**
 * POST /api/scan
 *
 * Accepts `{ rootPath: string }`, recursively scans the directory,
 * and returns a `ScanResponse` with every discovered project's
 * git health, risk level, and provider information.
 *
 * Results are cached in-memory for fast /api/project lookups.
 */

import { NextRequest, NextResponse } from "next/server";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { scanProjects } from "@/lib/scanner";
import { scanCache } from "../../../lib/scan-cache";
import { enrichProjectSafety } from "../../../lib/backup-service";
import { processSafetyAlerts } from "../../../lib/notification-service";
import { getOrRegisterProject } from "../../../lib/registry-service";
import type { ScanRequest, ScanResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
// Allow long scans for 500+ projects
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScanRequest;

    if (!body.rootPath || typeof body.rootPath !== "string") {
      return NextResponse.json(
        { error: "rootPath is required and must be a string." },
        { status: 400 },
      );
    }

    const rootPath = resolve(body.rootPath);

    // Validate the path exists and is a directory.
    try {
      const s = await stat(rootPath);
      if (!s.isDirectory()) {
        return NextResponse.json(
          { error: `"${rootPath}" is not a directory.` },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: `Path "${rootPath}" does not exist or is not accessible.` },
        { status: 400 },
      );
    }

    const startMs = performance.now();
    const rawProjects = await scanProjects(rootPath);

    // Enrich all discovered projects with backup safety, recovery readiness, and registry metadata in parallel
    const projects = await Promise.all(
      rawProjects.map(async (p) => {
        const safetyEnrichment = await enrichProjectSafety(
          p.path,
          p.isGit,
          p.hasRemote,
          p.remoteUrl,
          p.unpushedCommits,
          p.lastModified,
          p.gitIntelligence?.repoSizeBytes ?? 0,
          p.gitIntelligence?.defaultBranch ?? null
        );
        const registryMetadata = await getOrRegisterProject(p.id, p.path);
        return {
          ...p,
          ...safetyEnrichment,
          registryMetadata,
        };
      })
    );

    const scanDurationMs = Math.round(performance.now() - startMs);

    const response: ScanResponse = {
      projects,
      scannedAt: new Date().toISOString(),
      rootPath,
      scanDurationMs,
    };

    // Run notifications comparisons against the previous cache
    const lastScan = scanCache.getLastScan();
    const previousProjects = lastScan ? lastScan.projects : [];
    await processSafetyAlerts(projects, previousProjects);

    // Cache for fast /api/project lookups.
    scanCache.store(response);

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/scan] unhandled error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during scanning." },
      { status: 500 },
    );
  }
}
