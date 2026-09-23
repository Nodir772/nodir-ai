import { NextResponse, type NextRequest } from "next/server";
import { LOCAL_SESSION_COOKIE } from "@/lib/auth/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseUser } from "@/lib/supabase/proxy";
import { applySecurityHeaders } from "@/lib/security/headers";

function withHeaders(response: NextResponse) {
  applySecurityHeaders(response.headers);
  return response;
}

function isProtected(pathname: string) {
  return (
    pathname === "/home" ||
    pathname.startsWith("/home/") ||
    pathname === "/studio" ||
    pathname.startsWith("/studio/") ||
    pathname === "/projects" ||
    pathname.startsWith("/projects/") ||
    pathname === "/agents" ||
    pathname.startsWith("/agents/") ||
    pathname === "/tasks" ||
    pathname.startsWith("/tasks/") ||
    pathname === "/automations" ||
    pathname.startsWith("/automations/") ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    pathname.startsWith("/tools") ||
    pathname === "/voice" ||
    pathname.startsWith("/voice/") ||
    pathname === "/favorites" ||
    pathname.startsWith("/favorites/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname.startsWith("/api/studio") ||
    pathname.startsWith("/api/projects") ||
    pathname.startsWith("/api/agents") ||
    pathname.startsWith("/api/tasks") ||
    pathname.startsWith("/api/automations") ||
    pathname === "/api/chat" ||
    (pathname.startsWith("/api/ai") && pathname !== "/api/ai/status") ||
    pathname.startsWith("/api/images") ||
    pathname.startsWith("/api/documents") ||
    pathname.startsWith("/api/files") ||
    pathname === "/api/search" ||
    pathname === "/api/share" ||
    pathname === "/api/favorites" ||
    pathname.startsWith("/api/memories") ||
    pathname === "/api/usage" ||
    pathname.startsWith("/api/voice") ||
    pathname === "/api/account" ||
    pathname.startsWith("/api/account/") ||
    pathname === "/api/notifications" ||
    pathname === "/api/conversations" ||
    pathname.startsWith("/api/conversations/") ||
    pathname === "/api/profile" ||
    pathname === "/api/settings"
  );
}

function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isSupabaseConfigured()) {
    const { user, response } = await getSupabaseUser(request);

    if (isProtected(pathname) && !user) {
      if (pathname.startsWith("/api/")) {
        return withHeaders(
          NextResponse.json(
            { error: "Davom etish uchun tizimga kiring.", code: "UNAUTHORIZED" },
            { status: 401 },
          ),
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (isAuthPage(pathname) && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/chat";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return withHeaders(response);
  }

  const localSession = request.cookies.get(LOCAL_SESSION_COOKIE)?.value;

  if (isProtected(pathname) && !localSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Davom etish uchun tizimga kiring.", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage(pathname) && localSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/chat";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return withHeaders(NextResponse.next({ request }));
}

export const config = {
  matcher: [
    "/home",
    "/home/:path*",
    "/studio",
    "/studio/:path*",
    "/projects",
    "/projects/:path*",
    "/agents",
    "/agents/:path*",
    "/tasks",
    "/tasks/:path*",
    "/automations",
    "/automations/:path*",
    "/chat",
    "/chat/:path*",
    "/tools",
    "/tools/:path*",
    "/voice",
    "/voice/:path*",
    "/favorites",
    "/favorites/:path*",
    "/onboarding",
    "/settings",
    "/settings/:path*",
    "/api/studio/:path*",
    "/api/projects",
    "/api/projects/:path*",
    "/api/agents",
    "/api/agents/:path*",
    "/api/tasks",
    "/api/tasks/:path*",
    "/api/automations",
    "/api/automations/:path*",
    "/api/chat",
    "/api/ai/:path*",
    "/api/images",
    "/api/images/:path*",
    "/api/documents",
    "/api/documents/:path*",
    "/api/files/:path*",
    "/api/search",
    "/api/share",
    "/api/favorites",
    "/api/memories",
    "/api/memories/:path*",
    "/api/usage",
    "/api/voice/:path*",
    "/api/account",
    "/api/account/:path*",
    "/api/notifications",
    "/api/conversations/:path*",
    "/api/conversations",
    "/api/profile",
    "/api/settings",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
