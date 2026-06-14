import { NextResponse } from "next/server";
import { getActivitySummary } from "@/lib/activity-service";
import { scanCache } from "../../../lib/scan-cache";

export const dynamic = "force-dynamic";

/** GET /api/activity
 * Retrieve daily, weekly, and monthly Git commit activity summaries.
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

    const summary = await getActivitySummary(activeScan.projects);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[/api/activity GET] failed:", err);
    return NextResponse.json(
      { error: "Failed to compile activity intelligence statistics." },
      { status: 500 }
    );
  }
}
