import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/github-service";

export const dynamic = "force-dynamic";

/** GET /api/auth/github/status
 * Check if the user has a GitHub token configured.
 */
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      connected: !!settings.githubToken,
      hasToken: !!settings.githubToken,
    });
  } catch (err) {
    console.error("[/api/auth/github/status GET] failed:", err);
    return NextResponse.json(
      { error: "Failed to retrieve connection status." },
      { status: 500 }
    );
  }
}

/** POST /api/auth/github/status
 * Save or clear the GitHub Personal Access Token (PAT).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token: string | null };
    const settings = await getSettings();

    settings.githubToken = body.token ? body.token.trim() : null;
    await saveSettings(settings);

    return NextResponse.json({
      success: true,
      connected: !!settings.githubToken,
    });
  } catch (err) {
    console.error("[/api/auth/github/status POST] failed:", err);
    return NextResponse.json(
      { error: "Failed to save connection status." },
      { status: 500 }
    );
  }
}

/** DELETE /api/auth/github/status
 * Remove the GitHub connection token.
 */
export async function DELETE() {
  try {
    await saveSettings({ githubToken: null });
    return NextResponse.json({ success: true, connected: false });
  } catch (err) {
    console.error("[/api/auth/github/status DELETE] failed:", err);
    return NextResponse.json(
      { error: "Failed to reset connection status." },
      { status: 500 }
    );
  }
}
