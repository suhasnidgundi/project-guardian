import { NextRequest, NextResponse } from "next/server";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  clearAll,
} from "@/lib/notification-service";

export const dynamic = "force-dynamic";

/** GET /api/notifications
 * Fetch all generated notifications.
 */
export async function GET() {
  try {
    const list = await getNotifications();
    return NextResponse.json({ notifications: list });
  } catch (err) {
    console.error("[/api/notifications GET] failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}

/** POST /api/notifications
 * Manage notifications: read, read_all, dismiss, or clear.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action: "read" | "read_all" | "dismiss" | "clear";
      id?: string;
    };

    switch (body.action) {
      case "read":
        if (!body.id) {
          return NextResponse.json(
            { error: "Notification 'id' is required for read action." },
            { status: 400 }
          );
        }
        await markAsRead(body.id);
        break;

      case "read_all":
        await markAllAsRead();
        break;

      case "dismiss":
        if (!body.id) {
          return NextResponse.json(
            { error: "Notification 'id' is required for dismiss action." },
            { status: 400 }
          );
        }
        await dismissNotification(body.id);
        break;

      case "clear":
        await clearAll();
        break;

      default:
        return NextResponse.json(
          { error: `Invalid notifications action: ${body.action}` },
          { status: 400 }
        );
    }

    const updatedList = await getNotifications();
    return NextResponse.json({ notifications: updatedList });
  } catch (err) {
    console.error("[/api/notifications POST] failed:", err);
    return NextResponse.json(
      { error: "Failed to process notifications action." },
      { status: 500 }
    );
  }
}
