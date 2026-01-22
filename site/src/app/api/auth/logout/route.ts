import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { authLogger } from "@/lib/logger";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  try {
    await destroySession();
    authLogger.info({ requestId, event: "logout" }, "User logged out");
    return NextResponse.json({ success: true });
  } catch (error) {
    authLogger.error(
      { requestId, event: "logout_error", error: error instanceof Error ? error.message : error },
      "Logout error"
    );
    return NextResponse.json({ success: true }); // Still return success to client
  }
}
