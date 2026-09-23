import { requirePersistence } from "@/lib/db/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { favorite?: boolean };
  const { data, error } = await session.supabase
    .from("generated_images")
    .update({ favorite: Boolean(body.favorite) })
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select("id, favorite")
    .maybeSingle();
  if (error) return Response.json({ error: "Ma'lumotlarni saqlashda xatolik yuz berdi." }, { status: 500 });
  if (!data) return Response.json({ error: "Rasm topilmadi." }, { status: 404 });
  return Response.json({ image: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requirePersistence();
  if (session.error) return session.error;
  const { id } = await context.params;
  const { data, error } = await session.supabase
    .from("generated_images")
    .select("id, storage_path")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) return Response.json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi." }, { status: 500 });
  if (!data) return Response.json({ error: "Rasm topilmadi." }, { status: 404 });
  await session.supabase.storage.from("generated-images").remove([data.storage_path]);
  await session.supabase.from("generated_images").delete().eq("id", id).eq("user_id", session.user.id);
  return Response.json({ ok: true });
}
