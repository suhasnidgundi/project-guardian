/**
 * GET /api/project?id=<projectId>
 *
 * Returns full project details for a single project.
 * Uses the cached scan data from the in-memory store, or
 * re-scans the individual directory if no cache is available.
 */

import { NextRequest, NextResponse } from "next/server";
import { stat } from "node:fs/promises";
import { scanProjects } from "@/lib/scanner";
import { decodeProjectId } from "@/lib/types";
import type { ProjectDetailResponse } from "@/lib/types";
import { scanCache } from "../../../lib/scan-cache";
import { enrichProjectSafety } from "../../../lib/backup-service";
import { getOrRegisterProject } from "../../../lib/registry-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Query parameter 'id' is required." },
        { status: 400 },
      );
    }

    // Try the cache first.
    const cached = scanCache.getProject(projectId);
    if (cached) {
      const registryMetadata = await getOrRegisterProject(cached.id, cached.path);
      const project = {
        ...cached,
        registryMetadata,
      };
      const response: ProjectDetailResponse = { project };
      return NextResponse.json(response);
    }

    // No cache — decode the ID and scan the single directory.
    let projectPath: string;
    try {
      projectPath = decodeProjectId(projectId);
    } catch {
      return NextResponse.json(
        { error: "Invalid project ID." },
        { status: 400 },
      );
    }

    // Validate the path still exists.
    try {
      const s = await stat(projectPath);
      if (!s.isDirectory()) {
        return NextResponse.json(
          { error: `"${projectPath}" is no longer a directory.` },
          { status: 404 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: `Project path "${projectPath}" no longer exists.` },
        { status: 404 },
      );
    }

    // Scan just the parent to discover this one project.
    // We pass the project's own path as root — scanner will detect it.
    const rawProjects = await scanProjects(projectPath);
    const rawProject = rawProjects[0];

    if (!rawProject) {
      return NextResponse.json(
        { error: "Could not inspect project." },
        { status: 500 },
      );
    }

    // Enrich the raw project details with Phase 3 calculations
    const safetyEnrichment = await enrichProjectSafety(
      rawProject.path,
      rawProject.isGit,
      rawProject.hasRemote,
      rawProject.remoteUrl,
      rawProject.unpushedCommits,
      rawProject.lastModified,
      rawProject.gitIntelligence?.repoSizeBytes ?? 0,
      rawProject.gitIntelligence?.defaultBranch ?? null
    );

    const registryMetadata = await getOrRegisterProject(rawProject.id, rawProject.path);
    const project = {
      ...rawProject,
      ...safetyEnrichment,
      registryMetadata,
    };

    const response: ProjectDetailResponse = { project };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/project] unhandled error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
