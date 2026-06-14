import { NextResponse } from "next/server";
import { generateMigrationReport } from "@/lib/migration-service";
import { scanCache } from "../../../lib/scan-cache";

export const dynamic = "force-dynamic";

/** GET /api/migration
 * Retrieve the Machine Migration Readiness Report.
 */
export async function GET() {
  try {
    const activeScan = scanCache.getLastScan();
    if (!activeScan || !activeScan.projects || activeScan.projects.length === 0) {
      return NextResponse.json(
        { error: "No active scan found. Run a folder scan first." },
        { status: 400 }
      );
    }

    const report = generateMigrationReport(activeScan.projects);
    return NextResponse.json({ report });
  } catch (err) {
    console.error("[/api/migration GET] failed:", err);
    return NextResponse.json(
      { error: "Failed to generate migration readiness report." },
      { status: 500 }
    );
  }
}
