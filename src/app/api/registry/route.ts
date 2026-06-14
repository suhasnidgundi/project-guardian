import { NextRequest, NextResponse } from "next/server";
import { getRegistry, updateRegistryItem } from "@/lib/registry-service";
import type { ProjectRegistryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/registry
 * Retrieve the active portfolio registry database map.
 */
export async function GET() {
  try {
    const db = await getRegistry();
    return NextResponse.json({ registry: db });
  } catch (err) {
    console.error("[/api/registry GET] failed:", err);
    return NextResponse.json(
      { error: "Failed to read project registry database." },
      { status: 500 }
    );
  }
}

/** POST /api/registry
 * Update custom metadata fields for a project registry item.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      id: string;
      updates: Partial<Omit<ProjectRegistryItem, "id" | "localPath">>;
    };

    if (!body.id || !body.updates) {
      return NextResponse.json(
        { error: "id and updates arguments are required." },
        { status: 400 }
      );
    }

    const updatedItem = await updateRegistryItem(body.id, body.updates);
    return NextResponse.json({ success: true, project: updatedItem });
  } catch (err) {
    console.error("[/api/registry POST] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update project metadata." },
      { status: 500 }
    );
  }
}
