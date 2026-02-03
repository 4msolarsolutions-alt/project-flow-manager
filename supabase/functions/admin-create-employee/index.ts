// Lovable Cloud backend function: create an employee user + profile + roles
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole =
  | "admin"
  | "accounts"
  | "hr"
  | "project_manager"
  | "senior_engineer"
  | "site_supervisor"
  | "solar_engineer"
  | "junior_technician"
  | "storekeeper";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isEmail(v: unknown): v is string {
  if (!isNonEmptyString(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isPhone(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const t = v.trim();
  if (!t) return true;
  if (t.length > 30) return false;
  return /^[+0-9][0-9\s-]{6,}$/.test(t);
}

const allowedRoles = new Set<AppRole>([
  "admin",
  "accounts",
  "hr",
  "project_manager",
  "senior_engineer",
  "site_supervisor",
  "solar_engineer",
  "junior_technician",
  "storekeeper",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Verify caller is authenticated AND is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = userData.user.id;
    const { data: isAdmin, error: adminErr } = await userClient.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });

    if (adminErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Parse + validate payload
    const body = await req.json().catch(() => ({}));
    const first_name = typeof body.first_name === "string" ? body.first_name.trim() : "";
    const last_name = typeof body.last_name === "string" ? body.last_name.trim() : null;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;
    const roles: AppRole[] = Array.isArray(body.roles)
      ? body.roles.filter((r: unknown) => typeof r === "string" && allowedRoles.has(r as AppRole))
      : [];

    if (!isNonEmptyString(first_name) || first_name.length > 60) {
      return new Response(JSON.stringify({ error: "Invalid first_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isEmail(email) || email.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (last_name && last_name.length > 60) {
      return new Response(JSON.stringify({ error: "Invalid last_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (phone && !isPhone(phone)) {
      return new Response(JSON.stringify({ error: "Invalid phone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Service client to create/invite user and write DB rows
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Invite user by email so they set their password themselves.
    const { data: inviteData, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name,
        last_name: last_name ?? "",
        login_type: "employee",
      },
    });

    if (inviteErr || !inviteData?.user) {
      return new Response(
        JSON.stringify({ error: inviteErr?.message ?? "Failed to invite user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newUserId = inviteData.user.id;

    // Ensure profile exists (some setups don’t auto-create profiles on invite)
    const { error: profileErr } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: newUserId,
          email,
          first_name,
          last_name,
          phone,
          login_type: "employee",
          is_active: true,
        },
        { onConflict: "id" }
      );

    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (roles.length) {
      const uniqueRoles = Array.from(new Set(roles));
      const rows = uniqueRoles.map((role) => ({ user_id: newUserId, role }));
      const { error: rolesErr } = await adminClient.from("user_roles").insert(rows);

      // If duplicates exist, ignore, but do not fail the whole flow.
      if (rolesErr && !rolesErr.message.toLowerCase().includes("duplicate")) {
        return new Response(JSON.stringify({ error: rolesErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ id: newUserId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
