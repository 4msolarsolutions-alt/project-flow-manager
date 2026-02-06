import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to verify authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { paths, bucket = "site-visits", expiresIn = 3600 } = await req.json();

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return new Response(JSON.stringify({ error: "paths array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client to generate signed URLs
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check user authorization - must be admin, employee, or have access to the lead
    const { data: profile } = await adminClient
      .from("profiles")
      .select("login_type")
      .eq("id", user.id)
      .single();

    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "admin") ?? false;
    const isEmployee = profile?.login_type === "employee";
    const isProjectManager = roles?.some((r) => r.role === "project_manager") ?? false;

    if (!isAdmin && !isEmployee && !isProjectManager) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate signed URLs for each path
    const signedUrls: { path: string; signedUrl: string | null; error?: string }[] = [];

    for (const path of paths) {
      // Extract the file path from the full URL if needed
      let filePath = path;
      if (path.includes("/storage/v1/object/public/")) {
        filePath = path.split("/storage/v1/object/public/site-visits/")[1];
      } else if (path.includes("/storage/v1/object/sign/")) {
        filePath = path.split("/storage/v1/object/sign/site-visits/")[1]?.split("?")[0];
      }

      if (!filePath) {
        signedUrls.push({ path, signedUrl: null, error: "Invalid path format" });
        continue;
      }

      const { data, error } = await adminClient.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        signedUrls.push({ path, signedUrl: null, error: error.message });
      } else {
        signedUrls.push({ path, signedUrl: data.signedUrl });
      }
    }

    return new Response(JSON.stringify({ signedUrls }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
