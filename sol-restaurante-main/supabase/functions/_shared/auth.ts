// Shared auth helper for edge functions.
// Validates the caller's JWT, resolves their tenant, and (optionally) checks roles.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

export type AppRole = "admin" | "operator" | "cozinha" | "estoque" | "super_admin";

export async function requireAuth(req: Request, allowedRoles?: AppRole[]) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { error: new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 }) };
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) {
    return { error: new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 }) };
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roleRows } = await admin
    .from("user_roles")
    .select("role, tenant_id")
    .eq("user_id", user.id);
  const rows = roleRows ?? [];
  const userRoles = rows.map((r: { role: string }) => r.role);

  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRoles.some((r) => allowedRoles.includes(r as AppRole))) {
      return { error: new Response(JSON.stringify({ ok: false, error: "Forbidden" }), { status: 403 }) };
    }
  }

  // Tenant of the caller. Super admins may operate outside a tenant.
  const tenantId =
    (rows.find((r: { tenant_id: string | null }) => r.tenant_id)?.tenant_id as string | null) ?? null;
  const isSuperAdmin = userRoles.includes("super_admin");

  if (!tenantId && !isSuperAdmin) {
    return { error: new Response(JSON.stringify({ ok: false, error: "Tenant not resolved" }), { status: 403 }) };
  }

  return { user, roles: userRoles, tenantId, isSuperAdmin };
}
