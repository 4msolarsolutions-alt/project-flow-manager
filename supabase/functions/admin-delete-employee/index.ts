import { createClient } from "https://esm.sh/@supabase/supabase-js@2.94.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Verify caller is admin
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

    // Parse body
    const body = await req.json().catch(() => ({}));
    const userId = typeof body.user_id === "string" ? body.user_id.trim() : "";

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-deletion
    if (userId === callerId) {
      return new Response(JSON.stringify({ error: "You cannot delete your own account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Delete related records in order to satisfy foreign key constraints
    // These tables reference the user via submitted_by, approved_by, etc.
    const tables = [
      { table: "time_logs", column: "user_id" },
      { table: "expenses", column: "submitted_by" },
      { table: "tasks", column: "assigned_to" },
      { table: "tasks", column: "assigned_by" },
      { table: "daily_reports", column: "engineer_id" },
      { table: "notifications", column: "user_id" },
      { table: "payroll", column: "user_id" },
      { table: "user_roles", column: "user_id" },
    ];

    for (const { table, column } of tables) {
      const { error } = await adminClient
        .from(table)
        .delete()
        .eq(column, userId);
      
      if (error) {
        console.error(`Error deleting from ${table}: ${error.message}`);
        // Continue with other tables
      }
    }

    // Delete profile
    const { error: profileErr } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileErr) {
      console.error(`Error deleting profile: ${profileErr.message}`);
    }

    // Delete auth user
    const { error: authErr } = await adminClient.auth.admin.deleteUser(userId);

    if (authErr) {
      return new Response(
        JSON.stringify({ error: `Failed to delete auth user: ${authErr.message}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
