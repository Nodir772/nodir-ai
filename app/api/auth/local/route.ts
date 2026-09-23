import { NextResponse } from "next/server";
import { AUTH_ERRORS, LOCAL_SESSION_COOKIE } from "@/lib/auth/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { limitRoute } from "@/lib/security/rate-limit";

type LocalUser = {
  id: string;
  email: string;
  name: string;
  plan: "pro_max";
};

function readUser(value: string | undefined): LocalUser | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as LocalUser;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCAL_SESSION_COOKIE}=`));
  const raw = cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : undefined;

  const stored = isSupabaseConfigured() ? null : readUser(raw);
  return NextResponse.json({
    supabaseConfigured: isSupabaseConfigured(),
    user: stored ? { ...stored, plan: "pro_max" as const } : null,
  });
}

export async function POST(request: Request) {
  const limited = limitRoute(request, "auth");
  if (!limited.ok) {
    return NextResponse.json({ error: AUTH_ERRORS.generic, code: "RATE_LIMIT" }, { status: 429 });
  }

  if (isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase sozlangan. Mahalliy sessiya ishlatilmaydi." },
      { status: 400 },
    );
  }

  const body = (await request.json()) as {
    action?: "login" | "register" | "logout";
    email?: string;
    password?: string;
    name?: string;
  };

  if (body.action === "logout") {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(LOCAL_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const name = body.name?.trim() || "Nodir";

  if (!email || !password) {
    return NextResponse.json({ error: AUTH_ERRORS.empty }, { status: 400 });
  }

  if (body.action === "register" && password.length < 8) {
    return NextResponse.json({ error: AUTH_ERRORS.weak }, { status: 400 });
  }

  const user: LocalUser = {
    id: `local-${email}`,
    email,
    name,
    plan: "pro_max",
  };

  const response = NextResponse.json({ user, supabaseConfigured: false });
  response.cookies.set(LOCAL_SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
