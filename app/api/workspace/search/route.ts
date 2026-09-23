import { getRequestIdentity } from "@/lib/auth/request-user";
import { requireUser } from "@/lib/db/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { limitRoute } from "@/lib/security/rate-limit";

const FILTERS = ["all", "chats", "projects", "files"] as const;
type Filter = (typeof FILTERS)[number];

export async function GET(request: Request) {
  const identity = await getRequestIdentity(request);
  if (!identity) {
    return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  }
  const limited = limitRoute(request, "search", identity.plan);
  if (!limited.ok) return Response.json({ error: "So'rovlar juda ko'p." }, { status: 429 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const filterRaw = url.searchParams.get("filter") ?? "all";
  const filter: Filter = (FILTERS as readonly string[]).includes(filterRaw) ? (filterRaw as Filter) : "all";
  if (!q) return Response.json({ chats: [], projects: [], files: [], filter });
  if (q.length > 80) {
    return Response.json({ error: "Qidiruv so'rovi juda uzun." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return Response.json({ chats: [], projects: [], files: [], local: true, query: q, filter });
  }

  const { user, supabase } = await requireUser();
  if (!user || !supabase) {
    return Response.json({ error: "Davom etish uchun tizimga kiring." }, { status: 401 });
  }

  const like = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const includeChats = filter === "all" || filter === "chats";
  const includeProjects = filter === "all" || filter === "projects";
  const includeFiles = filter === "all" || filter === "files";

  const chats: { id: string; title: string; updatedAt: string }[] = [];
  const projects: { id: string; name: string; updatedAt: string }[] = [];
  const files: { id: string; filename: string; createdAt: string }[] = [];

  if (includeChats) {
    const { data: titled } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .ilike("title", like)
      .order("updated_at", { ascending: false })
      .limit(20);
    for (const row of titled ?? []) {
      chats.push({ id: row.id, title: row.title, updatedAt: row.updated_at });
    }
  }

  if (includeProjects) {
    const { data } = await supabase
      .from("projects")
      .select("id, name, updated_at")
      .eq("user_id", user.id)
      .or(`name.ilike.${like},description.ilike.${like}`)
      .order("updated_at", { ascending: false })
      .limit(20);
    for (const row of data ?? []) {
      projects.push({ id: row.id, name: row.name, updatedAt: row.updated_at });
    }
  }

  if (includeFiles) {
    const { data } = await supabase
      .from("documents")
      .select("id, filename, created_at")
      .eq("user_id", user.id)
      .ilike("filename", like)
      .order("created_at", { ascending: false })
      .limit(20);
    for (const row of data ?? []) {
      files.push({ id: row.id, filename: row.filename, createdAt: row.created_at });
    }
  }

  return Response.json({ chats, projects, files, filter, query: q });
}
