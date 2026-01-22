import { NextResponse } from "next/server";
import { createSession, validatePassword } from "@/lib/auth";
import { authLogger } from "@/lib/logger";

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  try {
    const { password } = await request.json();

    if (!validatePassword(password)) {
      authLogger.warn(
        { requestId, event: "login_failure", ip },
        "Failed login attempt"
      );
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await createSession();
    authLogger.info(
      { requestId, event: "login_success", ip },
      "Successful login"
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    authLogger.error(
      { requestId, event: "login_error", ip, error: error instanceof Error ? error.message : error },
      "Login error"
    );
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
