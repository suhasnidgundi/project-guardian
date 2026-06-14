import { NextRequest, NextResponse } from "next/server";
import {
  createSnapshot,
  listSnapshots,
  getSnapshot,
  deleteSnapshot,
  compareSnapshots,
} from "@/lib/snapshot-service";
import { scanCache } from "../../../lib/scan-cache";

export const dynamic = "force-dynamic";

/** GET /api/snapshots
 * Fetch snapshot list or compare two snapshot states.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const id1 = searchParams.get("id1");
    const id2 = searchParams.get("id2");

    if (action === "compare") {
      if (!id1 || !id2) {
        return NextResponse.json(
          { error: "Comparing snapshots requires 'id1' and 'id2' parameters." },
          { status: 400 }
        );
      }

      const snap1 = await getSnapshot(id1);
      const snap2 = await getSnapshot(id2);

      if (!snap1 || !snap2) {
        return NextResponse.json(
          { error: "One or both selected snapshot IDs could not be loaded." },
          { status: 404 }
        );
      }

      const diff = compareSnapshots(snap1, snap2);
      return NextResponse.json({ diff, snap1, snap2 });
    }

    const list = await listSnapshots();
    return NextResponse.json({ snapshots: list });
  } catch (err) {
    console.error("[/api/snapshots GET] failed:", err);
    return NextResponse.json(
      { error: "Failed to read snapshots." },
      { status: 500 }
    );
  }
}

/** POST /api/snapshots
 * Create a new snapshot or delete an existing one.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action: "create" | "delete";
      id?: string;
    };

    if (body.action === "create") {
      const activeScan = scanCache.getLastScan();
      if (!activeScan || !activeScan.projects || activeScan.projects.length === 0) {
        return NextResponse.json(
          { error: "No active project scan loaded. Run a workspace scan first." },
          { status: 400 }
        );
      }

      const snapshot = await createSnapshot(activeScan.projects);
      const updatedList = await listSnapshots();
      return NextResponse.json({ success: true, snapshot, snapshots: updatedList });
    }

    if (body.action === "delete") {
      if (!body.id) {
        return NextResponse.json(
          { error: "Snapshot 'id' is required for delete actions." },
          { status: 400 }
        );
      }

      await deleteSnapshot(body.id);
      const updatedList = await listSnapshots();
      return NextResponse.json({ success: true, snapshots: updatedList });
    }

    return NextResponse.json(
      { error: `Invalid snapshots action: ${body.action}` },
      { status: 400 }
    );
  } catch (err) {
    console.error("[/api/snapshots POST] failed:", err);
    return NextResponse.json(
      { error: "Failed to process snapshot request." },
      { status: 500 }
    );
  }
}
