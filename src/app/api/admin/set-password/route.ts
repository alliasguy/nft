import { NextResponse }            from "next/server";
import { createClient }            from "@/lib/supabase/server";
import { createClient as adminSb } from "@supabase/supabase-js";

export async function POST(req: Request) {
  /* Verify caller is an authenticated admin */
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await (sb as any)
    .from("profiles").select("role").eq("id", user.id).single();
  if ((profile as any)?.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { userId, newPassword } = await req.json();
  if (!userId || !newPassword || newPassword.length < 6)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey)
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });

  const admin = adminSb(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
